import { NextRequest, NextResponse } from "next/server";

// Public free-text property search (property-search-spec.md, door 4).
// The engine lives in nir-buyers-agent. This route only forwards with the
// search secret, and asks for the public view: cards with no house number, no
// broker and no ids, built on Nir's side. Rate limited by a Vercel Firewall
// rule on this path (20 per hour per visitor, spec decision 6).
const NIR_SEARCH_URL = "https://mango-lead-street-extractor.vercel.app/api/search";
const MAX_LENGTH = 300;

export async function POST(req: NextRequest) {
  const secret = process.env.NIR_SEARCH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "החיפוש לא זמין כרגע" }, { status: 503 });
  }

  const { text } = await req.json().catch(() => ({ text: "" }));
  const query = typeof text === "string" ? text.trim() : "";
  if (!query) {
    return NextResponse.json({ error: "כתבו מה אתם מחפשים" }, { status: 400 });
  }
  if (query.length > MAX_LENGTH) {
    return NextResponse.json({ error: "החיפוש ארוך מדי" }, { status: 400 });
  }

  const res = await fetch(NIR_SEARCH_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "x-search-secret": secret },
    body: JSON.stringify({ text: query, view: "public" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json({ error: "החיפוש נכשל, נסו שוב בעוד רגע" }, { status: 502 });
  }
  return NextResponse.json({
    echo: data.echo,
    unparsed: data.unparsed ?? null,
    total: data.total ?? 0,
    cards: Array.isArray(data.cards) ? data.cards : [],
  });
}
