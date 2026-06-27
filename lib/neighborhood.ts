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

// Hard wall-clock timeout — more reliable than SDK timeout on Vercel
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

// Static socio-economic clusters (CBS 2019, scale 1–10)
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

export async function getNeighborhoodData(
  city: string,
  neighborhood: string,
  street = "",
): Promise<NeighborhoodData | null> {
  if (!city) return null;

  const SIX_MONTHS = 180 * 24 * 60 * 60 * 1000;

  // ── 1. Supabase cache check ──────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  } catch {
    // cache miss — continue
  }

  const analysisAge = existing?.analysis_updated_at
    ? Date.now() - new Date(existing.analysis_updated_at as string).getTime()
    : Infinity;

  // ── 2. Return cache if fresh ─────────────────────────────────────────────────
  if (existing && analysisAge < SIX_MONTHS) {
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

  // ── 3. Build prompt ──────────────────────────────────────────────────────────
  const cluster = CLUSTERS[city] ?? null;
  const clusterNote = cluster !== null
    ? ` (אשכול סוציו-אקונומי ${cluster}/10)`
    : "";

  const needsResolution = !neighborhood && !!street;
  const target = neighborhood
    ? `שכונת "${neighborhood}" ב${city}${clusterNote}`
    : street
      ? `הכתובת "${street}", ${city}${clusterNote}`
      : `${city}${clusterNote}`;

  const neighborhoodNameField = needsResolution
    ? `\n  "neighborhood_name": "שם השכונה בעברית",`
    : "";

  const resolveNote = needsResolution
    ? `\nזהה באיזו שכונה נמצא הרחוב וכתוב פרופיל של אותה שכונה. רשום את שמה ב-neighborhood_name.`
    : "";

  const prompt = `אתה מומחה נדל"ן ישראלי. כתוב פרופיל קצר של ${target} עבור קונים פוטנציאליים.${resolveNote}

החזר JSON בלבד:
{${neighborhoodNameField}
  "description": "3 משפטים: מה ייחודי בשכונה ומה מרוויח מי שגר כאן.",
  "transport": "2 משפטים: כבישים, זמן לתל אביב, תחבורה ציבורית.",
  "schools": "2 משפטים: בתי ספר וגנים — שמות אם ידועים.",
  "lifestyle": "2 משפטים: פארקים, מרכז קהילה, פנאי.",
  "commerce": "2 משפטים: קניות, מסעדות, שירותים.",
  "character": "2 משפטים: מי גר כאן, אווירה, רמת חיים."
}`;

  // ── 4. Claude — with hard 20s wall-clock timeout ──────────────────────────────
  let generated: Record<string, string | null> | null = null;
  try {
    const client = new Anthropic();
    console.log("[neighborhood] calling Claude for:", city, neighborhood);
    const res = await withTimeout(
      client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 700,
        messages: [{ role: "user", content: prompt }],
      }),
      20_000,
    );

    if (!res) {
      console.error("[neighborhood] Claude timed out (20s)");
    } else {
      const textBlock = res.content.find((b) => b.type === "text");
      if (textBlock && textBlock.type === "text") {
        const text = textBlock.text;
        console.log("[neighborhood] Claude raw:", text.slice(0, 200));
        const start = text.indexOf("{");
        const end   = text.lastIndexOf("}");
        if (start !== -1 && end > start) {
          try {
            const d = JSON.parse(text.slice(start, end + 1));
            const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
            if (d.description || d.transport) {
              generated = {
                description:       s(d.description),
                transport:         s(d.transport),
                schools:           s(d.schools),
                lifestyle:         s(d.lifestyle),
                commerce:          s(d.commerce),
                character:         s(d.character),
                neighborhood_name: s(d.neighborhood_name),
              };
              console.log("[neighborhood] generated OK, description:", generated.description?.slice(0, 60));
            } else {
              console.error("[neighborhood] Claude JSON had no description/transport:", JSON.stringify(d).slice(0, 200));
            }
          } catch (parseErr) {
            console.error("[neighborhood] JSON parse failed:", parseErr, "raw:", text.slice(start, end + 1).slice(0, 200));
          }
        } else {
          console.error("[neighborhood] No JSON braces in Claude response:", text.slice(0, 200));
        }
      } else {
        console.error("[neighborhood] No text block in Claude response");
      }
    }
  } catch (e) {
    console.error("[neighborhood] Claude error:", e);
  }

  if (!generated && !existing) return null;

  const resolvedNeighborhood =
    generated?.neighborhood_name ?? neighborhood ?? city;
  const { neighborhood_name: _drop, ...fields } = generated ?? {};
  void _drop;

  // ── 5. Persist to Supabase (fire-and-forget) ─────────────────────────────────
  // Only write columns that exist in the DB schema.
  // Extra columns (transport, lifestyle, commerce, character) are added via ALTER TABLE migration.
  const dbSafeFields = generated
    ? {
        description:         generated.description,
        analysis_updated_at: new Date().toISOString(),
      }
    : {};

  const updates = {
    ...dbSafeFields,
    updated_at: new Date().toISOString(),
    image_url:  (existing?.image_url as string | null) ?? null,
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
    } catch (e) {
      console.error("[neighborhood] cache write failed:", e);
    }
  })();

  // Merge all in-memory data (including columns not yet in DB) for the response
  const merged: Record<string, unknown> = {
    ...(existing ?? {}),
    ...updates,
    ...(generated ?? {}),
  };
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
