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

// ─── data.gov.il — real school names (Ministry of Education) ─────────────────
const GOV_SCHOOLS_RESOURCE = "5548fd63-5868-4053-ad81-98caddc5e232";

async function fetchSchoolNames(city: string): Promise<string[]> {
  try {
    const f = encodeURIComponent(JSON.stringify({ "שם ישוב": city }));
    const q = encodeURIComponent("בית ספר");
    const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${GOV_SCHOOLS_RESOURCE}&filters=${f}&q=${q}&fields=${encodeURIComponent("שם מוסד")}&limit=60`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];

    const records: Record<string, string>[] = (await res.json()).result?.records ?? [];
    const seen = new Set<string>();
    const names: string[] = [];
    for (const r of records) {
      const name = r["שם מוסד"];
      if (name && !seen.has(name)) {
        seen.add(name);
        names.push(name);
      }
    }
    return names.slice(0, 8);
  } catch {
    return [];
  }
}

// ─── Claude Sonnet — neighborhood profile with specific facts ─────────────────
async function generateNeighborhoodData(
  city: string,
  neighborhood: string,
  schoolNames: string[]
): Promise<Omit<NeighborhoodData, "city" | "neighborhood" | "image_url"> | null> {
  const client = new Anthropic();
  const location = neighborhood ? `"${neighborhood}" ב${city}` : city;

  const schoolsContext = schoolNames.length > 0
    ? `\nבתי ספר אמיתיים ב${city} (מנתוני משרד החינוך): ${schoolNames.join(", ")}.`
    : "";

  const prompt = `אתה כותב תוכן נדל"ן מקצועי בישראל. עליך לכתוב פרופיל שכונה עבור ${location}.
${schoolsContext}

חוקים דווקניים:
- כתוב פרטים ספציפיים ואמיתיים: שמות כבישים אמיתיים (כביש X), שמות קניונים/מרכזים מסחריים אמיתיים, שמות פארקים אמיתיים, מספרי קווי אוטובוס אמיתיים אם ידועים.
- אם אתה יודע ששכונה ספציפית קרובה לתחנת רכבת, ציין זאת. אם לא ידוע — אל תמציא.
- אל תכתוב ביטויים גנריים כמו "קרוב לכבישים ראשיים" או "מספר בתי ספר". כתוב את השמות בפועל.
- עברית בלבד, ללא markdown.
- השתמש בבתי הספר שסופקו לך (אם סופקו) בתיאור "מוסדות חינוך".

החזר JSON בלבד (ללא טקסט לפני/אחרי, ללא גרשיים נוספים):
{
  "description": "תיאור שיווקי מרשים 4-5 משפטים בעברית. ציין שמות ספציפיים אמיתיים.",
  "transport": "שמות כבישים ספציפיים, קווי אוטובוס, רכבת אם רלוונטי — כ-2 משפטים",
  "schools": "שמות בתי ספר ספציפיים מהרשימה + מוסדות נוספים — כ-2 משפטים",
  "lifestyle": "שמות פארקים ומתקני פנאי ספציפיים — כ-2 משפטים",
  "commerce": "שמות קניונים, רחובות מסחריים, מרכזי קניות ספציפיים — כ-2 משפטים",
  "character": "אופי הקהילה, דמוגרפיה, אווירה — כ-2 משפטים"
}`;

  // ── Try with web search (Sonnet) ──
  try {
    const res = await client.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 } as any],
        messages: [{ role: "user", content: prompt }],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { headers: { "anthropic-beta": "web-search-2025-03-05" } } as any
    );
    const parsed = extractJson(res);
    if (parsed) return parsed;
  } catch {
    // Web search not available — fall through
  }

  // ── Fallback: Sonnet without web search ──
  try {
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
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
    const match = textBlock.text.match(/\{[\s\S]*?\}/s);
    if (!match) return null;
    const d = JSON.parse(match[0]);
    if (!d.description && !d.transport) return null; // sanity check
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

  // ── 3. Fetch real school names + generate AI content in parallel ──
  const schoolNames = await fetchSchoolNames(city);
  const generated = await generateNeighborhoodData(city, neighborhood, schoolNames);

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
