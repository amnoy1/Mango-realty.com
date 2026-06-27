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

// ── Fetch with real AbortController (actually cancels the network request) ──
async function fetchGov(url: string, timeoutMs = 3500): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// ── Hard wall-clock timeout for Claude (Promise.race — terminates hanging call) ─
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([p, new Promise<null>((res) => setTimeout(() => res(null), ms))]);
}

// ── data.gov.il: public transport stops (Ministry of Transport) ───────────────
const GOV_TRANSPORT = "e873e6a2-66c1-494f-a677-f5e77348edb0";

async function fetchTransportCount(city: string): Promise<number | null> {
  const f = encodeURIComponent(JSON.stringify({ CityName: city }));
  const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${GOV_TRANSPORT}&filters=${f}&limit=1`;
  const data = await fetchGov(url);
  const total = (data as { result?: { total?: number } } | null)?.result?.total ?? 0;
  return total > 0 ? total : null;
}

// ── data.gov.il: CBS demographics ─────────────────────────────────────────────
const GOV_DEMOGRAPHICS = "64edd0ee-3d5d-43ce-8562-c336c24dbc1f";

async function fetchPopulation(city: string): Promise<number | null> {
  const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${GOV_DEMOGRAPHICS}&q=${encodeURIComponent(city)}&limit=5`;
  const data = await fetchGov(url);
  const records = (data as { result?: { records?: Record<string, unknown>[] } } | null)?.result?.records ?? [];
  if (!records.length) return null;
  const row = records[0];
  const raw = row["סך הכל"] ?? row["אוכלוסייה"] ?? row["population"];
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") return parseFloat(raw.replace(/,/g, "")) || null;
  return null;
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

// ── Claude: generate neighborhood profile ─────────────────────────────────────
async function generateProfile(
  city: string,
  neighborhood: string,
  street: string,
  transportCount: number | null,
  population: number | null,
  cluster: number | null,
): Promise<Record<string, string | null | undefined> | null> {
  const needsResolution = !neighborhood && !!street;
  const target = neighborhood
    ? `שכונת "${neighborhood}" ב${city}`
    : street ? `הרחוב "${street}", ${city}` : city;

  const bg: string[] = [];
  if (cluster !== null) {
    const label = cluster >= 8 ? "גבוה" : cluster >= 6 ? "בינוני-גבוה" : cluster >= 4 ? "בינוני" : "נמוך";
    bg.push(`אשכול סוציו-אקונומי ${cluster}/10 (${label})`);
  }
  if (transportCount !== null) bg.push(`${transportCount} תחנות תחבורה ציבורית בעיר`);
  if (population !== null) bg.push(`אוכלוסיית ${city}: ~${population.toLocaleString("he-IL")} תושבים`);
  const bgLine = bg.length ? `\n\nנתוני רקע אמיתיים על ${city}: ${bg.join(" | ")}` : "";

  const resolveNote = needsResolution
    ? `\nהנכס נמצא ב${target}. קבע באיזו שכונה ב${city} נמצא הרחוב, וכתוב פרופיל של אותה שכונה. רשום את שמה ב-neighborhood_name.`
    : "";

  const nameField = needsResolution ? `\n  "neighborhood_name": "שם השכונה בעברית",` : "";

  const prompt = `אתה מומחה נדל"ן ישראלי עם ידע מעמיק על שכונות בישראל. כתוב פרופיל שכונה עבור ${target}.
קהל: משפחות וזוגות שמחשבים לגור כאן.${bgLine}${resolveNote}

כתוב על הנושאים הבאים בהתבסס על הידע שלך — כלול שמות אמיתיים של מוסדות, רחובות, קווי אוטובוס, קניונים אם ידועים:
- בתי ספר, גני ילדים, תיכונים קרובים
- תחבורה: כבישים, קווי אוטובוס, זמן לתל אביב
- מסחר: קניונים, רשתות מזון, קופות חולים
- פנאי: פארקים, מרכזי קהילה, בריכות
- אופי האוכלוסייה ורמת החיים

כתוב רק על השכונה הספציפית — לא על כל ${city}. עברית ישירה, לא שיווקית.

החזר JSON בלבד — ללא markdown, ללא \`\`\`:
{${nameField}
  "description": "3-4 משפטים: מה ייחודי בשכונה, מה האווירה, מה הופך אותה מיוחדת.",
  "transport": "2 משפטים: קווי אוטובוס ספציפיים אם ידועים, כבישים, זמן נסיעה לתל אביב.",
  "schools": "2 משפטים: שמות בתי ספר וגנים אם ידועים, מגוון גילאים.",
  "lifestyle": "2 משפטים: פארקים, מרכז קהילה, מגרשי ספורט, בריכה.",
  "commerce": "2 משפטים: מרכזי קניות, רשתות סופרמרקט, קופות חולים.",
  "character": "2 משפטים: מי גר כאן, ותיקים/צעירים, חרדים/חילונים, רמה כלכלית."
}`;

  try {
    const client = new Anthropic();
    const res = await withTimeout(
      client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1400,
        messages: [{ role: "user", content: prompt }],
      }),
      28_000,
    );

    if (!res) { console.error("[neighborhood] Claude timed out (28s)"); return null; }

    const block = res.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") { console.error("[neighborhood] no text block"); return null; }

    const text = block.text;
    const start = text.indexOf("{");
    const end   = text.lastIndexOf("}");
    if (start === -1 || end <= start) {
      console.error("[neighborhood] no JSON found:", text.slice(0, 300));
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
): Promise<NeighborhoodData | null> {
  if (!city) return null;

  const SIX_MONTHS = 180 * 24 * 60 * 60 * 1000;

  // 1. Supabase cache check
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

  // 2. Return fresh cache
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

  // 3. Fetch real data from data.gov.il in parallel (AbortController — actually cancels)
  const [transportCount, population] = await Promise.all([
    fetchTransportCount(city),
    fetchPopulation(city),
  ]);
  const cluster = CLUSTERS[city] ?? null;

  // 4. Generate with Claude Sonnet
  const generated = await generateProfile(city, neighborhood, street, transportCount, population, cluster);

  if (!generated && !existing) return null;

  const resolvedNeighborhood = (generated?.neighborhood_name as string | undefined) ?? neighborhood ?? city;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { neighborhood_name: _drop, ...fields } = generated ?? {};

  // 5. Persist (fire-and-forget)
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
        await db.from("neighborhoods").insert({ city, neighborhood: resolvedNeighborhood, ...updates });
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
