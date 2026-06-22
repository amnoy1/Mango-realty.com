import Image from "next/image";
import { TrendingUp, School, MapPin, Info } from "lucide-react";
import type { NeighborhoodData } from "@/lib/neighborhood";

export default function NeighborhoodSection({ data }: { data: NeighborhoodData }) {
  const hasContent = data.description || data.avg_price_sqm || data.school_count > 0;
  if (!hasContent) return null;

  const locationLabel = data.neighborhood
    ? `${data.neighborhood} · ${data.city}`
    : data.city;

  return (
    <section className="mt-12 pt-10 border-t border-black/8">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-6">
        <MapPin size={17} className="text-[var(--color-gold)]" />
        <h2 className="text-xl font-black text-[var(--color-luxury-black)]">
          {data.neighborhood ? `השכונה — ${data.neighborhood}` : `על ${data.city}`}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-7">
        {/* ── Image (2/5) ── */}
        {data.image_url && (
          <div className="md:col-span-2 relative rounded-2xl overflow-hidden aspect-[4/3] shrink-0">
            <Image
              src={data.image_url}
              alt={locationLabel}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 35vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <span className="absolute bottom-3 right-4 text-white text-sm font-bold drop-shadow">
              {locationLabel}
            </span>
          </div>
        )}

        {/* ── Info (3/5) ── */}
        <div className="md:col-span-3 flex flex-col justify-between gap-5">
          {/* AI description */}
          {data.description && (
            <p className="text-[var(--color-luxury-black)]/65 leading-relaxed text-[0.95rem]">
              {data.description}
            </p>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap gap-4">
            {data.avg_price_sqm && (
              <div className="flex-1 min-w-[130px] bg-[var(--color-gold)]/8 rounded-2xl p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-luxury-black)]/35 mb-1">
                  מחיר ממוצע למ&quot;ר
                </div>
                <div className="font-black text-xl text-[var(--color-luxury-black)]">
                  ₪{data.avg_price_sqm.toLocaleString("he-IL")}
                </div>
                {data.price_trend && (
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold mt-1">
                    <TrendingUp size={11} />
                    {data.price_trend} · שנה אחרונה
                  </div>
                )}
              </div>
            )}

            {data.school_count > 0 && (
              <div className="flex-1 min-w-[130px] bg-sky-50 rounded-2xl p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-luxury-black)]/35 mb-1">
                  מוסדות חינוך
                </div>
                <div className="font-black text-xl text-[var(--color-luxury-black)]">
                  {data.school_count}
                </div>
                <div className="text-xs text-[var(--color-luxury-black)]/35 mt-1">
                  בתי ספר בעיר
                </div>
              </div>
            )}
          </div>

          {/* Schools list */}
          {data.schools.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-luxury-black)]/30 mb-2">
                מוסדות חינוך בולטים
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {data.schools.slice(0, 6).map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-[var(--color-luxury-black)]/60">
                    <School size={11} className="text-[var(--color-gold)] shrink-0" />
                    <span className="truncate">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-1.5 text-[10px] text-[var(--color-luxury-black)]/25">
            <Info size={10} className="mt-0.5 shrink-0" />
            <span>
              מחיר ממוצע הוא הערכה לפי נתוני שוק — לא מתחייבים על דיוקו.
              נתוני חינוך: משרד החינוך / data.gov.il
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
