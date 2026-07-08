import type { Metadata } from "next";
import SellPageClient from "./SellPageClient";

export const metadata: Metadata = {
  title: "מכירת נכס עם מנגו נדל\"ן | ליווי מקצועי ממחיר עד מסירה",
  description: "חושבים למכור נכס? מנגו נדל\"ן מספקת ליווי מלא: הערכת שווי חינמית, שיווק מקצועי ומכירה במחיר הטוב ביותר. השאירו פרטים ונחזור אליכם.",
  openGraph: {
    title: "מכירת נכס עם מנגו נדל\"ן",
    description: "ליווי מקצועי ממחיר עד מסירה — צרו קשר עכשיו.",
    images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80"],
  },
};

export default function SellPage() {
  return <SellPageClient />;
}
