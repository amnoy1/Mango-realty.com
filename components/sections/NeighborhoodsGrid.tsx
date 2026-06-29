"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { NeighborhoodData } from "@/lib/neighborhood";

const FALLBACK = "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80";

type NHood = NeighborhoodData & { id: string; db_id?: string | null };

export default function NeighborhoodsGrid({ neighborhoods }: { neighborhoods: NHood[] }) {
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
          <Link
            href="/neighborhoods"
            className="flex items-center gap-2 text-[var(--color-luxury-black)]/35 hover:text-[var(--color-gold)] transition-colors text-sm"
          >
            כל השכונות <ArrowLeft size={15} />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {neighborhoods.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                href={n.db_id ? `/neighborhoods/${n.db_id}` : "/neighborhoods"}
                className="group text-right rounded-2xl overflow-hidden cursor-pointer block"
              >
                {/* Image — city name overlay */}
                <div className="relative h-56 rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.08)] group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.14)] transition-shadow">
                  <Image
                    src={n.image_url || FALLBACK}
                    alt={n.neighborhood}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 inset-x-0 text-center px-4">
                    <span className="text-white font-black text-xl tracking-wide drop-shadow-md">{n.city}</span>
                  </div>
                </div>

                {/* Neighborhood name below image */}
                <div className="pt-3 pb-1 px-1 text-right">
                  <h3 className="text-base font-bold text-[var(--color-luxury-black)] group-hover:text-[var(--color-gold)] transition-colors">
                    {n.neighborhood}
                  </h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
