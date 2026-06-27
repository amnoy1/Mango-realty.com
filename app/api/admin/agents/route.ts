import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function auth() {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  return user?.email === "amir@mango-realty.com" ? user : null;
}

export async function GET() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .order("first_name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const supabase = await createAdminClient();

  const slug = body.slug || `${body.first_name}-${body.last_name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    || `agent-${Date.now()}`;

  const { data, error } = await supabase
    .from("agents")
    .insert({
      slug,
      first_name: body.first_name,
      last_name:  body.last_name,
      phone:      body.phone      || null,
      email:      body.email      || null,
      photo_url:  body.photo_url  || null,
      bio:        body.bio        || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
