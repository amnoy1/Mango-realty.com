import { createClient, createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PropertyPageClient from "./PropertyPageClient";
import type { Property } from "@/components/ui/PropertyCard";

const FEATURE_LABELS: Record<string, string> = {
  parking: "חניה", balcony: "מרפסת", elevator: "מעלית", storage: "מחסן",
  renovated: "שיפוץ מלא", aircon: "מיזוג אוויר", saferoom: "ממ\"ד", garden: "גינה",
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=85";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("title, meta_title, meta_description, city")
    .eq("slug", slug)
    .single();

  if (!data) return { title: "נכס | Mango Realty" };

  return {
    title: data.meta_title || `${data.title} | Mango Realty`,
    description: data.meta_description || `נכס למכירה ב${data.city} — Mango Realty`,
  };
}

export async function generateStaticParams() {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("properties")
    .select("slug")
    .eq("status", "active");

  return (data || []).map((p) => ({ slug: p.slug }));
}

export const dynamicParams = true;

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!property) notFound();

  // Convert features JSONB → string[]
  const featuresArr: string[] = Object.entries(property.features || {})
    .filter(([, v]) => v === true)
    .map(([k]) => FEATURE_LABELS[k] || k);

  const images: string[] =
    (property.images as string[])?.length
      ? (property.images as string[])
      : [FALLBACK_IMAGE];

  // Fetch related (same city, different slug, active)
  const { data: relatedRaw } = await supabase
    .from("properties")
    .select("id, slug, title, price, rooms, area_sqm, city, neighborhood, images")
    .eq("status", "active")
    .eq("city", property.city)
    .neq("slug", slug)
    .limit(3);

  const related: Property[] = (relatedRaw || []).map((p) => ({
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

  const propertyForClient = {
    slug: property.slug,
    title: property.title,
    price: property.price || 0,
    price_type: (property.price_type || "sale") as "sale" | "rent",
    rooms: property.rooms || 0,
    bathrooms: property.bathrooms || 0,
    area: property.area_sqm || 0,
    floor: property.floor || null,
    total_floors: property.total_floors || null,
    city: property.city || "",
    neighborhood: property.neighborhood || "",
    street: property.street || "",
    lat: property.lat || null,
    lng: property.lng || null,
    description: property.description || "",
    features: featuresArr,
    images,
  };

  return (
    <>
      <Navbar />
      <PropertyPageClient
        property={propertyForClient}
        related={related}
      />
      <Footer />
    </>
  );
}
