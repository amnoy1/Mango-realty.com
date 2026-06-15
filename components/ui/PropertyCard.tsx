import { Bed, Square, MapPin, Heart } from "lucide-react";
import Image from "next/image";

export interface Property {
  id: string;
  title: string;
  price: number;
  rooms: number;
  area: number;
  city: string;
  neighborhood: string;
  image: string;
  badge?: string;
}

export default function PropertyCard({ property }: { property: Property }) {
  const price = new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(property.price);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-black/6 shadow-[0_2px_20px_rgba(0,0,0,0.07)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.13)] transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <Image
          src={property.image}
          alt={property.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {property.badge && (
          <span className="absolute top-3 right-3 bg-[var(--color-gold)] text-[var(--color-luxury-black)] text-xs font-black px-3 py-1 rounded-full"
            style={{ fontFamily: "var(--font-heebo)" }}>
            {property.badge}
          </span>
        )}
        <button
          aria-label="שמור למועדפים"
          className="absolute top-3 left-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-[var(--color-gold)] transition-colors"
        >
          <Heart size={13} className="text-[var(--color-luxury-black)]" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-black text-[var(--color-luxury-black)] text-base leading-snug">{property.title}</h3>
          <span className="text-[var(--color-gold)] font-black text-base whitespace-nowrap shrink-0"
            style={{ fontFamily: "var(--font-heebo)" }}>{price}</span>
        </div>

        <div className="flex items-center gap-1 text-[var(--color-luxury-black)]/40 text-xs mb-4">
          <MapPin size={11} />
          <span>{property.neighborhood}, {property.city}</span>
        </div>

        <div className="flex items-center gap-5 text-xs text-[var(--color-luxury-black)]/45 border-t border-black/6 pt-4">
          <span className="flex items-center gap-1.5">
            <Bed size={13} className="text-[var(--color-gold)]" />
            {property.rooms} חדרים
          </span>
          <span className="flex items-center gap-1.5">
            <Square size={13} className="text-[var(--color-gold)]" />
            {property.area} מ&quot;ר
          </span>
        </div>
      </div>
    </div>
  );
}
