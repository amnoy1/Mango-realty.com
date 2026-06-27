"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { MapPin, X, ArrowLeft } from "lucide-react";
import NeighborhoodSection from "@/components/properties/NeighborhoodSection";
import type { NeighborhoodData } from "@/lib/neighborhood";

const FALLBACK = "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80";

type NHood = NeighborhoodData & { id: string };

export default function NeighborhoodsGrid({ neighborhoods }: { neighborhoods: NHood[] }) {
  const [selected, setSelected] = useState<NHood | null>(null);

  return (
    <section id="neighborhoods" className="py-24 bg-[var(--color-surface)]">
      <div className="max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-[var(--color-gold)] text-xs font-bold uppercase tracking-[3px] mb-2 block">
              ניתוח שוק
            </span>
            <h2 className="text-4xl font-black text-[var(--color-luxury-black)]">שכונות מבוקשות</h2>
          </div>
          <a href="/properties"
            className="flex items-center gap-2 text-[var(--color-luxury-black)]/35 hover:text-[var(--color-gold)] transition-colors text-sm">
            כל הנכסים <ArrowLeft size={15} />
          </a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {neighborhoods.map((n, i) => (
            <motion.button
              key={n.id}
              onClick={() => setSelected(n)}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group text-right bg-white rounded-2xl overflow-hidden border border-black/6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-1 cursor-pointer"
            >
              {/* Image */}
              <div className="relative h-44">
                <Image
                  src={n.image_url || FALLBACK}
                  alt={n.neighborhood}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                  <MapPin size={11} className="text-white/80" />
                  <span className="text-white/80 text-xs">{n.city}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-xl font-black text-[var(--color-luxury-black)] mb-2">{n.neighborhood}</h3>
                {n.description ? (
                  <p className="text-[var(--color-luxury-black)]/45 text-sm leading-relaxed line-clamp-2">
                    {n.description}
                  </p>
                ) : (
                  <p className="text-[var(--color-luxury-black)]/25 text-sm italic">
                    ניתוח שכונה יתעדכן בקרוב
                  </p>
                )}
                <div className="mt-4 text-xs text-[var(--color-gold)] font-semibold">
                  {n.description ? "לפירוט המלא ←" : "צפה בנכסים ←"}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-[var(--color-cream)] rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
              dir="rtl"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-black/15" />
              </div>

              {/* Close button */}
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 left-4 p-2 rounded-full bg-black/6 hover:bg-black/10 transition-colors"
              >
                <X size={18} />
              </button>

              {/* Hero image */}
              {selected.image_url && (
                <div className="relative h-48 mx-4 mt-2 rounded-2xl overflow-hidden">
                  <Image
                    src={selected.image_url}
                    alt={selected.neighborhood}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
              )}

              {/* Neighborhood analysis */}
              <div className="px-6 pb-10">
                <NeighborhoodSection data={selected} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
