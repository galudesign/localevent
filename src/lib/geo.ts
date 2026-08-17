import { GeoPoint } from "./types";

const EARTH_RADIUS_MILES = 3958.8;

export function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a));
}

interface ZippopotamResponse {
  "post code": string;
  places: {
    "place name": string;
    "state abbreviation": string;
    latitude: string;
    longitude: string;
  }[];
}

const zipCache = new Map<string, GeoPoint>();

export function isValidZip(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}

export async function geocodeZip(zip: string): Promise<GeoPoint> {
  const cached = zipCache.get(zip);
  if (cached) return cached;

  const res = await fetch(`https://api.zippopotam.us/us/${zip}`, {
    next: { revalidate: 60 * 60 * 24 * 30 },
  });
  if (!res.ok) {
    throw new Error(`Unknown zip code ${zip}`);
  }
  const data = (await res.json()) as ZippopotamResponse;
  const place = data.places?.[0];
  if (!place) throw new Error(`Unknown zip code ${zip}`);

  const point: GeoPoint = {
    latitude: Number(place.latitude),
    longitude: Number(place.longitude),
    city: place["place name"],
    state: place["state abbreviation"],
    postalCode: data["post code"],
  };
  zipCache.set(zip, point);
  return point;
}
