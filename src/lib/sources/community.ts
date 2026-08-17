import { EventItem } from "../types";

const SOURCE = "community-calendar";

interface CommunitySeries {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  venueName: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  priceType: "free" | "ticketed";
  /** 0 = Sunday. Omit for one-off / multi-day festivals. */
  weekday?: number;
  /** Inclusive 1-based month window the series usually runs in. */
  months: number[];
  startHour: number;
  durationHours: number;
  /** Baseline popularity for well-known local staples. */
  popularityBoost: number;
}

/**
 * Neighborhood staples (street fairs, concert series, markets) rarely appear
 * on ticketing platforms, so they are modeled here as recurring series and
 * expanded into upcoming occurrences. Recurrence windows follow each event's
 * published schedule and should be re-checked yearly.
 */
const SERIES: CommunitySeries[] = [
  {
    id: "music-on-the-square",
    title: "Music on the Square",
    description:
      "Free outdoor concert series on Courthouse Square in downtown Redwood City, with live bands, food trucks and beer garden.",
    url: "https://www.redwoodcity.org/residents/community-events/music-on-the-square",
    imageUrl: null,
    venueName: "Courthouse Square",
    city: "Redwood City",
    state: "CA",
    postalCode: "94063",
    latitude: 37.4852,
    longitude: -122.2286,
    priceType: "free",
    weekday: 5,
    months: [6, 7, 8, 9],
    startHour: 18,
    durationHours: 2,
    popularityBoost: 30,
  },
  {
    id: "foster-city-summer-days",
    title: "Foster City Summer Days",
    description:
      "Foster City's summer celebration at Leo J. Ryan Park: live music, carnival rides, food vendors and fireworks over the lagoon.",
    url: "https://www.fostercity.org/parksandrec/page/summer-days",
    imageUrl: null,
    venueName: "Leo J. Ryan Park",
    city: "Foster City",
    state: "CA",
    postalCode: "94404",
    latitude: 37.5539,
    longitude: -122.2666,
    priceType: "free",
    months: [7],
    startHour: 12,
    durationHours: 8,
    popularityBoost: 35,
  },
  {
    id: "head-west-san-mateo",
    title: "Head West Marketplace — San Mateo",
    description:
      "Outdoor maker market at the San Mateo County Event Center with local artists, vintage sellers, food and live DJs.",
    url: "https://www.headwestmarketplace.com/",
    imageUrl: null,
    venueName: "San Mateo County Event Center",
    city: "San Mateo",
    state: "CA",
    postalCode: "94403",
    latitude: 37.5416,
    longitude: -122.3,
    priceType: "free",
    weekday: 6,
    months: [4, 5, 6, 7, 8, 9, 10],
    startHour: 11,
    durationHours: 6,
    popularityBoost: 25,
  },
];

function occurrencesFor(series: CommunitySeries, horizonDays: number): Date[] {
  const now = new Date();
  const dates: Date[] = [];
  for (let offset = 0; offset < horizonDays; offset++) {
    const day = new Date(now);
    day.setDate(now.getDate() + offset);
    if (!series.months.includes(day.getMonth() + 1)) continue;
    if (series.weekday !== undefined && day.getDay() !== series.weekday)
      continue;
    if (series.weekday === undefined && dates.length > 0) continue;
    day.setHours(series.startHour, 0, 0, 0);
    dates.push(new Date(day));
  }
  return dates;
}

export function communityEvents(horizonDays = 120): EventItem[] {
  return SERIES.flatMap((series) =>
    occurrencesFor(series, horizonDays).map((start) => {
      const end = new Date(start);
      end.setHours(start.getHours() + series.durationHours);
      return {
        id: `${series.id}-${start.toISOString().slice(0, 10)}`,
        title: series.title,
        description: series.description,
        url: series.url,
        imageUrl: series.imageUrl,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        venueName: series.venueName,
        city: series.city,
        state: series.state,
        postalCode: series.postalCode,
        latitude: series.latitude,
        longitude: series.longitude,
        priceType: series.priceType,
        source: SOURCE,
        distanceMiles: null,
        popularity: series.popularityBoost,
      } satisfies EventItem;
    }),
  );
}
