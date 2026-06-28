"use client";

import { useState } from "react";
import { MapPin, Bus, TrendingUp, ShoppingBag, GraduationCap, Info, Plus, Minus, X, ChevronDown } from "lucide-react";
import type { NeighborhoodData } from "@/lib/neighborhood";

const CATEGORIES = [
  { key: "transport"     as const, icon: Bus,           label: "תחבורה"                  },
  { key: "socioeconomic" as const, icon: TrendingUp,    label: "חתך סוציו-אקונומי"       },
  { key: "commerce"      as const, icon: ShoppingBag,   label: "תעסוקה, מסחר ובידור"    },
  { key: "schools"       as const, icon: GraduationCap, label: "חינוך"                   },
] as const;

export default function NeighborhoodSection({ data }: { data: NeighborhoodData }) {
  const [expanded, setExpanded] = useState(false);
  const [openKey, setOpenKey]   = useState<string | null>(null);

  const hasCategories = CATEGORIES.some(c => data[c.key]);
  if (!data.description && !hasCategories) return null;

  const title = data.neighborhood ? `השכונה — ${data.neighborhood}` : `על ${data.city}`;

  return (
    <section className="mt-12 pt-10 border-t border-black/8">
      {/* Collapsed header — always visible */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center justify-between w-full group mb-0"
      >
        <div className="flex items-center gap-2">
          <MapPin size={17} className="text-[var(--color-gold)]" />
          <h2 className="text-xl font-black text-[var(--color-luxury-black)]">{title}</h2>
          <span className="text-xs text-[var(--color-luxury-black)]/30 mr-2">
            {data.neighborhood ? `${data.neighborhood} · ${data.city}` : data.city}
          </span>
        </div>
        <span className="text-[var(--color-luxury-black)]/35 transition-transform duration-200" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
          <ChevronDown size={18} />
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-5">
          {/* X to close */}
          <div className="flex justify-end mb-3">
            <button
              onClick={() => { setExpanded(false); setOpenKey(null); }}
              className="flex items-center gap-1.5 text-xs text-[var(--color-luxury-black)]/40 hover:text-[var(--color-luxury-black)]/70 transition-colors"
            >
              סגור <X size={13} />
            </button>
          </div>

          {/* Summary */}
          {data.description && (
            <p className="text-[var(--color-luxury-black)]/65 leading-relaxed text-[0.95rem] mb-6 max-w-3xl">
              {data.description}
            </p>
          )}

          {/* Accordion */}
          {hasCategories && (
            <div className="divide-y divide-black/[0.06] mb-5">
              {CATEGORIES.map(({ key, icon: Icon, label }) => {
                const text = data[key];
                if (!text) return null;
                const isOpen = openKey === key;
                return (
                  <div key={key}>
                    <button
                      onClick={() => setOpenKey(isOpen ? null : key)}
                      className="flex items-center justify-between w-full py-3.5 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={14} className="text-[var(--color-gold)] shrink-0" />
                        <span className="text-sm font-semibold text-[var(--color-luxury-black)]">{label}</span>
                      </div>
                      <span className="text-[var(--color-luxury-black)]/35">
                        {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="mb-3.5 border border-black/[0.09] rounded-xl px-4 py-3.5">
                        <p className="text-sm text-[var(--color-luxury-black)]/70 leading-relaxed">{text}</p>
                      </div>
                    )}
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
        </div>
      )}
    </section>
  );
}
