import { createClient } from "@/lib/supabase/server";
import FeaturedPropertiesGrid from "./FeaturedPropertiesGrid";
import type { Property } from "@/components/ui/PropertyCard";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80";

export default async function FeaturedProperties() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("properties")
    .select("id, slug, title, price, rooms, area_sqm, city, neighborhood, images, status")
    .eq("status", "active")
    .order("published_at", { ascending: false })
    .limit(6);

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
