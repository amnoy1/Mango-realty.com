import { NextRequest, NextResponse } from "next/server";
import { getNeighborhoodData } from "@/lib/neighborhood";

export const maxDuration = 60;

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
    return NextResponse.json(data);
  } catch (e) {
    console.error("[neighborhood route] unhandled error:", e);
    return NextResponse.json({ caught: true, error: String(e) }, { status: 500 });
  }
}
