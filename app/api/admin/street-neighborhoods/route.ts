import { createAdminClient, createClient } from "@/lib/supabase/server";
import { isFullAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";

async function auth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return isFullAdmin(user?.email) ? user : null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city   = searchParams.get("city");
  const street = searchParams.get("street");
  const supabase = await createAdminClient();

  if (city && street) {
    const { data } = await supabase
      .from("street_neighborhoods")
      .select("neighborhood")
      .eq("city", city)
      .eq("street", street)
      .maybeSingle();
    return NextResponse.json({ neighborhood: data?.neighborhood ?? null });
  }

  const { data, error } = await supabase
    .from("street_neighborhoods")
    .select("id, city, street, neighborhood, created_at")
    .order("city").order("street");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { city, street, neighborhood } = await req.json();
  if (!city?.trim() || !street?.trim() || !neighborhood?.trim())
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("street_neighborhoods")
    .upsert(
      { city: city.trim(), street: street.trim(), neighborhood: neighborhood.trim() },
      { onConflict: "city,street" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
