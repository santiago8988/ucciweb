import type { APIRequestContext, Page } from "@playwright/test";

export const PROPERTY_LINK = /\/propiedades\/([0-9a-f-]{36})/g;

/** Property ids in order of appearance in a listing URL. */
export async function listingIds(request: APIRequestContext, path = "/propiedades"): Promise<string[]> {
  const html = await (await request.get(path)).text();
  return [...new Set([...html.matchAll(PROPERTY_LINK)].map((m) => m[1]))];
}

/** Total shown in the listing header ("N resultados"). */
export function listingTotal(html: string): number {
  return Number(html.match(/font-semibold text-ink">(\d+)/)?.[1] ?? NaN);
}

/** Id of the first card in a listing page whose badges include `label`. */
export function idWithBadge(html: string, label: string): string | null {
  const cards = html.split(/href="\/propiedades\/(?=[0-9a-f-]{36}")/).slice(1);
  const card = cards.find((c) => c.slice(0, c.indexOf("</article>")).includes(`>${label}<`));
  return card ? card.slice(0, 36) : null;
}

/** Scroll through the page so lazy content renders, then report document width. */
export async function documentWidth(page: Page): Promise<number> {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
  });
  return page.evaluate(() => document.documentElement.scrollWidth);
}

/** Horizontal swipe with pointer events over an element. */
export async function swipeLeft(page: Page, selector: string) {
  const box = await page.locator(selector).first().boundingBox();
  if (!box) throw new Error(`no box for ${selector}`);
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.8, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, y, { steps: 8 });
  await page.mouse.up();
}

export const WHATSAPP_UA = "WhatsApp/2.23.20.0";
