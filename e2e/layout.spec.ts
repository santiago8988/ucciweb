import { expect, test } from "@playwright/test";
import { documentWidth, listingIds, listingTotal } from "./helpers";

// Regression guard for the S22 bug: pages must never be wider than the phone.
test.describe("sin desborde horizontal a 360 px", () => {
  test.skip(({ isMobile }) => !isMobile, "solo mobile");

  for (const path of ["/", "/propiedades", "/contacto", "/nosotros", "/favoritos", "/privacidad"]) {
    test(path, async ({ page }) => {
      await page.goto(path);
      expect(await documentWidth(page)).toBe(360);
    });
  }

  test("ficha con galería", async ({ page, request }) => {
    const [id] = await listingIds(request);
    await page.goto(`/propiedades/${id}`);
    expect(await documentWidth(page)).toBe(360);
  });

  test("paginación en la última página", async ({ page, request }) => {
    const total = listingTotal(await (await request.get("/propiedades")).text());
    const last = Math.max(1, Math.ceil(total / 12));
    await page.goto(`/propiedades?page=${last}`);
    expect(await documentWidth(page)).toBe(360);
  });
});
