"use client";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import PropertyCard, { type Property } from "@/components/ui/PropertyCard";

const PROPERTIES: Property[] = [
  {
    id: "1",
    slug: "penthouse-tzafon-yashan",
    title: "רפפורט 3, כפר סבא",
    price: 8200000,
    rooms: 6,
    area: 220,
    city: "כפר סבא",
    neighborhood: "מרכז העיר",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80",
    badge: "חדש",
  },
  {
    id: "2",
    slug: "dira-5-chadarim-neve-ofer",
    title: "ביאליק 12, רמת גן",
    price: 5500000,
    rooms: 5,
    area: 148,
    city: "רמת גן",
    neighborhood: "נווה עופר",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80",
    badge: "בלעדי",
  },
  {
    id: "3",
    slug: "gan-eden-givataim",
    title: "בורוכוב 14, גבעתיים",
    price: 3800000,
    rooms: 4,
    area: 110,
    city: "גבעתיים",
    neighborhood: "בורוכוב",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80",
  },
  {
    id: "4",
    slug: "villa-breicha-ramat-hasharon",
    title: "לופבן 7, רמת השרון",
    price: 14500000,
    rooms: 8,
    area: 450,
    city: "רמת השרון",
    neighborhood: "שכונת השרון",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
    badge: "פרימיום",
  },
];

export default function FeaturedProperties() {
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PROPERTIES.map((p, i) => (
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
