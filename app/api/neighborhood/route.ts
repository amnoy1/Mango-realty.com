import { NextRequest, NextResponse } from "next/server";
import { getNeighborhoodData } from "@/lib/neighborhood";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const city         = req.nextUrl.searchParams.get("city")         || "";
  const neighborhood = req.nextUrl.searchParams.get("neighborhood") || "";

  if (!city) return NextResponse.json(null, { status: 400 });

  try {
    const data = await getNeighborhoodData(city, neighborhood);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(null, { status: 500 });
  }
}
