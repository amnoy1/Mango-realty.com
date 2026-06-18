import { createClient } from "@/lib/supabase/server";
import PropertyCard, { type Property } from "@/components/ui/PropertyCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80";

export const metadata = {
  title: "נכסים | Mango Realty",
  description: "כל הנכסים המובחרים של Mango Realty — דירות, וילות ובתים פרטיים למכירה",
};

export default async function PropertiesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("properties")
    .select("id, slug, title, price, rooms, area_sqm, city, neighborhood, images, status")
    .eq("status", "active")
    .order("published_at", { ascending: false });

  const properties: Property[] = (data || []).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    price: p.price || 0,
    rooms: p.rooms || 0,
    area: p.area_sqm || 0,
    city: p.city || "",
    neighborhood: p.neighborhood || "",
    image: p.images?.[0] || FALLBACK_IMAGE,
  }));

  return (
    <main className="min-h-screen bg-[var(--color-cream)]" dir="rtl">
      {/* Header */}
      <div className="bg-[var(--color-luxury-black)] pt-28 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/40 hover:text-[var(--color-gold)] transition-colors text-sm mb-8"
          >
            <ArrowRight size={14} />
            חזרה לעמוד הבית
          </Link>
          <span className="text-[var(--color-gold)] text-xs font-bold uppercase tracking-[3px] mb-3 block">
            כל הנכסים
          </span>
          <h1 className="text-5xl font-black text-white mb-2">
            נכסים מובחרים
          </h1>
          <p className="text-white/50 text-base">
            {properties.length} נכסים זמינים
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>

        {properties.length === 0 && (
          <div className="text-center py-24 text-[var(--color-luxury-black)]/40">
            <p className="text-xl font-bold mb-2">אין נכסים זמינים כרגע</p>
            <p className="text-sm">חזרו בקרוב</p>
          </div>
        )}
      </div>
    </main>
  );
}
