import { NextResponse } from "next/server";
import { getEvents } from "@/lib/aggregate";
import { isValidZip } from "@/lib/geo";

export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zip = (searchParams.get("zip") ?? "").trim();
  const radius = Number(searchParams.get("radius") ?? "25");

  if (!isValidZip(zip)) {
    return NextResponse.json(
      { error: "A 5-digit US zip code is required." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(radius) || radius <= 0 || radius > 200) {
    return NextResponse.json(
      { error: "Radius must be between 1 and 200 miles." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await getEvents(zip, radius));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load events.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
