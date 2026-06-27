"use client";

import { useEffect, useState } from "react";
import NeighborhoodSection from "./NeighborhoodSection";
import type { NeighborhoodData } from "@/lib/neighborhood";

export default function NeighborhoodLoader({
  city,
  neighborhood,
  street = "",
  lat,
  lng,
}: {
  city: string;
  neighborhood: string;
  street?: string;
  lat?: number | null;
  lng?: number | null;
}) {
  const [data, setData]       = useState<NeighborhoodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    if (!city) { setLoading(false); return; }

    const params = new URLSearchParams({ city, neighborhood, street });
    if (lat != null) params.set("lat", String(lat));
    if (lng != null) params.set("lng", String(lng));
    let cancelled = false;

    fetch(`/api/neighborhood?${params}`)
      .then(async (r) => {
        if (cancelled) return;
        if (!r.ok) { setError(true); setLoading(false); return; }
        try {
          const d: NeighborhoodData = await r.json();
          if (!cancelled && d?.description) setData(d);
          else if (!cancelled) setError(true);
        } catch {
          if (!cancelled) setError(true);
        }
        if (!cancelled) setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setError(true); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [city, neighborhood, street]);

  if (loading) {
    return (
      <div className="mt-12 pt-10 border-t border-black/8">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="block w-2 h-2 rounded-full bg-[var(--color-gold)] animate-ping" />
          <span className="text-base font-bold text-[var(--color-luxury-black)]">מנתח שכונה</span>
        </div>
        <p className="text-[0.85rem] text-[var(--color-luxury-black)]/40 leading-relaxed">
          מנתח שכונה בעזרת בינה מלאכותית...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-12 pt-10 border-t border-black/8">
        <p className="text-[0.85rem] text-[var(--color-luxury-black)]/40">
          ניתוח השכונה אינו זמין כרגע.
        </p>
      </div>
    );
  }

  if (!data) return null;

  return <NeighborhoodSection data={data} />;
}
