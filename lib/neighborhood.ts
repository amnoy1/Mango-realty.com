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

// ─── data.gov.il — public transport stops (Ministry of Transport) ─────────────
const GOV_TRANSPORT_RESOURCE = "e873e6a2-66c1-494f-a677-f5e77348edb0";

async function fetchTransportStops(city: string): Promise<number | null> {
  try {
    const f = encodeURIComponent(JSON.stringify({ CityName: city }));
    const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${GOV_TRANSPORT_RESOURCE}&filters=${f}&limit=1`;

    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;

    const total: number = (await res.json()).result?.total ?? 0;
    return total > 0 ? total : null;
  } catch {
    return null;
  }
}

// ─── data.gov.il — demographics (CBS) ─────────────────────────────────────────
const GOV_DEMOGRAPHICS_RESOURCE = "64edd0ee-3d5d-43ce-8562-c336c24dbc1f";

interface Demographics {
  population?: number;
}

async function fetchDemographics(city: string): Promise<Demographics | null> {
  try {
    const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${GOV_DEMOGRAPHICS_RESOURCE}&q=${encodeURIComponent(city)}&limit=5`;

    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;

    const records: Record<string, unknown>[] = (await res.json()).result?.records ?? [];
    if (records.length === 0) return null;

    const row = records[0];
    const rawPop = row["סך הכל"] ?? row["אוכלוסייה"] ?? row["population"];
    const population =
      typeof rawPop === "number" ? rawPop
      : typeof rawPop === "string" ? (parseFloat(rawPop.replace(/,/g, "")) || undefined)
      : undefined;

    return population ? { population } : null;
  } catch {
    return null;
  }
}

// ─── Static socio-economic cluster lookup (CBS 2019, scale 1–10) ──────────────
// API data covers only small localities. Major Israeli cities require static lookup.
const SOCIO_ECONOMIC_CLUSTERS: Record<string, number> = {
  "תל אביב": 8, "תל אביב יפו": 8,
  "ירושלים": 5, "חיפה": 6,
  "ראשון לציון": 6, "פתח תקווה": 6, "נתניה": 5,
  "אשדוד": 5, "אשקלון": 4, "באר שבע": 4,
  "בני ברק": 3, "חולון": 6, "בת ים": 5,
  "רמת גן": 7, "גבעתיים": 8, "הרצליה": 8,
  "רעננה": 9, "כפר סבא": 7, "הוד השרון": 8,
  "מודיעין": 9, "קרית אונו": 7, "אור יהודה": 5,
  "יהוד": 6, "לוד": 3, "רמלה": 3,
  "נס ציונה": 7, "ראש העין": 6, "אלפי מנשה": 8,
  "כפר תבור": 6, "כפר יונה": 7, "רמת השרון": 9,
  "עכו": 4, "נהריה": 6, "כרמיאל": 6, "טבריה": 4,
  "צפת": 4, "אילת": 6, "קרית גת": 4,
  "קרית שמונה": 4, "קרית ביאליק": 6, "קרית מוצקין": 5,
};

// ─── Claude Sonnet — neighborhood profile with specific facts ─────────────────
async function generateNeighborhoodData(
  city: string,
  neighborhood: string,
  schoolNames: string[],
  transportStops: number | null,
  demographics: Demographics | null,
  clusterLevel: number | null,
): Promise<Omit<NeighborhoodData, "city" | "neighborhood" | "image_url"> | null> {
  const client = new Anthropic();
  const location = neighborhood ? `"${neighborhood}" ב${city}` : city;

  const contextParts: string[] = [];
  if (schoolNames.length > 0) {
    contextParts.push(`בתי ספר אמיתיים ב${city} (מנתוני משרד החינוך): ${schoolNames.join(", ")}.`);
  }
  if (transportStops !== null) {
    contextParts.push(`מספר תחנות תחבורה ציבורית ב${city}: ${transportStops} תחנות (נתוני מנהל התחבורה).`);
  }
  if (demographics?.population) {
    const popFormatted = demographics.population.toLocaleString("he-IL");
    contextParts.push(`אוכלוסיית ${city}: כ-${popFormatted} תושבים (נתוני הלמ"ס).`);
  }
  if (clusterLevel !== null) {
    const levelDesc = clusterLevel >= 8 ? "גבוה" : clusterLevel >= 6 ? "בינוני-גבוה" : clusterLevel >= 4 ? "בינוני" : "נמוך";
    contextParts.push(`דירוג סוציו-אקונומי של ${city}: אשכול ${clusterLevel}/10 (${levelDesc}) לפי הלמ"ס.`);
  }

  const dataContext = contextParts.length > 0
    ? `\nנתונים ממשלתיים אמיתיים:\n${contextParts.map(p => `• ${p}`).join("\n")}`
    : "";

  const prompt = `אתה copywriter נדל"ן מנוסה בישראל. כתוב פרופיל שכונה עבור ${location}. קהל היעד: משפחות וזוגות שמחפשים דירה לקנייה או שכירות ורוצים להבין מה הם מקבלים מהשכונה הזו.
${dataContext}

מה מעניין את הקונה/שוכר:
- חינוך: כמה גני ילדים ובתי ספר יש, האם הם נחשבים טובים, האם יש אפשרויות חינוך מגוונות (חילוני/דתי/גימנסיה)
- ניידות: איזה כבישים ראשיים יוצאים מהשכונה, כמה זמן לתל אביב/עיר מרכזית, תחבורה ציבורית אמיתית
- מי השכנים: רמה סוציו-אקונומית (גבוהה/בינונית), דמוגרפיה (משפחות, ותיקים, צעירים), אווירה
- שירותים יומיומיים: איפה קונים מזון, איפה יש קופת חולים, בנק, רופא שיניים — שמות אמיתיים
- תרבות ופנאי: מה יש לילדים ולמבוגרים — חוגים, מרכזי תרבות, מועדוניות, ספריות, גני שעשועים

כללי ברזל:
- כתוב רק מידע שאתה יודע שהוא נכון. אל תמציא.
- אל תכתוב "קרוב לכבישים ראשיים" — כתוב "כביש 5 ו-531 בצמוד לשכונה" אם זה נכון.
- השתמש בנתונים הממשלתיים שניתנו לך — שלב אותם אורגנית בטקסט.
- אל תציין עובדות טריוויאליות (גודל השכונה, גובה בניין). ציין מה זה נותן לתושב.
- אל תכתוב "מרכז מסחרי פעיל" — כתוב "מרכז X הכולל קופת חולים מאוחדת, סופרמרקט ושירותי בנק" אם זה נכון.
- עברית בלבד, ללא markdown, ללא כותרות.

סגנון כתיבה: copywriting ממוקד לקוח — הדגש את היתרון לתושב, לא סיפורי רקע. כל משפט צריך לגרום לקורא לחשוב "זה טוב עבורי".

החזר JSON בלבד (ללא טקסט לפני/אחרי):
{
  "description": "4-6 משפטים שיווקיים המסבירים למה כדאי לגור כאן — מנקודת מבט של איכות חיים, נגישות ושירותים. שמות ספציפיים בלבד.",
  "transport": "2 משפטים: אילו כבישים ראשיים נגישים, כמה זמן לציר מרכזי, תחבורה ציבורית — מה זה אומר לתושב שיוצא לעבודה כל בוקר.",
  "schools": "2 משפטים: שמות גנים ובתי ספר (מהרשימה שניתנה אם רלוונטי), מה מיוחד בהם, האם יש אפשרויות מגוונות — מה זה אומר למשפחה עם ילדים.",
  "lifestyle": "2 משפטים: מרכזי תרבות, חוגים, מועדוניות נוער/קשישים, ספריות, גני שעשועים — מה יש לעשות בשכונה אחרי העבודה.",
  "commerce": "2 משפטים: שמות מרכזים מסחריים, קופות חולים (מאוחדת/כללית/מכבי/לאומית), סופרמרקטים — מה ניתן לפתור בלי לצאת מהשכונה.",
  "character": "2 משפטים: מי גר כאן (ותיקים/צעירים/משפחות), רמה סוציו-אקונומית, אווירה — עם מי חולקים את השכונה."
}`;

  // ── Try with web search (Sonnet) ──
  try {
    const res = await client.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
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
    const match = textBlock.text.match(/\{[\s\S]*?\}/);
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

  // ── 3. Fetch all gov data in parallel, then generate AI content ──
  const [schoolNames, transportStops, demographics] = await Promise.all([
    fetchSchoolNames(city),
    fetchTransportStops(city),
    fetchDemographics(city),
  ]);

  const clusterLevel = SOCIO_ECONOMIC_CLUSTERS[city] ?? null;

  const generated = await generateNeighborhoodData(
    city, neighborhood, schoolNames, transportStops, demographics, clusterLevel
  );

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
