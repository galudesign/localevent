"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import EventList from "@/components/EventList";
import FeaturedEvents from "@/components/FeaturedEvents";
import Filters, { FilterState } from "@/components/Filters";
import ZipSetup from "@/components/ZipSetup";
import { applyFilters } from "@/lib/filter";
import { EventsResponse } from "@/lib/types";

const STORAGE_KEY = "local-events:location";

interface Location {
  zip: string;
  radius: number;
}

export default function Home() {
  const [location, setLocation] = useState<Location | null>(null);
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<EventsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    datePreset: "all",
    radius: 25,
    price: "all",
    query: "",
  });

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Location;
        setLocation(parsed);
        setFilters((current) => ({ ...current, radius: parsed.radius }));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setReady(true);
  }, []);

  const load = useCallback(async (next: Location) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/events?zip=${next.zip}&radius=${next.radius}`,
      );
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Failed to load events.");
      setData(payload as EventsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location) void load(location);
  }, [location, load]);

  const chooseLocation = (zip: string, radius: number) => {
    const next = { zip, radius };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setLocation(next);
    setFilters({ datePreset: "all", radius, price: "all", query: "" });
  };

  const visible = useMemo(
    () => (data ? applyFilters(data.events, filters) : []),
    [data, filters],
  );
  const featured = useMemo(
    () => [...visible].sort((a, b) => b.popularity - a.popularity).slice(0, 3),
    [visible],
  );
  const featuredIds = new Set(featured.map((event) => event.id));
  const rest = visible.filter((event) => !featuredIds.has(event.id));

  if (!ready) return null;

  if (!location) {
    return <ZipSetup onSubmit={chooseLocation} />;
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Events near {data?.origin.city ?? location.zip}
            {data?.origin.state ? `, ${data.origin.state}` : ""}
          </h1>
          <p className="text-sm text-slate-500">
            {location.zip} · searched within {location.radius} miles
            {data ? ` · ${data.events.length} events found` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load(location)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              window.localStorage.removeItem(STORAGE_KEY);
              setLocation(null);
              setData(null);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
          >
            Change location
          </button>
        </div>
      </header>

      {loading && (
        <div className="grid gap-4 md:grid-cols-5">
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200 md:col-span-3" />
          <div className="grid gap-4 md:col-span-2">
            <div className="h-44 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-44 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      {!loading && data && (
        <div className="space-y-8">
          <FeaturedEvents events={featured} />

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              All events ({visible.length})
            </h2>
            <Filters
              state={filters}
              maxRadius={location.radius}
              onChange={setFilters}
            />
            <EventList events={rest} />
          </section>

          {data.warnings.length > 0 && (
            <ul className="text-xs text-slate-400">
              {data.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </main>
  );
}
