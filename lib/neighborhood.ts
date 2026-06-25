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

// ─── data.gov.il — education institutions by type (Ministry of Education) ───────
const GOV_SCHOOLS_RESOURCE = "5548fd63-5868-4053-ad81-98caddc5e232";

interface EducationData {
  kindergartens: string[];  // גני ילדים (גיל 0–6)
  elementary: string[];     // בתי ספר יסודיים (כיתות א–ו)
  secondary: string[];      // חטיבות ביניים + תיכונים (כיתות ז–יב)
}

async function fetchEducationData(city: string): Promise<EducationData> {
  const empty: EducationData = { kindergartens: [], elementary: [], secondary: [] };
  try {
    const f = encodeURIComponent(JSON.stringify({ "שם ישוב": city }));
    const fields = encodeURIComponent("שם מוסד,סוג מוסד");
    const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${GOV_SCHOOLS_RESOURCE}&filters=${f}&fields=${fields}&limit=150`;

    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return empty;

    const records: Record<string, string>[] = (await res.json()).result?.records ?? [];

    const seenK = new Set<string>(), seenE = new Set<string>(), seenS = new Set<string>();
    const kindergartens: string[] = [], elementary: string[] = [], secondary: string[] = [];

    for (const r of records) {
      const name = (r["שם מוסד"] || "").trim();
      const type = (r["סוג מוסד"] || "").trim();
      if (!name) continue;

      if (type === "גן ילדים") {
        if (!seenK.has(name)) { seenK.add(name); kindergartens.push(name); }
      } else if (type.includes("יסודי")) {
        if (!seenE.has(name)) { seenE.add(name); elementary.push(name); }
      } else if (type.includes("חטיבת ביניים") || type.includes("תיכון") || type.includes("חטיבה עליונה") || type.includes("על יסודי")) {
        if (!seenS.has(name)) { seenS.add(name); secondary.push(name); }
      }
    }

    return {
      kindergartens: kindergartens.slice(0, 6),
      elementary:    elementary.slice(0, 6),
      secondary:     secondary.slice(0, 5),
    };
  } catch {
    return empty;
  }
}

// ─── data.gov.il — public transport stops (Ministry of Transport) ─────────────
const GOV_TRANSPORT_RESOURCE = "e873e6a2-66c1-494f-a677-f5e77348edb0";

async function fetchTransportStops(city: string): Promise<number | null> {
  try {
    const f = encodeURIComponent(JSON.stringify({ CityName: city }));
    const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${GOV_TRANSPORT_RESOURCE}&filters=${f}&limit=1`;

    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
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

    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
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
  edData: EducationData,
  transportStops: number | null,
  demographics: Demographics | null,
  clusterLevel: number | null,
): Promise<Omit<NeighborhoodData, "city" | "neighborhood" | "image_url"> | null> {
  const client = new Anthropic();
  const location = neighborhood ? `"${neighborhood}" ב${city}` : city;

  const contextParts: string[] = [];

  // ── Education — structured by type ──
  const edLines: string[] = [];
  if (edData.kindergartens.length > 0)
    edLines.push(`גני ילדים (${edData.kindergartens.length}): ${edData.kindergartens.join(", ")}`);
  if (edData.elementary.length > 0)
    edLines.push(`בתי ספר יסודיים (${edData.elementary.length}): ${edData.elementary.join(", ")}`);
  if (edData.secondary.length > 0)
    edLines.push(`חטיבות ביניים ותיכונים (${edData.secondary.length}): ${edData.secondary.join(", ")}`);
  if (edLines.length > 0)
    contextParts.push(`מוסדות חינוך ב${city} (נתוני משרד החינוך):\n  ${edLines.join("\n  ")}`);

  if (transportStops !== null)
    contextParts.push(`תחנות תחבורה ציבורית ב${city}: ${transportStops} תחנות (נתוני מנהל התחבורה).`);
  if (demographics?.population) {
    const popFormatted = demographics.population.toLocaleString("he-IL");
    contextParts.push(`אוכלוסיית ${city}: כ-${popFormatted} תושבים (נתוני הלמ"ס).`);
  }
  if (clusterLevel !== null) {
    const levelDesc = clusterLevel >= 8 ? "גבוה" : clusterLevel >= 6 ? "בינוני-גבוה" : clusterLevel >= 4 ? "בינוני" : "נמוך";
    contextParts.push(`דירוג סוציו-אקונומי של ${city}: אשכול ${clusterLevel}/10 (${levelDesc}) לפי הלמ"ס.`);
  }

  const dataContext = contextParts.length > 0
    ? `\nנתונים ממשלתיים מאומתים:\n${contextParts.map(p => `• ${p}`).join("\n")}`
    : "";

  const prompt = `אתה copywriter נדל"ן ישראלי בכיר עם 15 שנות ניסיון. כתוב פרופיל שכונה עבור ${location}.
קהל היעד: משפחות וזוגות שבוחנים לגור כאן ורוצים תמונה אמינה ומלאה.
${dataContext}

הנחיות תוכן:
- חינוך: השתמש בשמות המדויקים מהרשימה לעיל. ציין כמה גנים ובתי ספר ומה הגיל המתאים.
- תחבורה: שמות כבישים ספציפיים, זמן נסיעה ריאלי לתל אביב/מרכז, קווי אוטובוס בשם אם ידוע.
- מסחר: שמות מרכזים מסחריים אמיתיים, סופרמרקט/רשת, קופת חולים בשם.
- פנאי: מתקנים ספציפיים — פארקים בשם, בריכה, ספרייה, מרכז קהילתי.
- אופי: מי התושבים, אווירה, רמה סוציו-אקונומית (השתמש בנתון אם ניתן).

כללי דיוק — חובה לקיים:
- אל תכתוב "מספר בתי ספר" — כתוב את שמותיהם.
- אל תכתוב "קרוב לכביש ראשי" — ציין את מספר הכביש.
- אל תמציא שמות של מקומות. אם אינך בטוח בשם — תאר בכלליות.
- עברית תקינה ועשירה — משפטים קצרים, פעיל ולא סביל, ניסוח שגורם לקורא להרגיש שמישהו שמכיר את השכונה מדבר איתו.

החזר JSON בלבד ללא טקסט נוסף:
{
  "description": "3-4 משפטים שמסכמים מה הקונה/שוכר מרוויח מהשכונה הזו. שלב את הנקודות הכי חזקות מכל התחומים: נגישות תחבורתית, חינוך, שירותים ואופי קהילתי. כתוב כאילו אתה מציג לחבר שמחפש דירה — ישיר, ספציפי, עם שמות אמיתיים. כל משפט צריך לבטא יתרון ברור לדייר. עברית חיה ופעילה.",
  "transport": "2 משפטים: כבישים ספציפיים, זמן ריאלי לתל אביב/מרכז, תחבורה ציבורית — מה זה אומר למי שיוצא לעבודה בבוקר.",
  "schools": "2-3 משפטים: שמות גנים ובתי הספר מהרשימה לפי גיל (גן / יסודי / תיכון), כמה מהם, האם יש מגוון חינוכי — מה זה נותן למשפחה עם ילדים.",
  "lifestyle": "2 משפטים: מה יש לעשות בשכונה — פארקים, מרכז קהילתי, בריכה, ספרייה — שמות אמיתיים אם ידוע.",
  "commerce": "2 משפטים: שמות רשתות/מרכזים מסחריים, קופת חולים בשם, מה ניתן לפתור ברגל מהבית.",
  "character": "2 משפטים: מי גר כאן, רמה סוציו-אקונומית, דינמיקה — האם זו שכונה ותיקה/מתחדשת/צעירה."
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
  } catch (e) {
    console.error("[neighborhood] web-search call failed:", e);
    // fall through to fallback
  }

  // ── Fallback: Sonnet without web search ──
  try {
    console.log("[neighborhood] generating without web search for:", location);
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });
    return extractJson(res);
  } catch (e) {
    console.error("[neighborhood] fallback Claude call failed:", e);
    return null;
  }
}

function extractJson(
  res: Anthropic.Message
): Omit<NeighborhoodData, "city" | "neighborhood" | "image_url"> | null {
  const textBlock = [...res.content].reverse().find(b => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  const text = textBlock.text;
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    console.error("[neighborhood] no JSON braces found in response:", text.slice(0, 200));
    return null;
  }

  try {
    const d = JSON.parse(text.slice(start, end + 1));
    if (!d.description && !d.transport) {
      console.error("[neighborhood] JSON missing required fields:", JSON.stringify(d).slice(0, 200));
      return null;
    }
    return {
      description: d.description ?? null,
      transport:   d.transport   ?? null,
      schools:     d.schools     ?? null,
      lifestyle:   d.lifestyle   ?? null,
      commerce:    d.commerce    ?? null,
      character:   d.character   ?? null,
    };
  } catch (e) {
    console.error("[neighborhood] JSON.parse failed:", e, "raw:", text.slice(start, end + 1).slice(0, 300));
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
  const [edData, transportStops, demographics] = await Promise.all([
    fetchEducationData(city),
    fetchTransportStops(city),
    fetchDemographics(city),
  ]);

  const clusterLevel = SOCIO_ECONOMIC_CLUSTERS[city] ?? null;

  const generated = await generateNeighborhoodData(
    city, neighborhood, edData, transportStops, demographics, clusterLevel
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
