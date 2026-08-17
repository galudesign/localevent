import { geocodeZip, haversineMiles, isValidZip } from "./geo";
import { fetchCalendarEvents } from "./sources/calendars";
import { communityEvents } from "./sources/community";
import { fetchEventbriteEvents } from "./sources/eventbrite";
import { EventItem, EventsResponse, GeoPoint } from "./types";

const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_ZIP_LOOKUPS = 12;

const cache = new Map<string, { at: number; value: EventsResponse }>();

function dedupe(events: EventItem[]): EventItem[] {
  const byKey = new Map<string, EventItem>();
  for (const event of events) {
    const key = `${event.title.toLowerCase()}|${event.startDate.slice(0, 10)}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, event);
      continue;
    }
    // Prefer the richer record, but keep any definitive price signal.
    const merged: EventItem = {
      ...existing,
      imageUrl: existing.imageUrl ?? event.imageUrl,
      hasTime: existing.hasTime || event.hasTime,
      description:
        existing.description.length >= event.description.length
          ? existing.description
          : event.description,
      priceType:
        existing.priceType !== "unknown" ? existing.priceType : event.priceType,
      latitude: existing.latitude ?? event.latitude,
      longitude: existing.longitude ?? event.longitude,
    };
    byKey.set(key, merged);
  }
  return [...byKey.values()];
}

/** Fills in coordinates for events that only published a postal code. */
async function resolveMissingCoordinates(events: EventItem[]): Promise<void> {
  const zips = new Set<string>();
  for (const event of events) {
    if (event.latitude === null && event.postalCode && isValidZip(event.postalCode)) {
      zips.add(event.postalCode);
    }
    if (zips.size >= MAX_ZIP_LOOKUPS) break;
  }
  const resolved = new Map<string, GeoPoint>();
  await Promise.all(
    [...zips].map(async (zip) => {
      try {
        resolved.set(zip, await geocodeZip(zip));
      } catch {
        // Ignore unresolvable zips; the event just keeps an unknown distance.
      }
    }),
  );
  for (const event of events) {
    if (event.latitude !== null || !event.postalCode) continue;
    const point = resolved.get(event.postalCode);
    if (!point) continue;
    event.latitude = point.latitude;
    event.longitude = point.longitude;
  }
}

/**
 * Popularity proxy: public calendars expose no attendance counts, so rank on
 * signals that correlate with reach (imagery, recognized local series,
 * richness of the listing) and slightly favor events happening soon.
 */
function scorePopularity(event: EventItem): number {
  let score = event.popularity;
  if (event.imageUrl) score += 25;
  if (event.description.length > 120) score += 10;
  else if (event.description.length > 40) score += 5;
  if (event.venueName) score += 5;
  if (event.priceType === "free") score += 5;

  const days =
    (new Date(event.startDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000);
  if (days <= 7) score += 15;
  else if (days <= 21) score += 8;

  if (event.distanceMiles !== null) {
    score += Math.max(0, 10 - event.distanceMiles / 3);
  }
  return Math.round(score);
}

export async function getEvents(
  zip: string,
  radiusMiles: number,
): Promise<EventsResponse> {
  const cacheKey = `${zip}:${radiusMiles}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  const origin = await geocodeZip(zip);
  const warnings: string[] = [];

  const [eventbrite, calendars] = await Promise.all([
    fetchEventbriteEvents(origin).catch(() => [] as EventItem[]),
    fetchCalendarEvents().catch(() => [] as EventItem[]),
  ]);
  if (eventbrite.length === 0) {
    warnings.push(
      "Eventbrite returned no listings for this area (rate limited or unsupported city).",
    );
  }

  const all = dedupe([...eventbrite, ...calendars, ...communityEvents()]);
  await resolveMissingCoordinates(all);

  const now = Date.now();
  const events = all
    .filter((event) => new Date(event.endDate ?? event.startDate).getTime() >= now)
    .map((event) => {
      const distanceMiles =
        event.latitude !== null && event.longitude !== null
          ? Math.round(
              haversineMiles(
                origin.latitude,
                origin.longitude,
                event.latitude,
                event.longitude,
              ) * 10,
            ) / 10
          : null;
      const withDistance = { ...event, distanceMiles };
      return { ...withDistance, popularity: scorePopularity(withDistance) };
    })
    .filter(
      (event) => event.distanceMiles === null || event.distanceMiles <= radiusMiles,
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const value: EventsResponse = {
    origin,
    radiusMiles,
    events,
    sources: [...new Set(events.map((event) => event.source))],
    warnings,
    fetchedAt: new Date().toISOString(),
  };
  cache.set(cacheKey, { at: Date.now(), value });
  return value;
}
