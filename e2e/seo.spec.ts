import { expect, test } from "@playwright/test";
import { listingIds, WHATSAPP_UA } from "./helpers";

test.describe("SEO", () => {
  test.skip(({ isMobile }) => isMobile, "una sola vez");

  test("ficha: metadata, Open Graph y JSON-LD", async ({ request }) => {
    const [id] = await listingIds(request);
    const html = await (await request.get(`/propiedades/${id}`, { headers: { "user-agent": WHATSAPP_UA } })).text();

    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
    expect(description).not.toContain("undefined");
    expect(description.length).toBeGreaterThan(20);
    expect(html).toMatch(/property="og:image" content="[^"]*\/_next\/image\?url=/);
    expect(html).toMatch(/property="og:url"/);
    expect(html).toMatch(new RegExp(`rel="canonical" href="[^"]*/propiedades/${id}"`));

    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => {
      const parsed = JSON.parse(m[1]);
      return Array.isArray(parsed) ? parsed : [parsed];
    });
    const types = blocks.map((b) => b["@type"]);
    expect(types).toEqual(expect.arrayContaining(["RealEstateAgent", "RealEstateListing", "BreadcrumbList"]));
    const listing = blocks.find((b) => b["@type"] === "RealEstateListing");
    expect(listing.url).toContain(`/propiedades/${id}`);
    if (html.includes("Consultar valor")) expect(listing.offers.price).toBeUndefined();
  });

  test("listado: canonical y noindex en combinaciones de filtros", async ({ request }) => {
    const plain = await (await request.get("/propiedades", { headers: { "user-agent": WHATSAPP_UA } })).text();
    expect(plain).toMatch(/rel="canonical" href="[^"]*\/propiedades"/);
    expect(plain).not.toMatch(/<meta name="robots" content="noindex/);

    const filtered = await (await request.get("/propiedades?tipo=casa", { headers: { "user-agent": WHATSAPP_UA } })).text();
    expect(filtered).toMatch(/<meta name="robots" content="noindex, follow"/);
    expect(filtered).toMatch(/rel="canonical" href="[^"]*\/propiedades"/);
  });

  test("sitemap con las fichas publicadas", async ({ request }) => {
    const ids = await listingIds(request);
    const sitemap = await (await request.get("/sitemap.xml")).text();
    for (const id of ids) expect(sitemap).toContain(`/propiedades/${id}`);
  });

  test("redirecciones desde el sitio anterior", async ({ request }) => {
    const res = await request.get("/venta", { maxRedirects: 0 });
    expect([301, 308]).toContain(res.status());
    expect(res.headers()["location"]).toContain("/propiedades?op=venta");
  });

  test("404 en español", async ({ request }) => {
    const res = await request.get("/esta-pagina-no-existe");
    expect(res.status()).toBe(404);
    expect(await res.text()).toContain("No encontramos lo que buscabas");
  });
});
