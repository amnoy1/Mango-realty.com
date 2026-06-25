"use client";

import { useEffect, useState } from "react";
import NeighborhoodSection from "./NeighborhoodSection";
import type { NeighborhoodData } from "@/lib/neighborhood";

export default function NeighborhoodLoader({
  city,
  neighborhood,
  street = "",
}: {
  city: string;
  neighborhood: string;
  street?: string;
}) {
  const [data, setData]     = useState<NeighborhoodData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city) { setLoading(false); return; }
    const params = new URLSearchParams({ city, neighborhood, street });
    fetch(`/api/neighborhood?${params}`)
      .then(async r => {
        if (!r.ok) { setLoading(false); return; }
        try {
          const d = await r.json();
          if (d && d.description) setData(d);
        } catch {
          /* non-JSON response — silently skip */
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [city, neighborhood]);

  if (loading) {
    return (
      <div className="mt-12 pt-10 border-t border-black/8">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="block w-2 h-2 rounded-full bg-[var(--color-gold)] animate-ping" />
          <span className="text-base font-bold text-[var(--color-luxury-black)]">מנתח שכונה</span>
        </div>
        <div className="space-y-1.5 text-[0.85rem] text-[var(--color-luxury-black)]/40 leading-relaxed">
          <p>מנתח שכונה בעזרת בינה מלאכותית...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return <NeighborhoodSection data={data} />;
}
