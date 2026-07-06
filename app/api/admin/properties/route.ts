import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse, after } from "next/server";
import { getNeighborhoodData } from "@/lib/neighborhood";
import { geocodeIsraeliAddress } from "@/lib/geocode";

export async function POST(request: NextRequest) {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();

  if (!user || user.email !== "amir@mango-realty.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = await createAdminClient();

  // Auto-geocode if no lat/lng provided but address exists
  let lat: number | null = body.lat || null;
  let lng: number | null = body.lng || null;
  if (!lat && !lng && (body.street || body.city)) {
    const coords = await geocodeIsraeliAddress(body.street || "", body.city || "");
    if (coords) { lat = coords.lat; lng = coords.lng; }
  }

  const row = {
    slug:             body.slug             || null,
    title:            body.title            || null,
    description:      body.description      || null,
    price:            body.price            || null,
    price_type:       body.price_type       || "sale",
    property_type:    body.property_type    || "apartment",
    status:           body.status           || "active",
    rooms:            body.rooms            || null,
    bathrooms:        body.bathrooms        || null,
    area_sqm:         body.area_sqm         || null,
    floor:            body.floor            || null,
    total_floors:     body.total_floors     || null,
    city:             body.city             || null,
    neighborhood:     body.neighborhood     || null,
    street:           body.street           || null,
    features:         body.features         || {},
    images:           body.images           || [],
    lat,
    lng,
    meta_title:       body.meta_title       || null,
    meta_description: body.meta_description || null,
    published_at:     body.status === "active" ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from("properties")
    .insert(row)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire neighborhood analysis after response is sent (non-blocking)
  if (data.status === "active" && data.city) {
    after(() => {
      getNeighborhoodData(
        data.city,
        data.neighborhood ?? "",
        data.street ?? "",
        data.lat ?? null,
        data.lng ?? null,
      ).catch((e: unknown) =>
        console.error("[admin/properties POST] neighborhood pre-gen failed:", e),
      );
    });
  }

  return NextResponse.json({ data });
}
