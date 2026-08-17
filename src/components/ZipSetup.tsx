"use client";

import { FormEvent, useState } from "react";

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

interface Props {
  onSubmit: (zip: string, radius: number) => void;
  initialZip?: string;
  initialRadius?: number;
}

export default function ZipSetup({
  onSubmit,
  initialZip = "",
  initialRadius = 25,
}: Props) {
  const [zip, setZip] = useState(initialZip);
  const [radius, setRadius] = useState(initialRadius);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{5}$/.test(zip)) {
      setError("Enter a 5-digit US zip code.");
      return;
    }
    setError(null);
    onSubmit(zip, radius);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
        What&apos;s happening near you
      </h1>
      <p className="mt-3 text-slate-600">
        Enter a zip code and how far you&apos;re willing to travel. We&apos;ll
        pull together current and upcoming local events.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <label
            htmlFor="zip"
            className="block text-sm font-medium text-slate-700"
          >
            Zip code
          </label>
          <input
            id="zip"
            inputMode="numeric"
            maxLength={5}
            value={zip}
            onChange={(event) =>
              setZip(event.target.value.replace(/\D/g, "").slice(0, 5))
            }
            placeholder="94063"
            className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 text-lg outline-none focus:border-slate-900"
          />
        </div>

        <div>
          <label
            htmlFor="radius"
            className="block text-sm font-medium text-slate-700"
          >
            Radius: {radius} miles
          </label>
          <input
            id="radius"
            type="range"
            min={1}
            max={100}
            step={1}
            value={radius}
            onChange={(event) => setRadius(Number(event.target.value))}
            className="mt-3 w-full accent-slate-900"
          />
          <div className="mt-2 flex gap-2">
            {RADIUS_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRadius(option)}
                className={`rounded-full px-3 py-1 text-sm ${
                  radius === option
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {option} mi
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg bg-slate-900 px-4 py-3 text-lg font-medium text-white hover:bg-slate-800"
        >
          Show events
        </button>
      </form>
    </div>
  );
}
