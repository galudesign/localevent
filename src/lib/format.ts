export function formatEventDate(iso: string, hasTime = true): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(hasTime ? { hour: "numeric" as const, minute: "2-digit" as const } : {}),
  });
}

export function priceLabel(priceType: string): string {
  if (priceType === "free") return "Free";
  if (priceType === "ticketed") return "Ticketed";
  return "Price TBD";
}
