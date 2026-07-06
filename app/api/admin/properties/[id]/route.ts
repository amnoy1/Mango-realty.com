import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse, after } from "next/server";
import { getNeighborhoodData } from "@/lib/neighborhood";
import { geocodeIsraeliAddress } from "@/lib/geocode";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();

  if (!user || user.email !== "amir@mango-realty.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createAdminClient();

  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();

  if (!user || user.email !== "amir@mango-realty.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const supabase = await createAdminClient();

  // Auto-geocode if address is present but no lat/lng provided
  if (!body.lat && !body.lng && (body.street || body.city)) {
    const coords = await geocodeIsraeliAddress(body.street || "", body.city || "");
    if (coords) { body.lat = coords.lat; body.lng = coords.lng; }
  }

  const { error } = await supabase.from("properties").update(body).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire neighborhood analysis after response when property becomes active
  if (body.status === "active" && body.city) {
    after(() => {
      getNeighborhoodData(
        body.city,
        body.neighborhood ?? "",
        body.street ?? "",
        body.lat ?? null,
        body.lng ?? null,
      ).catch((e: unknown) =>
        console.error("[admin/properties PATCH] neighborhood pre-gen failed:", e),
      );
    });
  }

  return NextResponse.json({ success: true });
}
