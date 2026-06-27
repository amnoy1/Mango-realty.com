import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "./supabase/server";

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

// ── Fetch with real AbortController (actually cancels at network level) ────────
async function fetchGov(url: string, ms = 4000): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    clearTimeout(t);
    return null;
  }
}

// ── Hard Promise.race timeout for Claude ──────────────────────────────────────
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([p, new Promise<null>((res) => setTimeout(() => res(null), ms))]);
}

// ── data.gov.il: bus stops within ~500m radius of property ───────────────────
// Resource: public transport stops (Ministry of Transport)
const GOV_STOPS = "e873e6a2-66c1-494f-a677-f5e77348edb0";

interface BusStop { StopCode?: string; StopName?: string; RouteDesc?: string; lat?: string; lng?: string; }

async function fetchNearbyStops(lat: number, lng: number): Promise<BusStop[]> {
  // ~500m bounding box in Israel
  const dLat = 0.0045, dLng = 0.0055;
  const sql = `SELECT "StopCode","StopName","RouteDesc","lat","lng" FROM "${GOV_STOPS}" WHERE "lat" BETWEEN '${lat - dLat}' AND '${lat + dLat}' AND "lng" BETWEEN '${lng - dLng}' AND '${lng + dLng}' LIMIT 30`;
  const url = `https://data.gov.il/api/3/action/datastore_search_sql?sql=${encodeURIComponent(sql)}`;
  const data = await fetchGov(url, 4000);
  return (data as { result?: { records?: BusStop[] } } | null)?.result?.records ?? [];
}

// ── data.gov.il: bus stops by city (fallback when no lat/lng) ────────────────
async function fetchCityStops(city: string): Promise<number | null> {
  const f = encodeURIComponent(JSON.stringify({ CityName: city }));
  const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${GOV_STOPS}&filters=${f}&limit=1`;
  const data = await fetchGov(url, 3500);
  const total = (data as { result?: { total?: number } } | null)?.result?.total ?? 0;
  return total > 0 ? total : null;
}

// ── Static CBS 2019 socio-economic clusters (scale 1–10) ──────────────────────
const CLUSTERS: Record<string, number> = {
  "תל אביב": 8, "תל אביב יפו": 8, "ירושלים": 5, "חיפה": 6,
  "ראשון לציון": 6, "פתח תקווה": 6, "נתניה": 5,
  "אשדוד": 5, "אשקלון": 4, "באר שבע": 4,
  "בני ברק": 3, "חולון": 6, "בת ים": 5,
  "רמת גן": 7, "גבעתיים": 8, "הרצליה": 8,
  "רעננה": 9, "כפר סבא": 7, "הוד השרון": 8,
  "מודיעין": 9, "קרית אונו": 7, "נס ציונה": 7,
  "ראש העין": 6, "רמת השרון": 9, "יהוד": 6,
  "לוד": 3, "רמלה": 3, "אור יהודה": 5,
  "עכו": 4, "נהריה": 6, "כרמיאל": 6, "טבריה": 4,
  "צפת": 4, "אילת": 6, "קרית גת": 4,
  "קרית שמונה": 4, "קרית ביאליק": 6, "קרית מוצקין": 5,
  "כפר יונה": 7, "אלפי מנשה": 8,
};

// ── Build context string from real data ───────────────────────────────────────
function buildContext(
  city: string,
  stops: BusStop[],
  cityStopCount: number | null,
  cluster: number | null,
): string {
  const lines: string[] = [];

  if (cluster !== null) {
    const label = cluster >= 8 ? "גבוה" : cluster >= 6 ? "בינוני-גבוה" : cluster >= 4 ? "בינוני" : "נמוך";
    lines.push(`אשכול סוציו-אקונומי של ${city}: ${cluster}/10 (${label})`);
  }

  if (stops.length > 0) {
    const names = [...new Set(stops.map(s => s.StopName).filter(Boolean))].slice(0, 6);
    lines.push(`תחנות אוטובוס בקרבת הנכס (500מ'): ${stops.length} תחנות — ${names.join(", ")}`);
    const routes = [...new Set(stops.map(s => s.RouteDesc).filter(Boolean))].slice(0, 5);
    if (routes.length) lines.push(`קווי אוטובוס: ${routes.join(", ")}`);
  } else if (cityStopCount !== null) {
    lines.push(`${cityStopCount} תחנות תחבורה ציבורית בעיר (אין נתוני GPS לנכס)`);
  }

  return lines.length ? `\n\nנתונים אמיתיים מרישומי המדינה:\n${lines.map(l => `• ${l}`).join("\n")}` : "";
}

// ── Claude: generate profile with web_search tool ─────────────────────────────
async function generateProfile(
  city: string,
  neighborhood: string,
  street: string,
  contextData: string,
): Promise<Record<string, string | null | undefined> | null> {
  const needsResolution = !neighborhood && !!street;
  const target = neighborhood
    ? `שכונת "${neighborhood}" ב${city}`
    : street ? `הרחוב "${street}", ${city}` : city;

  const nameField = needsResolution ? `\n  "neighborhood_name": "שם השכונה בעברית",` : "";
  const resolveNote = needsResolution
    ? `\nהנכס נמצא ב${target}. קבע באיזו שכונה מדובר וכתוב פרופיל שלה. רשום שמה ב-neighborhood_name.`
    : "";

  const prompt = `אתה מומחה נדל"ן ישראלי. כתוב פרופיל ספציפי של ${target} עבור קונים פוטנציאליים.${contextData}${resolveNote}

השתמש בחיפוש כדי למצוא מידע מדויק ועדכני על:
- שמות בתי ספר, גנים ותיכונים ספציפיים בשכונה
- קווי אוטובוס ספציפיים (מספרי קווים), תחנות, זמן נסיעה לתל אביב
- שמות מרכזי קניות, סופרמרקטים, קופות חולים
- פארקים, מרכזי קהילה, מתקני ספורט
- אופי האוכלוסייה והתפתחות השכונה

אחרי החיפוש, החזר JSON בלבד (ללא markdown, ללא \`\`\`):
{${nameField}
  "description": "3-4 משפטים: מה ייחודי בשכונה, מה האווירה, מה ההבדל מהשכונות הסמוכות.",
  "transport": "2 משפטים: קווי אוטובוס ספציפיים, כבישים, זמן לתל אביב.",
  "schools": "2 משפטים: שמות בתי ספר וגנים אמיתיים, גילאים.",
  "lifestyle": "2 משפטים: פארקים, מרכז קהילה, מתקני ספורט.",
  "commerce": "2 משפטים: שמות קניונים, רשתות סופרמרקט, קופת חולים.",
  "character": "2 משפטים: מי גר כאן, אווירה, רמה כלכלית."
}`;

  try {
    const client = new Anthropic();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createParams: any = {
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: prompt }],
    };
    const res = await withTimeout(
      client.messages.create(createParams) as Promise<Anthropic.Message>,
      90_000,
    );

    if (!res) { console.error("[neighborhood] Claude timed out"); return null; }

    // Find the last text block (after any web search results)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textBlocks = (res.content as any[]).filter((b: any): b is Anthropic.TextBlock => b.type === "text");
    const lastText = textBlocks[textBlocks.length - 1];
    if (!lastText) { console.error("[neighborhood] no text block in response"); return null; }

    const text = lastText.text;
    const start = text.indexOf("{");
    const end   = text.lastIndexOf("}");
    if (start === -1 || end <= start) {
      console.error("[neighborhood] no JSON in Claude response:", text.slice(0, 300));
      return null;
    }

    const d = JSON.parse(text.slice(start, end + 1));
    if (!d.description && !d.transport) {
      console.error("[neighborhood] JSON missing key fields");
      return null;
    }

    const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    return {
      description:       s(d.description),
      transport:         s(d.transport),
      schools:           s(d.schools),
      lifestyle:         s(d.lifestyle),
      commerce:          s(d.commerce),
      character:         s(d.character),
      neighborhood_name: s(d.neighborhood_name) ?? undefined,
    };
  } catch (e) {
    console.error("[neighborhood] Claude error:", e);
    return null;
  }
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function getNeighborhoodData(
  city: string,
  neighborhood: string,
  street = "",
  lat?: number | null,
  lng?: number | null,
): Promise<NeighborhoodData | null> {
  if (!city) return null;

  const SIX_MONTHS = 180 * 24 * 60 * 60 * 1000;

  // 1. Supabase cache
  let existing: Record<string, unknown> | null = null;
  try {
    const admin = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any)
      .from("neighborhoods")
      .select("*")
      .eq("city", city)
      .eq("neighborhood", neighborhood || city)
      .maybeSingle();
    existing = data ?? null;
  } catch { /* cache miss */ }

  const age = existing?.analysis_updated_at
    ? Date.now() - new Date(existing.analysis_updated_at as string).getTime()
    : Infinity;

  if (existing && age < SIX_MONTHS) {
    const s = (v: unknown) => (typeof v === "string" ? v : null);
    return {
      city,
      neighborhood: (existing.neighborhood as string) || neighborhood,
      description: s(existing.description),
      transport:   s(existing.transport),
      schools:     s(existing.schools),
      lifestyle:   s(existing.lifestyle),
      commerce:    s(existing.commerce),
      character:   s(existing.character),
      image_url:   s(existing.image_url),
    };
  }

  // 2. Real data from data.gov.il
  const cluster = CLUSTERS[city] ?? null;
  const [stops, cityStopCount] = await Promise.all([
    lat != null && lng != null ? fetchNearbyStops(lat, lng) : Promise.resolve([] as BusStop[]),
    lat == null || lng == null ? fetchCityStops(city) : Promise.resolve(null),
  ]);
  const contextData = buildContext(city, stops, cityStopCount, cluster);

  // 3. Generate with Claude + web search
  const generated = await generateProfile(city, neighborhood, street, contextData);

  if (!generated && !existing) return null;

  const resolvedNeighborhood = (generated?.neighborhood_name as string | undefined) ?? neighborhood ?? city;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { neighborhood_name: _drop, ...fields } = generated ?? {};

  // 4. Persist (fire-and-forget)
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    image_url:  (existing?.image_url as string | null) ?? null,
    ...(generated ? { ...fields, analysis_updated_at: new Date().toISOString() } : {}),
  };

  (async () => {
    try {
      const admin = await createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = admin as any;
      if (existing) {
        await db.from("neighborhoods").update(updates)
          .eq("city", city).eq("neighborhood", resolvedNeighborhood);
      } else {
        await db.from("neighborhoods")
          .insert({ city, neighborhood: resolvedNeighborhood, ...updates });
      }
    } catch (e) { console.error("[neighborhood] cache write:", e); }
  })();

  const merged: Record<string, unknown> = { ...(existing ?? {}), ...updates, ...(generated ?? {}) };
  const s = (v: unknown) => (typeof v === "string" ? v : null);
  return {
    city,
    neighborhood: resolvedNeighborhood,
    description: s(merged.description),
    transport:   s(merged.transport),
    schools:     s(merged.schools),
    lifestyle:   s(merged.lifestyle),
    commerce:    s(merged.commerce),
    character:   s(merged.character),
    image_url:   s(merged.image_url),
  };
}
