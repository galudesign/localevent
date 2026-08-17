import { DatePreset, FilterState } from "@/components/Filters";
import { EventItem } from "./types";

function dateWindow(preset: DatePreset): [number, number] {
  const now = new Date();
  const start = now.getTime();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  switch (preset) {
    case "today":
      return [start, endOfToday.getTime()];
    case "weekend": {
      const saturday = new Date(now);
      const daysUntilSaturday = (6 - now.getDay() + 7) % 7;
      saturday.setDate(now.getDate() + daysUntilSaturday);
      saturday.setHours(0, 0, 0, 0);
      const sundayEnd = new Date(saturday);
      sundayEnd.setDate(saturday.getDate() + 1);
      sundayEnd.setHours(23, 59, 59, 999);
      return [Math.max(start, saturday.getTime()), sundayEnd.getTime()];
    }
    case "week": {
      const end = new Date(endOfToday);
      end.setDate(end.getDate() + 7);
      return [start, end.getTime()];
    }
    case "month": {
      const end = new Date(endOfToday);
      end.setDate(end.getDate() + 30);
      return [start, end.getTime()];
    }
    default:
      return [start, Number.POSITIVE_INFINITY];
  }
}

export function applyFilters(
  events: EventItem[],
  filters: FilterState,
): EventItem[] {
  const [from, to] = dateWindow(filters.datePreset);
  const query = filters.query.trim().toLowerCase();

  return events.filter((event) => {
    const startsAt = new Date(event.startDate).getTime();
    const endsAt = new Date(event.endDate ?? event.startDate).getTime();
    if (endsAt < from || startsAt > to) return false;

    if (
      event.distanceMiles !== null &&
      event.distanceMiles > filters.radius
    )
      return false;

    if (filters.price !== "all" && event.priceType !== filters.price)
      return false;

    if (query) {
      const haystack =
        `${event.title} ${event.description} ${event.venueName ?? ""} ${event.city ?? ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}
