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
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!city) { setLoading(false); return; }
    const params = new URLSearchParams({ city, neighborhood, street });
    fetch(`/api/neighborhood?${params}`)
      .then(r => {
        console.log("[neighborhood] status:", r.status);
        return r.json();
      })
      .then(d => {
        console.log("[neighborhood] data:", d);
        if (d) setData(d);
        else setError("API החזיר null");
      })
      .catch(e => {
        console.error("[neighborhood] fetch error:", e);
        setError(String(e));
      })
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
          <p>מנתח שכונה בעזרת בינה מלאכותית...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-12 pt-10 border-t border-black/8">
        <p className="text-sm text-red-500">שגיאה בטעינת נתוני שכונה: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return <NeighborhoodSection data={data} />;
}
