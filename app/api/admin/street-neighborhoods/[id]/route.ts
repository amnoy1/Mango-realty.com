import { createAdminClient, createClient } from "@/lib/supabase/server";
import { isFullAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";

async function auth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return isFullAdmin(user?.email) ? user : null;
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = await createAdminClient();
  const { error } = await supabase.from("street_neighborhoods").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
