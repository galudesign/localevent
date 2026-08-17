import { fetchHtml } from "../http";
import { collectEventNodes, extractJsonLdBlocks } from "../jsonld";
import { normalizeEvent } from "../normalize";
import { EventItem, GeoPoint, PriceType } from "../types";

const SOURCE = "eventbrite";
const PAGES_PER_QUERY = 2;

function citySlug(point: GeoPoint): string {
  const city = point.city
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${point.state.toLowerCase()}--${city}`;
}

/**
 * Eventbrite renders its public city search pages with schema.org JSON-LD,
 * so no API key is needed. The `free--events` variant gives a reliable
 * free/ticketed signal that individual listings often omit.
 */
export async function fetchEventbriteEvents(
  point: GeoPoint,
): Promise<EventItem[]> {
  const slug = citySlug(point);
  const queries: { path: string; priceType?: PriceType }[] = [
    { path: "all-events" },
    { path: "free--events", priceType: "free" },
    { path: "paid--events", priceType: "ticketed" },
  ];

  const requests: Promise<EventItem[]>[] = [];
  for (const query of queries) {
    for (let page = 1; page <= PAGES_PER_QUERY; page++) {
      const url = `https://www.eventbrite.com/d/${slug}/${query.path}/?page=${page}`;
      requests.push(
        fetchHtml(url).then((html) => {
          if (!html) return [];
          return extractJsonLdBlocks(html)
            .flatMap(collectEventNodes)
            .map((node) => normalizeEvent(node, SOURCE, query.priceType))
            .filter((event): event is EventItem => event !== null);
        }),
      );
    }
  }

  const results = await Promise.all(requests);
  return results.flat();
}
