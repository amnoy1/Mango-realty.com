"use client";
import { motion } from "framer-motion";
import { TrendingUp, ArrowLeft } from "lucide-react";
import Image from "next/image";

const NEIGHBORHOODS = [
  {
    name: "הצפון הישן",
    city: "תל אביב",
    avgPrice: "₪42,000 / מ\"ר",
    trend: "+8%",
    description: "שכונת הבוטיק הכי יוקרתית בת\"א — בתים עם בוגנוויליה, מסעדות כוכב ופארקים",
    image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=500&q=80",
  },
  {
    name: "נווה עופר",
    city: "רמת גן",
    avgPrice: "₪31,000 / מ\"ר",
    trend: "+12%",
    description: "השכונה הכי חמה ברמת גן — ביקוש גבוה, מחירים עולים, קהילה מבוקשת",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=500&q=80",
  },
  {
    name: "בורוכוב",
    city: "גבעתיים",
    avgPrice: "₪28,500 / מ\"ר",
    trend: "+6%",
    description: "גבעתיים הרגועה עם רמת חיים גבוהה, בתי ספר מצוינים ותחבורה נוחה",
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500&q=80",
  },
];

export default function Neighborhoods() {
  return (
    <section id="neighborhoods" className="py-24 bg-[var(--color-luxury-black)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-[var(--color-mango)] text-xs font-semibold uppercase tracking-widest mb-2 block">
              ניתוח שוק
            </span>
            <h2 className="text-4xl font-black text-[var(--color-cream)]">שכונות מבוקשות</h2>
          </div>
          <a
            href="/neighborhoods"
            className="flex items-center gap-2 text-[var(--color-cream)]/40 hover:text-[var(--color-mango)] transition-colors text-sm"
          >
            כל השכונות
            <ArrowLeft size={15} />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {NEIGHBORHOODS.map((n, i) => (
            <motion.div
              key={n.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="group bg-[var(--color-charcoal)] rounded-2xl overflow-hidden border border-white/5 hover:border-[var(--color-mango)]/18 transition-all cursor-pointer hover:-translate-y-1"
            >
              {/* Image */}
              <div className="relative h-44">
                <Image
                  src={n.image}
                  alt={n.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-charcoal)] via-transparent to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-1 bg-green-500/18 border border-green-500/28 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                  <TrendingUp size={10} />
                  {n.trend}
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="text-xl font-black text-[var(--color-cream)]">{n.name}</h3>
                  <span className="text-xs text-[var(--color-cream)]/35">{n.city}</span>
                </div>
                <p className="text-[var(--color-cream)]/45 text-sm mb-4 leading-relaxed">{n.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-mango)] font-bold text-sm">{n.avgPrice}</span>
                  <span className="text-[var(--color-cream)]/25 text-xs">ממוצע שוק</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
