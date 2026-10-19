import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { isFullAdmin } from "@/lib/admin-auth";

// Free-text search over whatsapp_properties (property-search-spec.md, door 2).
// The engine lives in nir-buyers-agent; this route only checks the admin and
// forwards, so the shared secret never reaches the browser.
const NIR_SEARCH_URL = "https://mango-lead-street-extractor.vercel.app/api/search";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isFullAdmin(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.NIR_SHARED_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "NIR_SHARED_SECRET לא מוגדר ב-Vercel" }, { status: 500 });
  }

  const { text } = await req.json().catch(() => ({ text: "" }));
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "חסר טקסט לחיפוש" }, { status: 400 });
  }

  const res = await fetch(NIR_SEARCH_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "x-shared-secret": secret },
    body: JSON.stringify({ text: text.trim() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json({ error: data.error || `החיפוש נכשל (${res.status})` }, { status: 502 });
  }
  return NextResponse.json(data);
}
