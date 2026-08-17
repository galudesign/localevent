"use client";

import Image from "next/image";
import { formatEventDate, priceLabel } from "@/lib/format";
import { EventItem } from "@/lib/types";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-600 p-6 text-center text-xl font-semibold text-white">
      {title}
    </div>
  );
}

function FeaturedCard({ event, large }: { event: EventItem; large: boolean }) {
  return (
    <a
      href={event.url}
      target="_blank"
      rel="noreferrer"
      className={`group relative block overflow-hidden rounded-2xl bg-slate-900 ${
        large ? "h-96 md:h-[28rem]" : "h-44 md:h-[13.5rem]"
      }`}
    >
      <div className="absolute inset-0">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            sizes={large ? "(min-width: 768px) 60vw, 100vw" : "(min-width: 768px) 40vw, 100vw"}
            className="object-cover transition duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <Placeholder title={event.title} />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="mb-2 flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full bg-white/90 px-2 py-1 text-slate-900">
            {priceLabel(event.priceType)}
          </span>
          {event.distanceMiles !== null && (
            <span className="rounded-full bg-white/20 px-2 py-1 text-white">
              {event.distanceMiles} mi
            </span>
          )}
          <span className="rounded-full bg-white/20 px-2 py-1 text-white">
            {event.source}
          </span>
        </div>
        <h3
          className={`font-semibold text-white ${large ? "text-2xl md:text-3xl" : "text-lg"}`}
        >
          {event.title}
        </h3>
        <p className="mt-1 text-sm text-slate-200">
          {formatEventDate(event.startDate)}
          {event.venueName ? ` · ${event.venueName}` : ""}
        </p>
      </div>
    </a>
  );
}

export default function FeaturedEvents({ events }: { events: EventItem[] }) {
  if (events.length === 0) return null;
  const [hero, ...rest] = events;

  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Most popular right now
      </h2>
      <div className="grid gap-4 md:grid-cols-5">
        <div className="md:col-span-3">
          <FeaturedCard event={hero} large />
        </div>
        <div className="grid gap-4 md:col-span-2">
          {rest.slice(0, 2).map((event) => (
            <FeaturedCard key={event.id} event={event} large={false} />
          ))}
        </div>
      </div>
    </section>
  );
}
