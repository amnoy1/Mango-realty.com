import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient, createClient } from "./supabase/server";

export interface NeighborhoodData {
  city: string;
  neighborhood: string;
  description: string | null;
  transport: string | null;
  schools: string | null;
  lifestyle: string | null;
  commerce: string | null;
  character: string | null;
  image_url: string | null;
}

// ─── Claude + web search ──────────────────────────────────────────────────────
async function generateNeighborhoodData(
  city: string,
  neighborhood: string
): Promise<Omit<NeighborhoodData, "city" | "neighborhood" | "image_url"> | null> {
  const client = new Anthropic();
  const location = neighborhood ? `"${neighborhood}" ב${city}, ישראל` : `${city}, ישראל`;

  const prompt = `אתה כותב תוכן נדל"ן מקצועי בישראל.
חקור את השכונה ${location} ומצא מידע עדכני ומדויק על:
1. נגישות ותחבורה (כבישים ראשיים, אוטובוסים, רכבת/רכבת קלה)
2. מוסדות חינוך (בתי ספר, גנים, מרכזים קהילתיים)
3. פנאי ותרבות (פארקים, מתקני ספורט, בידור)
4. מסחר ושירותים (קניונים, סופרמרקטים, רחובות מסחריים)
5. אופי הקהילה (דמוגרפיה, אווירה, סוג תושבים)

החזר JSON בלבד (ללא תגי markdown, ללא הסברים):
{
  "description": "תיאור שיווקי מרשים 4-5 משפטים בעברית לרוכש פוטנציאלי. ללא markdown.",
  "transport": "משפט קצר על תחבורה ונגישות",
  "schools": "משפט קצר על מוסדות חינוך",
  "lifestyle": "משפט קצר על פנאי ואורח חיים",
  "commerce": "משפט קצר על קניות ושירותים",
  "character": "משפט קצר על אופי הקהילה"
}`;

  // ── Try with web search first ──
  try {
    const res = await client.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 } as any],
        messages: [{ role: "user", content: prompt }],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { headers: { "anthropic-beta": "web-search-2025-03-05" } } as any
    );
    const parsed = extractJson(res);
    if (parsed) return parsed;
  } catch {
    // Web search not available or failed — fall through to fallback
  }

  // ── Fallback: Claude knowledge only ──
  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      messages: [{ role: "user", content: prompt }],
    });
    return extractJson(res);
  } catch {
    return null;
  }
}

function extractJson(
  res: Anthropic.Message
): Omit<NeighborhoodData, "city" | "neighborhood" | "image_url"> | null {
  const textBlock = [...res.content].reverse().find(b => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;
  try {
    const match = textBlock.text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const d = JSON.parse(match[0]);
    return {
      description: d.description ?? null,
      transport:   d.transport   ?? null,
      schools:     d.schools     ?? null,
      lifestyle:   d.lifestyle   ?? null,
      commerce:    d.commerce    ?? null,
      character:   d.character   ?? null,
    };
  } catch {
    return null;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function getNeighborhoodData(
  city: string,
  neighborhood: string
): Promise<NeighborhoodData | null> {
  if (!city) return null;

  const SIX_MONTHS = 180 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  // ── 1. Check Supabase cache ──
  let existing: Record<string, unknown> | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("neighborhoods")
      .select("*")
      .eq("city", city)
      .eq("neighborhood", neighborhood)
      .single();
    existing = data as Record<string, unknown> | null;
  } catch {
    /* table may not exist yet */
  }

  const analysisAge = existing?.analysis_updated_at
    ? now - new Date(existing.analysis_updated_at as string).getTime()
    : Infinity;

  // ── 2. Return from cache if fresh ──
  if (existing && analysisAge < SIX_MONTHS) {
    return {
      city,
      neighborhood,
      description: existing.description as string | null,
      transport:   existing.transport   as string | null,
      schools:     existing.schools     as string | null,
      lifestyle:   existing.lifestyle   as string | null,
      commerce:    existing.commerce    as string | null,
      character:   existing.character   as string | null,
      image_url:   existing.image_url   as string | null,
    };
  }

  // ── 3. Generate fresh data ──
  const generated = await generateNeighborhoodData(city, neighborhood);
  if (!generated && !existing) return null;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    image_url:  (existing?.image_url as string | null) ?? null,
    ...(generated
      ? { ...generated, analysis_updated_at: new Date().toISOString() }
      : {}),
  };

  // ── 4. Persist to Supabase ──
  try {
    const admin = await createAdminClient();
    if (existing) {
      await admin
        .from("neighborhoods")
        .update(updates)
        .eq("city", city)
        .eq("neighborhood", neighborhood);
    } else {
      await admin
        .from("neighborhoods")
        .insert({ city, neighborhood, ...updates });
    }
  } catch {
    /* silently ignore */
  }

  const m = { ...(existing ?? {}), ...updates };
  return {
    city,
    neighborhood,
    description: (m.description ?? null) as string | null,
    transport:   (m.transport   ?? null) as string | null,
    schools:     (m.schools     ?? null) as string | null,
    lifestyle:   (m.lifestyle   ?? null) as string | null,
    commerce:    (m.commerce    ?? null) as string | null,
    character:   (m.character   ?? null) as string | null,
    image_url:   (m.image_url   ?? null) as string | null,
  };
}
