"use client";
import { motion } from "framer-motion";
import { Building2, Users, TrendingUp, Award } from "lucide-react";

const stats = [
  { icon: Building2, value: "500+",   label: "נכסים פעילים" },
  { icon: Users,     value: "1,200+", label: "לקוחות מרוצים" },
  { icon: TrendingUp,value: "98%",    label: "הצלחה בעסקאות" },
  { icon: Award,     value: "12",     label: "שנות ניסיון" },
];

export default function Stats() {
  return (
    <section className="bg-[var(--color-luxury-black)] pt-20 pb-10">
      <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map(({ icon: Icon, value, label }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="text-center"
          >
            <Icon size={22} className="text-[var(--color-gold)] mx-auto mb-2" />
            <div className="text-3xl font-black text-[var(--color-gold)]">{value}</div>
            <div className="text-xs text-[var(--color-cream)]/40 mt-1">{label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
