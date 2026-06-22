import Image from "next/image";
import { School, MapPin, Info, TrendingUp, Bus } from "lucide-react";
import type { NeighborhoodData } from "@/lib/neighborhood";

export default function NeighborhoodSection({ data }: { data: NeighborhoodData }) {
  const hasContent =
    data.description ||
    data.school_count > 0 ||
    data.avg_price_sqm ||
    data.socio_economic_cluster;
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
        <div className={`${data.image_url ? "md:col-span-3" : "md:col-span-5"} flex flex-col justify-between gap-5`}>
          {/* AI description */}
          {data.description && (
            <p className="text-[var(--color-luxury-black)]/65 leading-relaxed text-[0.95rem]">
              {data.description}
            </p>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap gap-4">
            {/* Avg price per sqm */}
            {data.avg_price_sqm && (
              <div className="flex-1 min-w-[130px] bg-[var(--color-gold)]/8 rounded-2xl p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-luxury-black)]/35 mb-1">
                  מחיר ממוצע למ&quot;ר
                </div>
                <div className="font-black text-xl text-[var(--color-luxury-black)]">
                  ₪{data.avg_price_sqm.toLocaleString("he-IL")}
                </div>
                {data.transactions_count && (
                  <div className="flex items-center gap-1 text-[var(--color-luxury-black)]/40 text-xs mt-1">
                    <TrendingUp size={11} />
                    {data.transactions_count} עסקאות אחרונות
                  </div>
                )}
              </div>
            )}

            {/* Socio-economic cluster */}
            {data.socio_economic_cluster && (
              <div className="flex-1 min-w-[130px] bg-violet-50 rounded-2xl p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-luxury-black)]/35 mb-1">
                  אשכול סוציו-אקונומי
                </div>
                <div className="flex items-end gap-2">
                  <span className="font-black text-xl text-[var(--color-luxury-black)]">
                    {data.socio_economic_cluster}
                  </span>
                  <span className="text-xs text-[var(--color-luxury-black)]/40 mb-0.5">מתוך 10</span>
                </div>
                <div className="mt-1.5 flex gap-0.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        i < data.socio_economic_cluster!
                          ? "bg-violet-400"
                          : "bg-[var(--color-luxury-black)]/10"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Schools count */}
            {data.school_count > 0 && (
              <div className="flex-1 min-w-[130px] bg-sky-50 rounded-2xl p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-luxury-black)]/35 mb-1">
                  מוסדות חינוך בסביבה
                </div>
                <div className="font-black text-xl text-[var(--color-luxury-black)]">
                  {data.school_count}
                </div>
                <div className="text-xs text-[var(--color-luxury-black)]/35 mt-1">
                  בתי ספר
                </div>
              </div>
            )}
          </div>

          {/* Schools list */}
          {data.schools.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-luxury-black)]/30 mb-2">
                בתי ספר בסביבה
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

          {/* Transport lines */}
          {data.transport_lines && data.transport_lines.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-luxury-black)]/30 mb-2">
                תחבורה ציבורית בסביבה
              </div>
              <div className="flex flex-wrap gap-2">
                {data.transport_lines.slice(0, 8).map((line, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-full px-3 py-1"
                  >
                    <Bus size={10} />
                    {line.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-1.5 text-[10px] text-[var(--color-luxury-black)]/25">
            <Info size={10} className="mt-0.5 shrink-0" />
            <span>
              נתוני חינוך: משרד החינוך / data.gov.il.
              {data.avg_price_sqm && " מחיר ממוצע מחושב מעסקאות אחרונות — להערכה בלבד."}
              {data.socio_economic_cluster && " אשכול סוציו-אקונומי: הלמ\"ס."}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
