"use client";

import Image from "next/image";
import { formatEventDate, priceLabel } from "@/lib/format";
import { EventItem } from "@/lib/types";

function EventRow({ event }: { event: EventItem }) {
  return (
    <a
      href={event.url}
      target="_blank"
      rel="noreferrer"
      className="flex gap-4 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-400 hover:shadow-sm"
    >
      <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-slate-200">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            sizes="128px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-800 p-2 text-center text-xs font-medium text-white">
            {event.title.slice(0, 40)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-slate-900">{event.title}</h3>
        <p className="mt-0.5 text-sm text-slate-600">
          {formatEventDate(event.startDate, event.hasTime)}
          {event.venueName ? ` · ${event.venueName}` : ""}
          {event.city ? ` · ${event.city}` : ""}
        </p>
        {event.description && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
            {event.description}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span
            className={`rounded-full px-2 py-0.5 font-medium ${
              event.priceType === "free"
                ? "bg-emerald-100 text-emerald-800"
                : event.priceType === "ticketed"
                  ? "bg-indigo-100 text-indigo-800"
                  : "bg-slate-100 text-slate-600"
            }`}
          >
            {priceLabel(event.priceType)}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
            {event.distanceMiles !== null
              ? `${event.distanceMiles} mi away`
              : "Distance unknown"}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
            {event.source}
          </span>
        </div>
      </div>
    </a>
  );
}

export default function EventList({ events }: { events: EventItem[] }) {
  if (events.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
        No events match these filters. Try widening the radius or date range.
      </p>
    );
  }
  return (
    <div className="grid gap-3">
      {events.map((event) => (
        <EventRow key={event.id} event={event} />
      ))}
    </div>
  );
}
