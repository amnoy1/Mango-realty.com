import Anthropic from "@anthropic-ai/sdk";

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

// ─── Main export — Claude only, no external dependencies ──────────────────────
export async function getNeighborhoodData(
  city: string,
  neighborhood: string,
  street = "",
): Promise<NeighborhoodData | null> {
  if (!city) return null;

  const clusterLevel = SOCIO_ECONOMIC_CLUSTERS[city] ?? null;
  const needsResolution = !neighborhood && !!street;

  const target = neighborhood
    ? `שכונת "${neighborhood}" ב${city}`
    : street
      ? `הכתובת "${street}", ${city}`
      : city;

  const bg: string[] = [];
  if (clusterLevel !== null) {
    const desc =
      clusterLevel >= 8 ? "גבוה"
      : clusterLevel >= 6 ? "בינוני-גבוה"
      : clusterLevel >= 4 ? "בינוני"
      : "נמוך";
    bg.push(`אשכול סוציו-אקונומי של ${city}: ${clusterLevel}/10 (${desc})`);
  }
  const bgText = bg.length > 0 ? `\nרקע על ${city}: ${bg.join(" | ")}` : "";

  const resolveInstruction = needsResolution
    ? `\nהנכס נמצא ב${target}. בהתבסס על הידע שלך, קבע באיזו שכונה ב${city} נמצא הרחוב הזה, וכתוב פרופיל של אותה שכונה. כלול את שם השכונה בשדה "neighborhood_name" ב-JSON.`
    : "";

  const neighborhoodNameField = needsResolution
    ? `\n  "neighborhood_name": "שם השכונה בעברית",`
    : "";

  const prompt = `אתה copywriter נדל"ן ישראלי בכיר עם ידע מעמיק על שכונות בישראל. כתוב פרופיל שכונה עבור ${target}.
קהל היעד: משפחות וזוגות שמחשבים לגור כאן.${bgText}${resolveInstruction}

כתוב בהתבסס על הידע שלך:
- בתי ספר וגני ילדים סמוכים
- תחבורה ונגישות
- מסחר ושירותים
- פנאי ואיכות חיים
- אופי האוכלוסייה

כללים: כתוב רק על השכונה הספציפית. עברית קצרה וישירה.

החזר JSON בלבד:
{${neighborhoodNameField}
  "description": "3-4 משפטים על השכונה.",
  "transport": "2 משפטים: כבישים, זמן לתל אביב, אוטובוסים.",
  "schools": "2 משפטים: בתי ספר וגנים.",
  "lifestyle": "2 משפטים: פארקים ופנאי.",
  "commerce": "2 משפטים: קניות ושירותים.",
  "character": "2 משפטים: אוכלוסייה ואווירה."
}`;

  try {
    const client = new Anthropic({ timeout: 30_000 });
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = [...res.content].reverse().find(b => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      console.error("[neighborhood] no text block in response");
      return null;
    }

    const text = textBlock.text;
    const start = text.indexOf("{");
    const end   = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      console.error("[neighborhood] no JSON found in response:", text.slice(0, 200));
      return null;
    }

    const d = JSON.parse(text.slice(start, end + 1));
    const str = (v: unknown) => typeof v === "string" ? v : null;

    const resolvedNeighborhood = str(d.neighborhood_name) ?? neighborhood;

    return {
      city,
      neighborhood: resolvedNeighborhood,
      description: str(d.description),
      transport:   str(d.transport),
      schools:     str(d.schools),
      lifestyle:   str(d.lifestyle),
      commerce:    str(d.commerce),
      character:   str(d.character),
      image_url:   null,
    };
  } catch (e) {
    console.error("[neighborhood] error:", e);
    return null;
  }
}
