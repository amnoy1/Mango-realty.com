"use client";
import { Clock, Sparkles, MessageCircle } from "lucide-react";
import PropertySearch from "./PropertySearch";

const features = [
  { icon: Clock,         text: "זמין 24/7, בכל שעה" },
  { icon: Sparkles,      text: "מחפש נכסים לפי ההעדפות שלך, בשפה חופשית" },
  { icon: MessageCircle, text: "תמונות ופרטים נוספים ישירות בווצאפ" },
];

export default function AIAgentSection() {
  return (
    <section id="agent" className="py-24 bg-[var(--color-luxury-black)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-[var(--color-gold)]/8 border border-[var(--color-gold)]/18 rounded-3xl p-6 md:p-14">

          <div className="mb-8">
            <span className="text-[var(--color-gold)] text-xs font-bold uppercase tracking-[3px] mb-3 block">
              סוכן AI אישי
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-[var(--color-cream)] leading-tight mb-5">
              ניר, הסוכן שלך<br />
              <span className="text-[var(--color-gold)]">תמיד פה בשבילך</span>
            </h2>
            <p className="text-[var(--color-cream)]/50 text-lg leading-relaxed mb-6 max-w-2xl">
              ניר, מנהל מחלקת הקונים של מנגו נדל&quot;ן, מחפש בשבילך בין הנכסים שבשיווק באזור. כתבו מה אתם מחפשים, בלי טפסים.
            </p>
            <ul className="flex flex-col md:flex-row md:flex-wrap gap-3 md:gap-6">
              {features.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-[var(--color-cream)]/60 text-sm">
                  <Icon size={16} className="text-[var(--color-gold)] shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <PropertySearch />
        </div>
      </div>
    </section>
  );
}
