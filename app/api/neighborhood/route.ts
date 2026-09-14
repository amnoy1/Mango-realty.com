import { NextRequest, NextResponse } from "next/server";
import { getNeighborhoodData } from "@/lib/neighborhood";

export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const city         = req.nextUrl.searchParams.get("city")         || "";
  const neighborhood = req.nextUrl.searchParams.get("neighborhood") || "";
  const street       = req.nextUrl.searchParams.get("street")       || "";
  const latStr       = req.nextUrl.searchParams.get("lat");
  const lngStr       = req.nextUrl.searchParams.get("lng");
  const lat          = latStr  ? parseFloat(latStr)  : null;
  const lng          = lngStr  ? parseFloat(lngStr)  : null;

  if (!city) return NextResponse.json(null, { status: 400 });

  try {
    const data = await getNeighborhoodData(city, neighborhood, street, lat, lng);
    // getNeighborhoodData already treats its own DB row as fresh for 6 months, but
    // every visitor still paid a fresh Supabase round-trip to learn that. Let the
    // CDN serve repeat requests for the same city/neighborhood/street straight from
    // cache instead of invoking this function again.
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (e) {
    console.error("[neighborhood route] unhandled error:", e);
    return NextResponse.json({ caught: true, error: String(e) }, { status: 500 });
  }
}
