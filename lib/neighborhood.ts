import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient, createClient } from "./supabase/server";

export interface NeighborhoodData {
  city: string;
  neighborhood: string;
  avg_price_sqm: number | null;
  price_trend: string | null;
  description: string | null;
  school_count: number;
  schools: { name: string; type: string }[];
  image_url: string | null;
}

// ─── Static price lookup (₪/sqm, approx. 2025) ───────────────────────────────
// Primary markets for Mango Realty listed first
const CITY_PRICES: Record<string, { avg: number; trend: string }> = {
  // Primary markets
  "כפר סבא":                 { avg: 22500, trend: "+7%" },
  "אלפי מנשה":               { avg: 12000, trend: "+5%" },
  "כפר תבור":                { avg: 9500,  trend: "+4%" },
  "קרית אונו":               { avg: 30000, trend: "+6%" },
  "קריית אונו":              { avg: 30000, trend: "+6%" },
  // Greater Tel Aviv area
  "תל אביב - יפו":           { avg: 57000, trend: "+5%" },
  "תל אביב-יפו":             { avg: 57000, trend: "+5%" },
  "תל אביב":                 { avg: 57000, trend: "+5%" },
  "רמת גן":                  { avg: 32000, trend: "+8%" },
  "גבעתיים":                 { avg: 36000, trend: "+6%" },
  "בני ברק":                 { avg: 24000, trend: "+4%" },
  "גבעת שמואל":              { avg: 26000, trend: "+5%" },
  "אור יהודה":               { avg: 20000, trend: "+8%" },
  "יהוד-מונוסון":            { avg: 20000, trend: "+7%" },
  "אזור":                    { avg: 18500, trend: "+7%" },
  // Sharon area
  "הרצליה":                  { avg: 36000, trend: "+4%" },
  "רעננה":                   { avg: 29000, trend: "+5%" },
  "הוד השרון":               { avg: 23000, trend: "+6%" },
  "כפר יונה":                { avg: 20000, trend: "+8%" },
  "נתניה":                   { avg: 18500, trend: "+5%" },
  "ראש העין":                { avg: 19000, trend: "+9%" },
  // Center
  "פתח תקווה":               { avg: 21000, trend: "+9%" },
  "ראשון לציון":             { avg: 20500, trend: "+6%" },
  "חולון":                   { avg: 23500, trend: "+7%" },
  "בת ים":                   { avg: 22500, trend: "+8%" },
  "מודיעין-מכבים-רעות":      { avg: 21000, trend: "+6%" },
  "מודיעין":                 { avg: 21000, trend: "+6%" },
  "לוד":                     { avg: 16000, trend: "+10%" },
  "רמלה":                    { avg: 14000, trend: "+10%" },
  // Jerusalem
  "ירושלים":                 { avg: 26000, trend: "+4%" },
  // Haifa area
  "חיפה":                    { avg: 13000, trend: "+3%" },
  "עכו":                     { avg: 11000, trend: "+6%" },
  "נהריה":                   { avg: 14000, trend: "+5%" },
  // South
  "אשדוד":                   { avg: 15500, trend: "+7%" },
  "אשקלון":                  { avg: 13500, trend: "+5%" },
  "באר שבע":                 { avg: 9500,  trend: "+12%" },
  "אילת":                    { avg: 12000, trend: "+8%" },
  // North
  "טבריה":                   { avg: 8000,  trend: "+4%" },
  "צפת":                     { avg: 7000,  trend: "+3%" },
  "כרמיאל":                  { avg: 9000,  trend: "+5%" },
};

// ─── data.gov.il — schools by city ───────────────────────────────────────────
// "סוג מוסד" field values: "בית ספר" (school) | "גן ילדים" (kindergarten)
const GOV_SCHOOLS_RESOURCE = "5548fd63-5868-4053-ad81-98caddc5e232";

async function fetchSchools(city: string) {
  try {
    // Sort "בית ספר" (ב) before "גן ילדים" (ג) — schools come first alphabetically
    const filters = encodeURIComponent(JSON.stringify({ "שם ישוב": city }));
    const sort = encodeURIComponent("סוג מוסד asc, שם מוסד asc");
    const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${GOV_SCHOOLS_RESOURCE}&filters=${filters}&sort=${sort}&limit=200`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { count: 0, schools: [] as { name: string; type: string }[] };
    const json = await res.json();
    const records: Record<string, string>[] = json.result?.records ?? [];

    // Filter client-side: keep only schools (not kindergartens)
    const schools = records.filter((r) => r["סוג מוסד"] === "בית ספר");

    // De-duplicate by name
    const seen = new Set<string>();
    const unique = schools.filter((s) => {
      if (seen.has(s["שם מוסד"])) return false;
      seen.add(s["שם מוסד"]);
      return true;
    });

    // Derive school level from "סוג חינוך מוסד" field
    const levelLabel = (r: Record<string, string>) =>
      r["סוג חינוך מוסד"] === "מיוחד" ? "חינוך מיוחד" : "בית ספר";

    return {
      count: unique.length,
      schools: unique
        .slice(0, 8)
        .map((s) => ({ name: s["שם מוסד"], type: levelLabel(s) })),
    };
  } catch {
    return { count: 0, schools: [] as { name: string; type: string }[] };
  }
}

// ─── Claude — AI description ──────────────────────────────────────────────────
async function generateDescription(city: string, neighborhood: string) {
  try {
    const client = new Anthropic();
    const location = neighborhood ? `"${neighborhood}" ב${city}` : city;
    const { content } = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 220,
      messages: [
        {
          role: "user",
          content: `כתוב תיאור קצר ואטרקטיבי (2-3 משפטים בעברית, ללא כותרת) של ${location} לרוכש פוטנציאלי של נכס.
התמקד: אווירה, קהילה, איכות חיים, יתרונות מיקומיים. שפה חיובית ומרשימה. ללא מחירים.`,
        },
      ],
    });
    return (content[0] as { text: string }).text.trim();
  } catch {
    return `${city} מציעה איכות חיים גבוהה, תשתיות מפותחות וקהילה חזקה — מיקום מבוקש עם נגישות מצוינת.`;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function getNeighborhoodData(
  city: string,
  neighborhood: string
): Promise<NeighborhoodData | null> {
  if (!city) return null;

  const ONE_MONTH   = 30  * 24 * 60 * 60 * 1000;
  const SIX_MONTHS  = 180 * 24 * 60 * 60 * 1000;
  const now         = Date.now();

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
    // Table might not exist yet — continue without cache
  }

  const pricesAge  = existing?.prices_updated_at
    ? now - new Date(existing.prices_updated_at as string).getTime() : Infinity;
  const analysisAge = existing?.analysis_updated_at
    ? now - new Date(existing.analysis_updated_at as string).getTime() : Infinity;

  const needsPrices   = pricesAge   > ONE_MONTH;
  const needsAnalysis = analysisAge > SIX_MONTHS;

  // ── 2. Fully fresh from cache ──
  if (existing && !needsPrices && !needsAnalysis) {
    return {
      city,
      neighborhood,
      avg_price_sqm: existing.avg_price_sqm as number | null,
      price_trend:   existing.price_trend   as string | null,
      description:   existing.description   as string | null,
      school_count:  (existing.school_count as number) ?? 0,
      schools:       (existing.schools_data as { name: string; type: string }[]) ?? [],
      image_url:     existing.image_url     as string | null,
    };
  }

  // ── 3. Fetch what's stale ──
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (needsPrices) {
    const p = CITY_PRICES[city] ?? null;
    updates.avg_price_sqm    = p?.avg ?? null;
    updates.price_trend      = p?.trend ?? null;
    updates.prices_updated_at = new Date().toISOString();
  }

  if (needsAnalysis) {
    const [schoolsResult, description] = await Promise.all([
      fetchSchools(city),
      generateDescription(city, neighborhood),
    ]);
    updates.school_count         = schoolsResult.count;
    updates.schools_data         = schoolsResult.schools;
    updates.description          = description;
    updates.image_url            = (existing?.image_url as string | null) ?? null; // set manually via Supabase
    updates.analysis_updated_at  = new Date().toISOString();
  }

  // ── 4. Persist to Supabase ──
  try {
    const supabaseAdmin = await createAdminClient();
    if (existing) {
      await supabaseAdmin
        .from("neighborhoods")
        .update(updates)
        .eq("city", city)
        .eq("neighborhood", neighborhood);
    } else {
      await supabaseAdmin
        .from("neighborhoods")
        .insert({ city, neighborhood, ...updates });
    }
  } catch {
    // Silently ignore — table might not exist yet
  }

  const merged = { ...(existing ?? {}), ...updates };
  return {
    city,
    neighborhood,
    avg_price_sqm: (merged.avg_price_sqm ?? null)  as number | null,
    price_trend:   (merged.price_trend   ?? null)  as string | null,
    description:   (merged.description   ?? null)  as string | null,
    school_count:  (merged.school_count  ?? 0)     as number,
    schools:       ((merged.schools_data ?? [])     as { name: string; type: string }[]),
    image_url:     (merged.image_url     ?? null)  as string | null,
  };
}
