/**
 * Normalize any YouTube / Vimeo url into a safe <iframe src> value.
 * Accepts the url in any of its usual forms (watch, youtu.be, shorts,
 * embed, nocookie, vimeo page, vimeo player) and returns the embed url.
 * Returns null if the url doesn't look like a supported video provider.
 */
export function toEmbedUrl(rawUrl: string): string | null {
  if (!rawUrl) return null;

  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

  // --- YouTube ---------------------------------------------------------------
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    // /watch?v=VIDEO_ID
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      if (!id) return null;
      const t = url.searchParams.get("t") ?? url.searchParams.get("start");
      const start = t ? `?start=${parseStartSeconds(t)}` : "";
      return `https://www.youtube.com/embed/${id}${start}`;
    }
    // /shorts/VIDEO_ID
    if (url.pathname.startsWith("/shorts/")) {
      const id = url.pathname.split("/")[2];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    // /embed/VIDEO_ID → already embed, keep query (autoplay, start, etc.)
    if (url.pathname.startsWith("/embed/")) {
      return `https://www.youtube.com${url.pathname}${url.search}`;
    }
    // /v/VIDEO_ID (legacy)
    if (url.pathname.startsWith("/v/")) {
      const id = url.pathname.split("/")[2];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    return null;
  }

  // --- Vimeo -----------------------------------------------------------------
  if (host === "vimeo.com") {
    // Regular: vimeo.com/VIDEO_ID
    // Private:  vimeo.com/VIDEO_ID/HASH
    const [, id, hash] = url.pathname.split("/");
    if (!id || !/^\d+$/.test(id)) return null;
    return hash
      ? `https://player.vimeo.com/video/${id}?h=${hash}`
      : `https://player.vimeo.com/video/${id}`;
  }

  if (host === "player.vimeo.com") {
    // Already an embed url, keep as-is
    return rawUrl;
  }

  return null;
}

function parseStartSeconds(raw: string): number {
  // Accepts "90", "1m30s", "1h2m3s"
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  const match = raw.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
  if (!match) return 0;
  const [, h, m, s] = match;
  return (parseInt(h ?? "0", 10) * 3600) + (parseInt(m ?? "0", 10) * 60) + parseInt(s ?? "0", 10);
}
