# Local Events Dashboard

Enter a zip code and a mile radius, and get a dashboard of current and upcoming
events nearby: the most popular ones first with large image previews and links
to their websites, then a filterable list below.

No API keys required — events come from public pages that publish
[schema.org](https://schema.org/Event) JSON-LD.

## Running

```bash
npm install
npm run dev   # http://localhost:3000
```

## How it works

- `src/lib/geo.ts` — zip → lat/lng via the free Zippopotam.us API, plus a
  haversine distance helper.
- `src/lib/jsonld.ts` + `src/lib/normalize.ts` — generic schema.org JSON-LD
  extractor: pulls every `Event`-like node out of a page and normalizes it
  (title, date, venue, geo, image, price).
- `src/lib/sources/eventbrite.ts` — scrapes Eventbrite's public city search
  pages. The `free--events` / `paid--events` variants give a reliable
  free-vs-ticketed signal that individual listings often omit.
- `src/lib/sources/calendars.ts` — any other public calendar that publishes
  JSON-LD. Add URLs with the `EXTRA_CALENDAR_URLS` env var (comma separated).
- `src/lib/sources/community.ts` — neighborhood staples (Music on the Square,
  Foster City Summer Days, Head West) that never appear on ticketing platforms,
  modeled as recurring series and expanded into upcoming dates. Recurrence
  windows follow each event's published schedule and should be re-checked
  yearly.
- `src/lib/aggregate.ts` — merges sources, dedupes, resolves missing
  coordinates from postal codes, filters by radius, and scores popularity.
  Results are cached in memory for 15 minutes per zip/radius.

### Popularity ranking

Public calendars expose no attendance numbers, so popularity is a heuristic:
imagery, recognized local series, listing richness, free admission, proximity,
and how soon the event starts. The top three ranked events become the featured
hero cards.

## Filters

Date (today / this weekend / next 7 / next 30 / all), radius (up to the radius
you searched with), free vs ticketed, and a text search.

## Adding a source

Write a function returning `EventItem[]` and call it in
`getEvents()` in `src/lib/aggregate.ts`. If the source is an HTML page with
JSON-LD, `fetchHtml` + `extractJsonLdBlocks` + `collectEventNodes` +
`normalizeEvent` handle it in a few lines. If you later get an API key
(Ticketmaster, SeatGeek), it drops in the same way.
