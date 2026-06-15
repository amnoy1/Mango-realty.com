"use client";
import { motion } from "framer-motion";
import { Bot, Clock, Sparkles, Shield } from "lucide-react";

const features = [
  { icon: Clock,    text: "זמין 24/7 — ענה על שאלות בכל שעה" },
  { icon: Sparkles, text: "מחפש נכסים לפי ההעדפות שלך בדיוק" },
  { icon: Shield,   text: "מנהל משא ומתן ומנתח שווי נכסים" },
];

export default function AIAgentSection() {
  return (
    <section id="agent" className="py-24 bg-[var(--color-charcoal)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-br from-[var(--color-mango)]/10 to-[var(--color-mango)]/3 border border-[var(--color-mango)]/18 rounded-3xl p-8 md:p-14 flex flex-col md:flex-row items-center gap-12">

          {/* Content */}
          <div className="flex-1">
            <span className="text-[var(--color-mango)] text-xs font-semibold uppercase tracking-widest mb-3 block">
              סוכן AI אישי
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-[var(--color-cream)] leading-tight mb-5">
              הסוכן שלך<br />
              <span className="text-[var(--color-mango)]">תמיד פה בשבילך</span>
            </h2>
            <p className="text-[var(--color-cream)]/55 text-lg leading-relaxed mb-8 max-w-md">
              הסוכן החכם של מנגו ריאלטי מכיר כל נכס, כל שכונה, ומוכן לעזור לך למצוא את הבית המושלם — בלי המתנה, בלי לחץ.
            </p>

            <ul className="space-y-3.5 mb-10">
              {features.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-[var(--color-cream)]/65 text-sm">
                  <Icon size={16} className="text-[var(--color-mango)] shrink-0" />
                  {text}
                </li>
              ))}
            </ul>

            <button className="bg-[var(--color-mango)] hover:bg-[var(--color-mango-light)] text-black font-black px-8 py-4 rounded-full transition-all hover:shadow-lg hover:shadow-[var(--color-mango)]/20 text-base">
              שוחח עם הסוכן →
            </button>
          </div>

          {/* Chat mockup */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full md:w-80 bg-[var(--color-luxury-black)] rounded-2xl border border-white/8 overflow-hidden shadow-2xl shrink-0"
          >
            {/* Header */}
            <div className="bg-[var(--color-charcoal)] px-4 py-3 flex items-center gap-3 border-b border-white/5">
              <div className="w-8 h-8 rounded-full bg-[var(--color-mango)] flex items-center justify-center shrink-0">
                <Bot size={15} className="text-black" />
              </div>
              <div>
                <div className="text-[var(--color-cream)] text-sm font-semibold">מנגו AI</div>
                <div className="text-green-400 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  מחובר
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="p-4 space-y-3 text-sm">
              <div className="bg-[var(--color-charcoal)] rounded-2xl rounded-tr-sm p-3 text-[var(--color-cream)]/80 max-w-[88%] mr-auto leading-relaxed text-right">
                שלום! מחפש דירה בתל אביב, 4 חדרים, עד 4M ₪
              </div>
              <div className="bg-[var(--color-mango)]/12 border border-[var(--color-mango)]/18 rounded-2xl rounded-tl-sm p-3 text-[var(--color-cream)]/80 max-w-[88%] leading-relaxed">
                שלום! מצאתי 8 נכסים מתאימים 🏠<br />
                הכי טוב: 4 חד&apos; בפלורנטין, 105 מ&quot;ר, קומה 4. מחיר: ₪3.85M
              </div>
              <div className="bg-[var(--color-charcoal)] rounded-2xl rounded-tr-sm p-3 text-[var(--color-cream)]/80 max-w-[88%] mr-auto text-right">
                מעניין! אפשר לראות תמונות?
              </div>
              <div className="flex gap-1 px-1 pt-1">
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="w-2 h-2 rounded-full bg-[var(--color-mango)]/50 animate-bounce"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
