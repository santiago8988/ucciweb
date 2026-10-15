import { expect, test } from "@playwright/test";
import { idWithBadge, listingIds, listingTotal, swipeLeft } from "./helpers";

test.describe("ficha de propiedad", () => {
  test("contacto: WhatsApp visible sin scroll en mobile y con link de la ficha", async ({ page, request, isMobile }) => {
    const [id] = await listingIds(request);
    await page.goto(`/propiedades/${id}`);
    const wa = page.locator('a[data-track="whatsapp"]');
    const hrefs = await wa.evaluateAll((els) => els.map((a) => decodeURIComponent(a.getAttribute("href") ?? "")));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href).toContain(`/propiedades/${id}`);
    if (isMobile) {
      const bar = page.locator(".fixed a[data-track='whatsapp']");
      await expect(bar).toBeInViewport();
    }
  });

  test("compartir copia el link cuando no hay share nativo", async ({ page, context, request, browserName }) => {
    test.skip(browserName !== "chromium", "permisos de clipboard");
    const [id] = await listingIds(request);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, "share", { value: undefined, configurable: true });
    });
    await page.goto(`/propiedades/${id}`);
    await page.getByRole("button", { name: "Compartir" }).click();
    await expect(page.getByRole("button", { name: "Link copiado" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(`/propiedades/${id}`);
  });

  test("propiedades similares y una sola tarjeta de agente", async ({ page, request }) => {
    const [id] = await listingIds(request);
    await page.goto(`/propiedades/${id}`);
    const similares = page.locator("#similares-titulo ~ div a[href^='/propiedades/']");
    expect(await similares.count()).toBeLessThanOrEqual(3);
    await expect(page.getByText("Agente inmobiliario")).toHaveCount(0);
  });

  test("galería: flechas visibles en touch, swipe y visor con teclado", async ({ page, request, isMobile }) => {
    test.skip(!isMobile, "touch");
    const ids = await listingIds(request);
    // A listing with more than one photo.
    let found = false;
    for (const id of ids) {
      await page.goto(`/propiedades/${id}`);
      if ((await page.locator('button[aria-label="Imagen siguiente"]').count()) > 0) {
        found = true;
        break;
      }
    }
    test.skip(!found, "no hay fichas con varias fotos");

    const next = page.locator('button[aria-label="Imagen siguiente"]').first();
    expect(await next.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");

    const counter = page.locator('[aria-live="polite"].pointer-events-none');
    const before = (await counter.textContent())?.replace(/\s/g, "");
    await swipeLeft(page, 'button[aria-label^="Ampliar imagen"]');
    await expect(counter).not.toHaveText(before ?? "", { useInnerText: true });
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.locator('button[aria-label^="Ampliar imagen"]').focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("desktop: flechas ocultas hasta hover", async ({ page, request, isMobile }) => {
    test.skip(isMobile, "desktop");
    const ids = await listingIds(request);
    for (const id of ids) {
      await page.goto(`/propiedades/${id}`);
      const arrow = page.locator('button[aria-label="Imagen siguiente"]');
      if ((await arrow.count()) === 0) continue;
      expect(await arrow.evaluate((el) => getComputedStyle(el).opacity)).toBe("0");
      return;
    }
    test.skip(true, "no hay fichas con varias fotos");
  });

  test("vendida por link directo: badge y aviso", async ({ page, request }) => {
    const all = await (await request.get("/propiedades?vendidas=1")).text();
    const last = Math.max(1, Math.ceil(listingTotal(all) / 12));
    const id = idWithBadge(await (await request.get(`/propiedades?vendidas=1&page=${last}`)).text(), "Vendida");
    test.skip(!id, "no hay vendidas publicadas");
    await page.goto(`/propiedades/${id}`);
    await expect(page.getByText("Esta propiedad ya fue vendida", { exact: false })).toBeVisible();
    await expect(page.getByText("¿Buscás algo parecido?")).toBeVisible();
  });
});
