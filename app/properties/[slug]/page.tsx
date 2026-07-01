import { createClient, createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PropertyPageClient from "./PropertyPageClient";
import NeighborhoodLoader from "@/components/properties/NeighborhoodLoader";
import type { Property } from "@/components/ui/PropertyCard";

// Legacy boolean features (old schema)
const BOOL_FEATURE_LABELS: Record<string, string> = {
  elevator: "מעלית", renovated: "שיפוץ מלא", aircon: "מיזוג אוויר", saferoom: "ממ\"ד",
  // backward-compat with old boolean parking/balcony/storage/garden
  parking: "חניה", balcony: "מרפסת", storage: "מחסן", garden: "גינה",
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=85";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mango-realty-com.vercel.app";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("title, meta_title, meta_description, city, neighborhood, street, images, lat, lng, price, price_type, rooms, area_sqm")
    .eq("slug", slug)
    .single();

  if (!data) return { title: "נכס | Mango Realty" };

  const title       = data.meta_title || `${data.title} | Mango Realty`;
  const description = data.meta_description || `נכס ${data.price_type === "rent" ? "להשכרה" : "למכירה"} ב${[data.neighborhood, data.city].filter(Boolean).join(", ")} — ${data.rooms ? `${data.rooms} חדרים, ` : ""}${data.area_sqm ? `${data.area_sqm} מ"ר — ` : ""}Mango Realty`;
  const ogImage     = (data.images as string[])?.[0] || FALLBACK_IMAGE;
  const canonical   = `${SITE_URL}/properties/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [{ url: ogImage, width: 1200, height: 630, alt: data.title }],
      locale: "he_IL",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    other: {
      "geo.region":    "IL",
      "geo.placename": [data.neighborhood, data.city].filter(Boolean).join(", "),
      ...(data.lat && data.lng ? {
        "geo.position": `${data.lat};${data.lng}`,
        "ICBM":         `${data.lat}, ${data.lng}`,
      } : {}),
    },
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
export const dynamic = "force-dynamic";

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: property } = await supabase
    .from("properties")
    .select("*, agents(id, first_name, last_name, phone, photo_url, bio, slug, license_number)")
    .eq("slug", slug)
    .single();

  if (!property) notFound();

  // Boolean features → display labels
  const featuresArr: string[] = Object.entries(property.features || {})
    .filter(([, v]) => v === true)
    .map(([k]) => BOOL_FEATURE_LABELS[k] || k)
    .filter(Boolean);

  // New sized / counted fields from features JSONB
  const feat = (property.features || {}) as Record<string, unknown>;
  const condition   = (feat.condition   as string) || null;
  const year_built  = (feat.year_built  as string) || null;
  const parking     = feat.parking && feat.parking !== "ללא" ? String(feat.parking) : null;
  const balcony_sqm = feat.balcony_sqm ? String(feat.balcony_sqm) : null;
  const storage_sqm = feat.storage_sqm ? String(feat.storage_sqm) : null;
  const garden_sqm  = feat.garden_sqm  ? String(feat.garden_sqm)  : null;

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agentRaw = (property as any).agents as {
    id: string; first_name: string; last_name: string;
    phone: string | null; photo_url: string | null; bio: string | null; slug: string;
    license_number: string | null;
  } | null;

  const agent = agentRaw ? {
    id:             agentRaw.id,
    name:           `${agentRaw.first_name} ${agentRaw.last_name}`,
    phone:          agentRaw.phone          ?? null,
    photo_url:      agentRaw.photo_url      ?? null,
    bio:            agentRaw.bio            ?? null,
    slug:           agentRaw.slug,
    license_number: agentRaw.license_number ?? null,
  } : null;

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
    condition,
    year_built,
    parking,
    balcony_sqm,
    storage_sqm,
    garden_sqm,
    agent,
  };

  // ── JSON-LD structured data ──────────────────────────────────────────────────
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": property.title,
    "description": property.description || undefined,
    "url": `${SITE_URL}/properties/${property.slug}`,
    "image": images,
    "price": property.price || undefined,
    "priceCurrency": "ILS",
    "numberOfRooms": property.rooms || undefined,
    "floorSize": property.area_sqm
      ? { "@type": "QuantitativeValue", "value": property.area_sqm, "unitCode": "MTK" }
      : undefined,
    "address": {
      "@type": "PostalAddress",
      "streetAddress":   property.street      || undefined,
      "addressLocality": property.city        || undefined,
      "addressRegion":   property.neighborhood || undefined,
      "addressCountry":  "IL",
    },
    ...(property.lat && property.lng ? {
      "geo": {
        "@type":     "GeoCoordinates",
        "latitude":  property.lat,
        "longitude": property.lng,
      }
    } : {}),
    "offeredBy": {
      "@type": "RealEstateAgent",
      "name":  "Mango Realty",
      "url":   SITE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <PropertyPageClient
        property={propertyForClient}
        related={related}
        googleMapsKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ""}
        neighborhoodSection={
          <NeighborhoodLoader
            city={propertyForClient.city}
            neighborhood={propertyForClient.neighborhood}
            street={propertyForClient.street}
            lat={propertyForClient.lat}
            lng={propertyForClient.lng}
          />
        }
      />
      <Footer />
    </>
  );
}
