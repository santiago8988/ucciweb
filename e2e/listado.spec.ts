import { expect, test } from "@playwright/test";
import { idWithBadge, listingTotal } from "./helpers";

test.describe("búsqueda y listado", () => {
  test("el buscador de la home manda op y q", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Buscar por barrio, dirección o característica").fill("pileta");
    await page.getByRole("button", { name: "Buscar" }).click();
    await page.waitForURL(/\/propiedades\?/);
    const url = new URL(page.url());
    expect(url.searchParams.get("op")).toBe("venta");
    expect(url.searchParams.get("q")).toBe("pileta");
  });

  test("panel de filtros mobile: un título y 'Ver N propiedades'", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile");
    await page.goto("/propiedades");
    const total = Number(await page.locator("p.whitespace-nowrap span").first().textContent());
    await page.getByRole("button", { name: "Filtros" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /filtros/i })).toHaveCount(1);
    const cta = dialog.getByRole("button", { name: /^Ver \d+ propiedad/ });
    await expect(cta).toHaveText(`Ver ${total} ${total === 1 ? "propiedad" : "propiedades"}`);

    await dialog.getByRole("button", { name: "Terreno" }).click();
    await page.waitForURL(/tipo=terreno/);
    await expect(cta).not.toHaveText(`Ver ${total} propiedades`);
    await cta.click();
    await expect(dialog).toBeHidden();
  });

  test("volver desde la ficha conserva los filtros", async ({ page }) => {
    await page.goto("/propiedades?op=venta");
    await page.locator("a[href^='/propiedades/']").first().click();
    await page.waitForURL(/\/propiedades\/[0-9a-f-]{36}/);
    const back = page.getByRole("link", { name: "Volver a los resultados" });
    await expect(back).toHaveAttribute("href", /op=venta/);
  });

  test("estado vacío: avisame por WhatsApp y limpiar filtros", async ({ page }) => {
    await page.goto(`/propiedades?op=venta&tipo=galpon&bar=${encodeURIComponent("Barrio inexistente")}`);
    const wa = page.getByRole("link", { name: /Avisame por WhatsApp|Consultar alquileres/ });
    await expect(wa).toBeVisible();
    expect(decodeURIComponent((await wa.getAttribute("href")) ?? "")).toMatch(/galpón en venta en Barrio inexistente/i);
    await expect(page.getByRole("link", { name: "Limpiar filtros" })).toHaveAttribute("href", "/propiedades");
  });

  test("las reservadas se listan con badge; las vendidas solo con el filtro", async ({ request }) => {
    const plain = await (await request.get("/propiedades")).text();
    expect(plain).not.toContain(">Vendida<");
    const withSold = await (await request.get("/propiedades?vendidas=1")).text();
    expect(listingTotal(withSold)).toBeGreaterThanOrEqual(listingTotal(plain));
  });

  test("favoritos: una vendida guardada aparece con badge", async ({ page, request }) => {
    const all = await (await request.get("/propiedades?vendidas=1")).text();
    const last = Math.max(1, Math.ceil(listingTotal(all) / 12));
    const soldId = idWithBadge(await (await request.get(`/propiedades?vendidas=1&page=${last}`)).text(), "Vendida");
    test.skip(!soldId, "no hay vendidas publicadas");
    await page.goto("/");
    await page.evaluate((id) => localStorage.setItem("ucci:favorites", JSON.stringify([id])), soldId);
    await page.goto("/favoritos");
    // Favorites load through a server action: allow for a cold serverless start.
    await expect(page.locator(`a[href="/propiedades/${soldId}"]`)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(`a[href="/propiedades/${soldId}"]`).getByText("Vendida")).toBeVisible();
  });
});
