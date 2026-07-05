import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const PERSONA_CONTEXT: Record<string, string> = {
  "משקיעים": "הקהל הוא משקיעים נדל\"ן. הדגש: תשואה פוטנציאלית, ביקוש להשכרה באזור, עליית ערך היסטורית, מיקום אסטרטגי, נכס להכנסה פסיבית.",
  "משפחות צעירות": "הקהל הוא משפחות צעירות עם ילדים. הדגש: מרחב מחיה, קרבה לבתי ספר וגנים, שכונה שקטה ובטוחה, פארקים, מרפסת/גינה, קהילה.",
  "זוגות מבוגרים": "הקהל הוא זוגות מבוגרים (50+). הדגש: נגישות, מעלית, קומה נמוכה, שקט, אחזקה נמוכה, קרבה לשירותים ובתי מרקחת, נוחות יומיומית.",
  "כלל הקהל": "הקהל הוא רחב — כל סוגי הקונים. הדגש: כל היתרונות של הנכס, איזון בין מאפיינים שונים, CTA פתוח ומזמין.",
};

export async function POST(req: Request) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email !== "amir@mango-realty.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    description, title, price, price_type, property_type,
    city, neighborhood, rooms, area_sqm, floor, features, buyerType,
  } = body;

  const personaContext = PERSONA_CONTEXT[buyerType] || PERSONA_CONTEXT["כלל הקהל"];

  const priceFormatted = price
    ? new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(Number(price))
    : "";

  const featuresText = features ? Object.entries(features)
    .filter(([, v]) => v === true || (typeof v === "string" && v && v !== "ללא"))
    .map(([k, v]) => {
      const labels: Record<string, string> = {
        elevator: "מעלית", renovated: "שיפוץ מלא", aircon: "מיזוג אוויר", saferoom: "ממ\"ד",
        parking: `חניה x${v}`, balcony_sqm: `מרפסת ${v} מ"ר`,
        storage_sqm: `מחסן ${v} מ"ר`, garden_sqm: `גינה ${v} מ"ר`,
        condition: String(v), year_built: `שנת בנייה ${v}`,
      };
      return labels[k] || k;
    })
    .join(", ") : "";

  const prompt = `אתה כותב תוכן שיווקי מקצועי לאתר נדל"ן יוקרתי בישראל בשם "מנגו נדל"ן".

פרטי הנכס:
- כותרת: ${title || "לא צוין"}
- סוג נכס: ${property_type || "לא צוין"}
- עסקה: ${price_type === "rent" ? "השכרה" : "מכירה"}
- מחיר: ${priceFormatted || "לא צוין"}
- עיר: ${city || "לא צוין"}
- שכונה: ${neighborhood || "לא צוין"}
- חדרים: ${rooms || "לא צוין"}
- שטח: ${area_sqm ? `${area_sqm} מ"ר` : "לא צוין"}
- קומה: ${floor || "לא צוין"}
- מאפיינים: ${featuresText || "לא צוינו"}

תיאור מקורי שהמשתמש כתב (שמור על כל המידע העובדתי):
${description || "(אין תיאור מקורי)"}

הנחיות קהל יעד:
${personaContext}

הנחיות כתיבה:
1. כתוב בעברית תקנית, שוטפת ומשכנעת
2. אורך: 150–250 מילים בדיוק
3. שלב טבעית: שם השכונה, העיר, סוג הנכס (חשוב ל-SEO ו-GEO)
4. התאם את הטון לקהל היעד שצוין
5. כלול CTA ברור וחזק בסוף (תיאום צפייה, יצירת קשר עם הסוכן)
6. אל תמציא מידע שלא קיים — רק שפר את הניסוח ואת המיקוד
7. הימנע מקלישאות ריקות כמו "נכס חלומות" — היה ספציפי ואמין

החזר תשובה ב-JSON בפורמט הבא בלבד (ללא טקסט נוסף):
{
  "description": "התיאור המשופר כאן",
  "metaDescription": "תיאור קצר עד 160 תווים לSEO כאן"
}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (err) {
    console.error("enhance-description error:", err);
    return NextResponse.json({ error: "שגיאה בעיבוד הבקשה" }, { status: 500 });
  }
}
