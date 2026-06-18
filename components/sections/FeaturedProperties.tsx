import { createClient } from "@/lib/supabase/server";
import FeaturedPropertiesGrid from "./FeaturedPropertiesGrid";
import type { Property } from "@/components/ui/PropertyCard";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80";

const MOCK_PROPERTIES: Property[] = [
  {
    id: "1",
    slug: "penthouse-tzafon-yashan",
    title: "רפפורט 3, כפר סבא",
    price: 8200000,
    rooms: 6,
    area: 220,
    city: "כפר סבא",
    neighborhood: "השכונה הירוקה",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80",
    badge: "חדש",
  },
  {
    id: "2",
    slug: "dira-5-chadarim-neve-ofer",
    title: "ביאליק 12, רמת גן",
    price: 5500000,
    rooms: 5,
    area: 148,
    city: "רמת גן",
    neighborhood: "נווה עופר",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80",
    badge: "בלעדי",
  },
  {
    id: "3",
    slug: "gan-eden-givataim",
    title: "בורוכוב 14, גבעתיים",
    price: 3800000,
    rooms: 4,
    area: 110,
    city: "גבעתיים",
    neighborhood: "בורוכוב",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80",
  },
  {
    id: "4",
    slug: "villa-breicha-ramat-hasharon",
    title: "לופבן 7, רמת השרון",
    price: 14500000,
    rooms: 8,
    area: 450,
    city: "רמת השרון",
    neighborhood: "שכונת השרון",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
    badge: "פרימיום",
  },
];

export default async function FeaturedProperties() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("properties")
    .select("id, slug, title, price, rooms, area_sqm, city, neighborhood, images, status")
    .eq("status", "active")
    .order("published_at", { ascending: false })
    .limit(6);

  const fromDB: Property[] = (data || []).map((p) => ({
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

  // Show real data when available, otherwise show mock properties
  const properties = fromDB.length > 0 ? fromDB : MOCK_PROPERTIES;

  return <FeaturedPropertiesGrid properties={properties} />;
}
