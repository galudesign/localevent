"use client";

export type DatePreset = "all" | "today" | "weekend" | "week" | "month";
export type PriceFilter = "all" | "free" | "ticketed";

export interface FilterState {
  datePreset: DatePreset;
  radius: number;
  price: PriceFilter;
  query: string;
}

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "all", label: "All upcoming" },
  { value: "today", label: "Today" },
  { value: "weekend", label: "This weekend" },
  { value: "week", label: "Next 7 days" },
  { value: "month", label: "Next 30 days" },
];

const PRICES: { value: PriceFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "free", label: "Free" },
  { value: "ticketed", label: "Ticketed" },
];

interface Props {
  state: FilterState;
  maxRadius: number;
  onChange: (next: FilterState) => void;
}

export default function Filters({ state, maxRadius, onChange }: Props) {
  const update = (patch: Partial<FilterState>) =>
    onChange({ ...state, ...patch });

  return (
    <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4">
      <div>
        <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Date
        </span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => update({ datePreset: preset.value })}
              className={`rounded-full px-3 py-1 text-sm ${
                state.datePreset === preset.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="filter-radius"
          className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          Within {state.radius} miles
        </label>
        <input
          id="filter-radius"
          type="range"
          min={1}
          max={maxRadius}
          value={state.radius}
          onChange={(event) => update({ radius: Number(event.target.value) })}
          className="mt-4 w-full accent-slate-900"
        />
      </div>

      <div>
        <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Price
        </span>
        <div className="mt-2 flex gap-1.5">
          {PRICES.map((price) => (
            <button
              key={price.value}
              type="button"
              onClick={() => update({ price: price.value })}
              className={`rounded-full px-3 py-1 text-sm ${
                state.price === price.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {price.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="filter-query"
          className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          Search
        </label>
        <input
          id="filter-query"
          value={state.query}
          onChange={(event) => update({ query: event.target.value })}
          placeholder="music, market, festival…"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
        />
      </div>
    </div>
  );
}
