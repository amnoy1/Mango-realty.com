import { createClient } from "@/lib/supabase/server";
import FeaturedPropertiesGrid from "./FeaturedPropertiesGrid";
import type { Property } from "@/components/ui/PropertyCard";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80";

export default async function FeaturedProperties() {
  const supabase = await createClient();

  // First: hero-picked properties
  const { data: heroData } = await supabase
    .from("properties")
    .select("id, slug, title, price, rooms, area_sqm, city, neighborhood, images, status")
    .eq("status", "active")
    .filter("features->>hero", "eq", "true")
    .order("published_at", { ascending: false })
    .limit(3);

  // Fallback: most recent active properties (fill up to 3 if hero picks < 3)
  const heroIds = (heroData || []).map((p) => p.id);
  const needed = 3 - heroIds.length;
  let fallbackData: typeof heroData = [];
  if (needed > 0) {
    const q = supabase
      .from("properties")
      .select("id, slug, title, price, rooms, area_sqm, city, neighborhood, images, status")
      .eq("status", "active")
      .order("published_at", { ascending: false })
      .limit(needed);
    if (heroIds.length > 0) q.not("id", "in", `(${heroIds.join(",")})`);
    const { data: fb } = await q;
    fallbackData = fb || [];
  }

  const data = [...(heroData || []), ...fallbackData];

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

  return <FeaturedPropertiesGrid properties={properties} />;
}
