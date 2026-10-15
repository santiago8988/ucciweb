import { expect, test } from "@playwright/test";

// HTTP-level checks: run once (desktop project).
test.describe("seguridad", () => {
  test.skip(({ isMobile }) => isMobile, "una sola vez");

  test("headers de seguridad y sin x-powered-by", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["x-powered-by"]).toBeUndefined();
    for (const name of [
      "content-security-policy",
      "x-frame-options",
      "x-content-type-options",
      "referrer-policy",
      "permissions-policy",
      "strict-transport-security",
    ]) {
      expect(h[name], name).toBeTruthy();
    }
  });

  test("el optimizador de imágenes rechaza dominios ajenos", async ({ request }) => {
    const foreign = encodeURIComponent("https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png");
    const res = await request.get(`/_next/image?url=${foreign}&w=640&q=75`);
    expect(res.status()).toBe(400);
  });

  test("el listado no expone campos internos ni ocultos", async ({ request }) => {
    const html = await (await request.get("/propiedades?vendidas=1")).text();
    for (const field of ["latitude", "longitude", "streetNumber", "internalCode", "agentId", "salePrice", "hideLocation", "hideSalePrice"]) {
      expect(html.includes(`\\"${field}\\"`) || html.includes(`"${field}"`), field).toBe(false);
    }
  });

  test("un precio oculto no se deduce ordenando por precio", async ({ request }) => {
    const html = await (await request.get("/propiedades?sort=price_asc")).text();
    const prices = [...html.matchAll(/sm:text-2xl">([^<]+)</g)].map((m) => m[1]);
    test.skip(!prices.includes("Consultar valor"), "no hay propiedades con precio oculto");
    const firstHidden = prices.indexOf("Consultar valor");
    expect(prices.slice(firstHidden).every((p) => p === "Consultar valor" || !/US\$|\$/.test(p))).toBe(true);
  });

  test("/api/revalidate exige autenticación", async ({ request }) => {
    const res = await request.post("/api/revalidate", { data: { table: "properties" } });
    expect([401, 503]).toContain(res.status());
  });

  test("/api/revalidate con secreto invalida la caché", async ({ request }) => {
    const secret = process.env.REVALIDATE_SECRET;
    test.skip(!secret || !!process.env.E2E_BASE_URL, "requiere REVALIDATE_SECRET y servidor local");
    const res = await request.post("/api/revalidate", {
      headers: { authorization: `Bearer ${secret}` },
      data: { table: "property_images", record: {} },
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ revalidated: true });

    const other = await request.post("/api/revalidate", {
      headers: { authorization: `Bearer ${secret}` },
      data: { table: "properties", record: { organization_id: "otra-inmobiliaria" } },
    });
    expect(await other.json()).toMatchObject({ revalidated: false });
  });
});
