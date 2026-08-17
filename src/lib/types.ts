export type PriceType = "free" | "ticketed" | "unknown";

export interface EventItem {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  startDate: string;
  endDate: string | null;
  venueName: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  priceType: PriceType;
  source: string;
  distanceMiles: number | null;
  popularity: number;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  postalCode: string;
}

export interface EventsResponse {
  origin: GeoPoint;
  radiusMiles: number;
  events: EventItem[];
  sources: string[];
  warnings: string[];
  fetchedAt: string;
}
