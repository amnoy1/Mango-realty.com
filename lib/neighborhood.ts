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

// ─── Timeout helper — AbortSignal.timeout unreliable on Vercel ────────────────
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

// ─── data.gov.il — public transport stops (Ministry of Transport) ─────────────
const GOV_TRANSPORT_RESOURCE = "e873e6a2-66c1-494f-a677-f5e77348edb0";

async function fetchTransportStops(city: string): Promise<number | null> {
  try {
    const f = encodeURIComponent(JSON.stringify({ CityName: city }));
    const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${GOV_TRANSPORT_RESOURCE}&filters=${f}&limit=1`;
    const result = await withTimeout(fetch(url).then(r => r.ok ? r.json() : null), 3000);
    const total: number = result?.result?.total ?? 0;
    return total > 0 ? total : null;
  } catch {
    return null;
  }
}

// ─── data.gov.il — demographics (CBS) ─────────────────────────────────────────
const GOV_DEMOGRAPHICS_RESOURCE = "64edd0ee-3d5d-43ce-8562-c336c24dbc1f";

async function fetchDemographics(city: string): Promise<number | null> {
  try {
    const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${GOV_DEMOGRAPHICS_RESOURCE}&q=${encodeURIComponent(city)}&limit=5`;
    const result = await withTimeout(fetch(url).then(r => r.ok ? r.json() : null), 3000);
    const records: Record<string, unknown>[] = result?.result?.records ?? [];
    if (records.length === 0) return null;
    const row = records[0];
    const rawPop = row["סך הכל"] ?? row["אוכלוסייה"] ?? row["population"];
    const pop =
      typeof rawPop === "number" ? rawPop
      : typeof rawPop === "string" ? (parseFloat(rawPop.replace(/,/g, "")) || null)
      : null;
    return pop;
  } catch {
    return null;
  }
}

// ─── Static socio-economic cluster lookup (CBS 2019, scale 1–10) ──────────────
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

// ─── Main export ──────────────────────────────────────────────────────────────
export async function getNeighborhoodData(
  city: string,
  neighborhood: string,
  street = "",
): Promise<NeighborhoodData | null> {
  if (!city) return null;

  const SIX_MONTHS = 180 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  // ── 1. Check Supabase cache ──────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let existing: Record<string, unknown> | null = null;
  try {
    const admin = await createAdminClient();
    // Use `as any` to bypass typed-client restrictions on the neighborhoods table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any;
    const { data } = await db
      .from("neighborhoods")
      .select("*")
      .eq("city", city)
      .eq("neighborhood", neighborhood)
      .single();
    existing = data ?? null;
  } catch {
    /* cache miss or unavailable — continue to generate */
  }

  const analysisAge = existing?.analysis_updated_at
    ? now - new Date(existing.analysis_updated_at as string).getTime()
    : Infinity;

  // ── 2. Return from cache if fresh (< 6 months) ──────────────────────────────
  if (existing && analysisAge < SIX_MONTHS) {
    return {
      city,
      neighborhood,
      description: (existing.description as string | null) ?? null,
      transport:   (existing.transport   as string | null) ?? null,
      schools:     (existing.schools     as string | null) ?? null,
      lifestyle:   (existing.lifestyle   as string | null) ?? null,
      commerce:    (existing.commerce    as string | null) ?? null,
      character:   (existing.character   as string | null) ?? null,
      image_url:   (existing.image_url   as string | null) ?? null,
    };
  }

  // ── 3. Fetch city-level context in parallel (3s timeout each) ───────────────
  const [transportStops, population] = await Promise.all([
    fetchTransportStops(city),
    fetchDemographics(city),
  ]);

  const clusterLevel = SOCIO_ECONOMIC_CLUSTERS[city] ?? null;
  const needsResolution = !neighborhood && !!street;

  const target = neighborhood
    ? `שכונת "${neighborhood}" ב${city}`
    : street
      ? `הכתובת "${street}", ${city}`
      : city;

  const bg: string[] = [];
  if (clusterLevel !== null) {
    const desc = clusterLevel >= 8 ? "גבוה" : clusterLevel >= 6 ? "בינוני-גבוה" : clusterLevel >= 4 ? "בינוני" : "נמוך";
    bg.push(`אשכול סוציו-אקונומי של ${city}: ${clusterLevel}/10 (${desc})`);
  }
  if (transportStops !== null)
    bg.push(`${transportStops} תחנות תחבורה ציבורית ב${city}`);
  if (population !== null)
    bg.push(`אוכלוסיית ${city}: ~${population.toLocaleString("he-IL")} תושבים`);

  const bgText = bg.length > 0 ? `\nרקע על ${city}: ${bg.join(" | ")}` : "";

  const resolveInstruction = needsResolution
    ? `\nהנכס נמצא ב${target}. בהתבסס על הידע שלך, קבע באיזו שכונה ב${city} נמצא הרחוב הזה, וכתוב פרופיל של אותה שכונה. כלול את שם השכונה בשדה "neighborhood_name" ב-JSON.`
    : "";

  const neighborhoodNameField = needsResolution
    ? `\n  "neighborhood_name": "שם השכונה — בעברית (לדוגמה: נווה אדיר, גבעת הורדים)",`
    : "";

  const prompt = `אתה copywriter נדל"ן ישראלי בכיר עם ידע מעמיק על שכונות בישראל. כתוב פרופיל שכונה עבור ${target}.
קהל היעד: משפחות וזוגות שמחשבים לגור כאן.${bgText}${resolveInstruction}

כתוב על הנושאים הבאים בהתבסס על הידע שלך:
- בתי ספר וגני ילדים סמוכים (שמות אמיתיים אם ידוע)
- תחבורה ונגישות (כבישים, קווי אוטובוס, זמן לתל אביב)
- מסחר ושירותים (קניונים, סופרמרקטים, קופות חולים)
- פנאי ואיכות חיים (פארקים, מרכזי קהילה)
- אופי האוכלוסייה

כללים:
- כתוב רק על השכונה הספציפית — לא על ${city} כולה
- אל תמציא שמות שאינך בטוח בהם — תאר בכלליות אם צריך
- עברית חיה, קצרה, ישירה

החזר JSON בלבד:
{${neighborhoodNameField}
  "description": "3-4 משפטים: מה ייחודי בשכונה, מה מרוויח מי שגר כאן. ישיר וספציפי.",
  "transport": "2 משפטים: כבישים ספציפיים, זמן נסיעה לתל אביב/מרכז, קווי אוטובוס.",
  "schools": "2 משפטים: בתי ספר וגנים סמוכים — שמות, גילאים, מגוון.",
  "lifestyle": "2 משפטים: פארקים, מרכז קהילה, בריכה, ספרייה.",
  "commerce": "2 משפטים: מרכזי קניות, רשתות מזון, קופת חולים.",
  "character": "2 משפטים: מי גר כאן, אווירה, וותיקות/התחדשות, רמה סוציו-אקונומית."
}`;

  // ── 4. Generate with Claude ──────────────────────────────────────────────────
  let generated: Record<string, string | null | undefined> | null = null;
  try {
    const client = new Anthropic({ timeout: 30_000 });
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = [...res.content].reverse().find(b => b.type === "text");
    if (textBlock && textBlock.type === "text") {
      const text = textBlock.text;
      const start = text.indexOf("{");
      const end   = text.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        const d = JSON.parse(text.slice(start, end + 1));
        if (d.description || d.transport) {
          const str = (v: unknown) => typeof v === "string" ? v : null;
          generated = {
            description:      str(d.description),
            transport:        str(d.transport),
            schools:          str(d.schools),
            lifestyle:        str(d.lifestyle),
            commerce:         str(d.commerce),
            character:        str(d.character),
            neighborhood_name: str(d.neighborhood_name),
          };
        }
      }
    }
  } catch (e) {
    console.error("[neighborhood] Claude failed:", e);
  }

  if (!generated && !existing) return null;

  const resolvedNeighborhood = generated?.neighborhood_name ?? neighborhood;
  const { neighborhood_name: _drop, ...generatedFields } = generated ?? {};
  void _drop;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    image_url:  (existing?.image_url as string | null) ?? null,
    ...(generated ? { ...generatedFields, analysis_updated_at: new Date().toISOString() } : {}),
  };

  // ── 5. Persist to Supabase (fire-and-forget) ─────────────────────────────────
  (async () => {
    try {
      const admin = await createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = admin as any;
      if (existing) {
        await db.from("neighborhoods").update(updates).eq("city", city).eq("neighborhood", resolvedNeighborhood);
      } else {
        await db.from("neighborhoods").insert({ city, neighborhood: resolvedNeighborhood, ...updates });
      }
    } catch (e) {
      console.error("[neighborhood] cache write failed:", e);
    }
  })();

  const merged = { ...(existing ?? {}), ...updates };
  const s = (v: unknown) => typeof v === "string" ? v : null;
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
