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

// The watcher on the office computer picks a pending request up within a
// second or two (Supabase Realtime). A request still pending after this long
// means the watcher isn't running: live 19-21.10.2026 it was dead for two
// days and the button silently did nothing (architecture.md sec 76).
const WATCHER_DOWN_AFTER_MS = 45_000;

function withWatcherCheck(row: { status: string; result?: string | null; requested_at?: string }) {
  const age = row.requested_at ? Date.now() - new Date(row.requested_at).getTime() : 0;
  if (row.status === "pending" && age > WATCHER_DOWN_AFTER_MS) {
    return { status: "watcher_down", result: row.result ?? null };
  }
  return { status: row.status, result: row.result ?? null };
}

// GET ?id=xxx — return { status, result } ("watcher_down" when nobody picked it up)
// GET ?health=1 — the latest request, so the tab can warn before anyone presses
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user || !isFullAdmin(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  const health = request.nextUrl.searchParams.get("health");
  if (!id && !health) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const query = id
    ? `id=eq.${encodeURIComponent(id)}&select=status,result,requested_at`
    : "select=status,result,requested_at&order=requested_at.desc&limit=1";
  const res = await fetch(`${PARSER_URL}/rest/v1/run_triggers?${query}`, { headers: parserHeaders() });

  if (!res.ok) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }

  const rows = await res.json();
  if (!rows?.length) {
    return id
      ? NextResponse.json({ error: "Not found" }, { status: 404 })
      : NextResponse.json({ status: "idle", result: null });
  }
  return NextResponse.json(withWatcherCheck(rows[0]));
}
