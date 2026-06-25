import { NextRequest, NextResponse } from "next/server";
import { getNeighborhoodData } from "@/lib/neighborhood";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const city         = req.nextUrl.searchParams.get("city")         || "";
  const neighborhood = req.nextUrl.searchParams.get("neighborhood") || "";
  const street       = req.nextUrl.searchParams.get("street")       || "";

  if (!city) return NextResponse.json(null, { status: 400 });

  try {
    const data = await getNeighborhoodData(city, neighborhood, street);
    return NextResponse.json(data);
  } catch (e) {
    console.error("[neighborhood route] unhandled error:", e);
    return NextResponse.json({ caught: true, error: String(e) }, { status: 500 });
  }
}
