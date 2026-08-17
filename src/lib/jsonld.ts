import { PriceType } from "./types";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

const SCRIPT_RE =
  /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

export function extractJsonLdBlocks(html: string): JsonValue[] {
  const blocks: JsonValue[] = [];
  let match: RegExpExecArray | null;
  SCRIPT_RE.lastIndex = 0;
  while ((match = SCRIPT_RE.exec(html)) !== null) {
    const raw = match[1].trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw) as JsonValue);
    } catch {
      // Malformed JSON-LD blocks are common in the wild; skip them.
    }
  }
  return blocks;
}

function isObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const EVENT_TYPES = new Set([
  "event",
  "musicevent",
  "festival",
  "socialevent",
  "foodevent",
  "sportsevent",
  "theaterevent",
  "comedyevent",
  "screeningevent",
  "educationevent",
  "exhibitionevent",
  "businessevent",
  "childrensevent",
  "danceevent",
  "literaryevent",
  "visualartsevent",
  "publicationevent",
]);

function typeMatchesEvent(value: JsonValue): boolean {
  if (typeof value === "string") return EVENT_TYPES.has(value.toLowerCase());
  if (Array.isArray(value)) return value.some(typeMatchesEvent);
  return false;
}

/** Recursively collects every schema.org Event-like node in a JSON-LD tree. */
export function collectEventNodes(value: JsonValue): JsonObject[] {
  const found: JsonObject[] = [];
  const visit = (node: JsonValue) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!isObject(node)) return;
    if (typeMatchesEvent(node["@type"])) found.push(node);
    Object.values(node).forEach(visit);
  };
  visit(value);
  return found;
}

export function str(value: JsonValue | undefined): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = str(item);
      if (found) return found;
    }
    return null;
  }
  if (isObject(value)) {
    return str(value.url ?? value.name ?? value["@id"] ?? value.contentUrl ?? null);
  }
  return null;
}

export function num(value: JsonValue | undefined): number | null {
  const asString = str(value);
  if (asString === null) return null;
  const parsed = Number(asString);
  return Number.isFinite(parsed) ? parsed : null;
}

export function obj(value: JsonValue | undefined): JsonObject | null {
  if (isObject(value)) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      if (isObject(item)) return item;
    }
  }
  return null;
}

/** Reads schema.org `offers` to decide whether an event is free or ticketed. */
export function priceTypeFromOffers(offers: JsonValue | undefined): PriceType {
  const list = Array.isArray(offers) ? offers : offers ? [offers] : [];
  let sawOffer = false;
  for (const offer of list) {
    const offerObj = obj(offer);
    if (!offerObj) continue;
    sawOffer = true;
    const price =
      num(offerObj.price) ??
      num(obj(offerObj.priceSpecification)?.price ?? null) ??
      num(offerObj.lowPrice);
    if (price === null) continue;
    if (price > 0) return "ticketed";
    if (price === 0) return "free";
  }
  return sawOffer ? "unknown" : "unknown";
}
