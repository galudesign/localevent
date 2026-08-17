import { JsonObject, num, obj, priceTypeFromOffers, str } from "./jsonld";
import { EventItem, PriceType } from "./types";

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function clean(text: string | null): string {
  if (!text) return "";
  return decodeEntities(text.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

const FREE_RE = /\b(free admission|free entry|free event|no cover|free!?)\b/i;

function detectPriceType(node: JsonObject, text: string): PriceType {
  const fromOffers = priceTypeFromOffers(node.offers);
  if (fromOffers !== "unknown") return fromOffers;
  if (FREE_RE.test(text)) return "free";
  return "unknown";
}

function toIso(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function normalizeEvent(
  node: JsonObject,
  source: string,
  forcedPriceType?: PriceType,
): EventItem | null {
  const title = clean(str(node.name));
  const url = str(node.url);
  const startDate = toIso(str(node.startDate));
  if (!title || !url || !startDate) return null;

  const place = obj(node.location);
  const address = place ? obj(place.address) : null;
  const geo = place ? obj(place.geo) : null;
  const description = clean(str(node.description));
  const priceType =
    forcedPriceType ?? detectPriceType(node, `${title} ${description}`);

  return {
    id: url,
    title,
    description,
    url,
    imageUrl: str(node.image),
    startDate,
    endDate: toIso(str(node.endDate)),
    venueName: place ? clean(str(place.name)) || null : null,
    city: address ? clean(str(address.addressLocality)) || null : null,
    state: address ? clean(str(address.addressRegion)) || null : null,
    postalCode: address ? clean(str(address.postalCode)) || null : null,
    latitude: geo ? num(geo.latitude) : null,
    longitude: geo ? num(geo.longitude) : null,
    priceType,
    source,
    distanceMiles: null,
    popularity: 0,
  };
}
