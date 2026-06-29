"use client";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import PropertyCard, { type Property } from "@/components/ui/PropertyCard";

export default function FeaturedPropertiesGrid({ properties }: { properties: Property[] }) {
  if (!properties.length) return null;

  return (
    <section id="properties" className="py-24 bg-[var(--color-cream)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-[var(--color-gold)] text-xs font-bold uppercase tracking-[3px] mb-2 block">
              נכסי בחירה
            </span>
            <h2 className="text-4xl font-black text-[var(--color-luxury-black)]">נכסים מובחרים</h2>
          </div>
          <a
            href="/properties"
            className="flex items-center gap-2 text-[var(--color-luxury-black)]/35 hover:text-[var(--color-gold)] transition-colors text-sm"
          >
            כל הנכסים
            <ArrowLeft size={15} />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.09 }}
            >
              <PropertyCard property={p} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
