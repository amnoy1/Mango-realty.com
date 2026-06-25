"use client";

import { useEffect, useState } from "react";
import NeighborhoodSection from "./NeighborhoodSection";
import type { NeighborhoodData } from "@/lib/neighborhood";

export default function NeighborhoodLoader({
  city,
  neighborhood,
}: {
  city: string;
  neighborhood: string;
}) {
  const [data, setData]     = useState<NeighborhoodData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city) { setLoading(false); return; }
    const params = new URLSearchParams({ city, neighborhood });
    fetch(`/api/neighborhood?${params}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [city, neighborhood]);

  if (loading) {
    return (
      <div className="mt-12 pt-10 border-t border-black/8">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="block w-2 h-2 rounded-full bg-[var(--color-gold)] animate-ping" />
          <span className="text-base font-bold text-[var(--color-luxury-black)]">מנתח שכונה</span>
        </div>
        <div className="space-y-1.5 text-[0.85rem] text-[var(--color-luxury-black)]/40 leading-relaxed">
          <p>אוסף נתוני בתי ספר ומוסדות חינוך...</p>
          <p>מאחזר נתוני תחבורה ציבורית ודמוגרפיה...</p>
          <p>מנתח איכות חיים בשכונה בעזרת בינה מלאכותית...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return <NeighborhoodSection data={data} />;
}
