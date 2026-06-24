import { MapPin, Bus, School, TreePine, ShoppingBag, Users, Info } from "lucide-react";
import type { NeighborhoodData } from "@/lib/neighborhood";

const CATEGORIES = [
  { key: "transport" as const, icon: Bus,         label: "תחבורה",  bg: "bg-sky-50",      color: "text-sky-600"    },
  { key: "schools"   as const, icon: School,      label: "חינוך",   bg: "bg-amber-50",    color: "text-amber-600"  },
  { key: "lifestyle" as const, icon: TreePine,    label: "פנאי",    bg: "bg-emerald-50",  color: "text-emerald-600"},
  { key: "commerce"  as const, icon: ShoppingBag, label: "מסחר",    bg: "bg-violet-50",   color: "text-violet-600" },
  { key: "character" as const, icon: Users,       label: "קהילה",   bg: "bg-rose-50",     color: "text-rose-600"   },
] as const;

export default function NeighborhoodSection({ data }: { data: NeighborhoodData }) {
  const hasContent = data.description || CATEGORIES.some(c => data[c.key]);
  if (!hasContent) return null;

  const locationLabel = data.neighborhood
    ? `${data.neighborhood} · ${data.city}`
    : data.city;

  return (
    <section className="mt-12 pt-10 border-t border-black/8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <MapPin size={17} className="text-[var(--color-gold)]" />
        <h2 className="text-xl font-black text-[var(--color-luxury-black)]">
          {data.neighborhood ? `השכונה — ${data.neighborhood}` : `על ${data.city}`}
        </h2>
        <span className="text-xs text-[var(--color-luxury-black)]/30 mr-auto">{locationLabel}</span>
      </div>

      {/* AI marketing description */}
      {data.description && (
        <p className="text-[var(--color-luxury-black)]/65 leading-relaxed text-[0.95rem] mb-7 max-w-3xl">
          {data.description}
        </p>
      )}

      {/* 5 category cards */}
      {CATEGORIES.some(c => data[c.key]) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          {CATEGORIES.map(({ key, icon: Icon, label, bg, color }) => {
            const text = data[key];
            if (!text) return null;
            return (
              <div
                key={key}
                className={`${bg} rounded-2xl p-4 border border-black/5`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon size={13} className={color} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-luxury-black)]/40">
                    {label}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-luxury-black)]/70 leading-relaxed">
                  {text}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-1.5 text-[10px] text-[var(--color-luxury-black)]/25">
        <Info size={10} className="mt-0.5 shrink-0" />
        <span>מידע על השכונה נאסף אוטומטית על-ידי בינה מלאכותית ועשוי להשתנות. מעודכן כל 6 חודשים.</span>
      </div>
    </section>
  );
}
