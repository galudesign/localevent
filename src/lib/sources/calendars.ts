import { fetchHtml } from "../http";
import { collectEventNodes, extractJsonLdBlocks } from "../jsonld";
import { normalizeEvent } from "../normalize";
import { EventItem } from "../types";

/**
 * Any public calendar page that publishes schema.org JSON-LD can be added
 * here (or via the EXTRA_CALENDAR_URLS env var, comma separated) and it will
 * be scraped with the same generic parser.
 */
const DEFAULT_CALENDAR_URLS: string[] = [];

export function calendarUrls(): string[] {
  const extra = (process.env.EXTRA_CALENDAR_URLS ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
  return [...DEFAULT_CALENDAR_URLS, ...extra];
}

export async function fetchCalendarEvents(): Promise<EventItem[]> {
  const urls = calendarUrls();
  if (urls.length === 0) return [];

  const results = await Promise.all(
    urls.map(async (url) => {
      const html = await fetchHtml(url);
      if (!html) return [];
      const host = new URL(url).hostname.replace(/^www\./, "");
      return extractJsonLdBlocks(html)
        .flatMap(collectEventNodes)
        .map((node) => normalizeEvent(node, host))
        .filter((event): event is EventItem => event !== null);
    }),
  );
  return results.flat();
}
