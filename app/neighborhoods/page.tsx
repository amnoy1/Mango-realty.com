import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "שכונות | Mango Realty",
  description: "גלה את השכונות המבוקשות ביותר — ניתוח שוק, תחבורה, חינוך ומסחר",
};

const FALLBACK = "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80";

export default async function NeighborhoodsPage() {
  const supabase = await createClient();

  const { data: neighborhoods } = await supabase
    .from("neighborhoods")
    .select("id, city, neighborhood, description, image_url")
    .order("city");

  return (
    <main className="min-h-screen pt-24 bg-[var(--color-cream)]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-16">

        {/* Header */}
        <div className="mb-12">
          <span className="text-[var(--color-gold)] text-xs font-bold uppercase tracking-[3px] mb-2 block">
            ניתוח שוק
          </span>
          <h1 className="text-4xl font-black text-[var(--color-luxury-black)]">שכונות מבוקשות</h1>
        </div>

        {/* Empty state */}
        {!neighborhoods?.length && (
          <p className="text-[var(--color-luxury-black)]/50 text-center py-24">אין שכונות כרגע</p>
        )}

        {/* Grid */}
        {!!neighborhoods?.length && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {neighborhoods.map((n) => (
              <Link
                key={n.id}
                href={`/neighborhoods/${n.id}`}
                className="group text-right rounded-2xl overflow-hidden cursor-pointer block"
              >
                <div className="relative h-56 rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.08)] group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.14)] transition-shadow">
                  <Image
                    src={n.image_url || FALLBACK}
                    alt={n.neighborhood}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 inset-x-0 text-center px-4">
                    <span className="text-white font-black text-xl tracking-wide drop-shadow-md">{n.city}</span>
                  </div>
                </div>

                <div className="pt-3 pb-1 px-1 text-right">
                  <h2 className="text-base font-bold text-[var(--color-luxury-black)] group-hover:text-[var(--color-gold)] transition-colors">
                    {n.neighborhood}
                  </h2>
                  {n.description && (
                    <p className="text-sm text-[var(--color-luxury-black)]/50 mt-1 line-clamp-2">
                      {n.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
