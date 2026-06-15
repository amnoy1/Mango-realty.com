"use client";
import { motion } from "framer-motion";
import { MessageSquare, Search, Key } from "lucide-react";

const STEPS = [
  {
    icon: MessageSquare,
    title: "שוחח עם הסוכן",
    desc: "ספר לסוכן ה-AI שלנו מה אתה מחפש — בחינם ובלי התחייבות",
  },
  {
    icon: Search,
    title: "קבל נכסים מותאמים",
    desc: "הסוכן יסנן אלפי נכסים ויציג לך רק את הכי מתאימים",
  },
  {
    icon: Key,
    title: "סגור עסקה",
    desc: "הצוות שלנו מלווה אותך עד לחתימה — עם כל הניירת והמשפטי",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-[var(--color-charcoal)]">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <span className="text-[var(--color-mango)] text-xs font-semibold uppercase tracking-widest mb-3 block">
          תהליך פשוט
        </span>
        <h2 className="text-4xl font-black text-[var(--color-cream)] mb-16">איך זה עובד?</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
          {/* connector */}
          <div className="hidden md:block absolute top-9 right-[calc(33%+24px)] left-[calc(33%+24px)] h-px bg-[var(--color-mango)]/15" />

          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-6">
                <div className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-[var(--color-mango)]/10 border border-[var(--color-mango)]/25 flex items-center justify-center">
                  <Icon size={28} className="text-[var(--color-mango)]" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[var(--color-mango)] rounded-full text-black text-[10px] font-black flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="text-lg font-black text-[var(--color-cream)] mb-2">{title}</h3>
              <p className="text-[var(--color-cream)]/45 text-sm leading-relaxed max-w-[220px]">{desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-14"
        >
          <button className="bg-[var(--color-mango)] hover:bg-[var(--color-mango-light)] text-black font-black px-10 py-4 rounded-full transition-all hover:shadow-lg hover:shadow-[var(--color-mango)]/20 text-base">
            התחל עכשיו — בחינם →
          </button>
        </motion.div>
      </div>
    </section>
  );
}
