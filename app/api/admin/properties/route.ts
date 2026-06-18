import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();

  if (!user || user.email !== "amir@mango-realty.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = await createAdminClient();

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
    lat:              body.lat              || null,
    lng:              body.lng              || null,
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

  return NextResponse.json({ data });
}
