import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { isFullAdmin } from "@/lib/admin-auth";

const PARSER_URL = "https://sgrphwunigmsdtbmilgd.supabase.co";
const PARSER_KEY = process.env.WHATSAPP_PARSER_SERVICE_KEY!;

function parserHeaders() {
  return {
    "apikey": PARSER_KEY,
    "Authorization": `Bearer ${PARSER_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };
}

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// POST — insert a pending trigger, return { id }
export async function POST() {
  const user = await getUser();
  if (!user || !isFullAdmin(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(`${PARSER_URL}/rest/v1/run_triggers`, {
    method: "POST",
    headers: parserHeaders(),
    body: JSON.stringify({ status: "pending" }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text }, { status: 500 });
  }

  const rows = await res.json();
  const row = Array.isArray(rows) ? rows[0] : rows;
  return NextResponse.json({ id: row.id, status: row.status });
}

// GET ?id=xxx — return { status, result }
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user || !isFullAdmin(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const res = await fetch(
    `${PARSER_URL}/rest/v1/run_triggers?id=eq.${id}&select=status,result`,
    { headers: parserHeaders() }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }

  const rows = await res.json();
  if (!rows?.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}
