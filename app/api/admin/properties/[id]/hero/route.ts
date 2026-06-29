import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user || user.email !== "amir@mango-realty.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { hero } = await request.json() as { hero: boolean };

  const supabase = await createAdminClient();

  // Fetch current features and merge
  const { data: prop } = await supabase
    .from("properties")
    .select("features")
    .eq("id", id)
    .single();

  const merged = { ...(prop?.features ?? {}), hero };
  const { error } = await supabase
    .from("properties")
    .update({ features: merged })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
