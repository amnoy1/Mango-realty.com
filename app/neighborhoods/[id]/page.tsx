import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import NeighborhoodSection from "@/components/properties/NeighborhoodSection";
import type { Metadata } from "next";
import type { NeighborhoodData } from "@/lib/neighborhood";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mango-realty-com.vercel.app";
const FALLBACK = "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("neighborhoods")
    .select("city, neighborhood, image_url")
    .eq("id", id)
    .single();
  if (!data) return {};

  const title       = `${data.neighborhood} · ${data.city} | Mango Realty`;
  const description = `מידע על שכונת ${data.neighborhood} ב${data.city} — תחבורה, חינוך, מסחר וניתוח שוק`;
  const image       = data.image_url || FALLBACK;
  const canonical   = `${SITE_URL}/neighborhoods/${id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [{ url: image, width: 1200, height: 630, alt: `${data.neighborhood}, ${data.city}` }],
      locale: "he_IL",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    other: {
      "geo.region":    "IL",
      "geo.placename": `${data.neighborhood}, ${data.city}`,
    },
  };
}

export default async function NeighborhoodPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: n }, { data: others }] = await Promise.all([
    supabase
      .from("neighborhoods")
      .select("id, city, neighborhood, description, transport, socioeconomic, commerce, schools, image_url")
      .eq("id", id)
      .single(),
    supabase
      .from("neighborhoods")
      .select("id, city, neighborhood, image_url")
      .neq("id", id)
      .limit(4),
  ]);

  if (!n) notFound();

  const neighborhoodData: NeighborhoodData = {
    city:          n.city,
    neighborhood:  n.neighborhood,
    description:   n.description,
    transport:     n.transport,
    socioeconomic: n.socioeconomic,
    commerce:      n.commerce,
    schools:       n.schools,
    image_url:     n.image_url,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    "name": `${n.neighborhood}, ${n.city}`,
    "description": n.description || undefined,
    "image": n.image_url || undefined,
    "url": `${SITE_URL}/neighborhoods/${id}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": n.city,
      "addressRegion":   n.neighborhood,
      "addressCountry":  "IL",
    },
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <main className="min-h-screen bg-[var(--color-cream)]" dir="rtl">

      {/* Hero image */}
      <div className="relative h-72 md:h-96">
        <Image
          src={n.image_url || FALLBACK}
          alt={n.neighborhood}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Back button */}
        <Link
          href="/neighborhoods"
          className="absolute top-20 right-4 flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full"
        >
          <ArrowRight size={14} />
          כל השכונות
        </Link>

        {/* Title */}
        <div className="absolute bottom-6 right-6 text-right">
          <div className="flex items-center gap-2 text-white/70 mb-1">
            <MapPin size={14} />
            <span className="text-sm">{n.city}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">{n.neighborhood}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <NeighborhoodSection data={neighborhoodData} />

        {/* Other neighborhoods */}
        {!!others?.length && (
          <div className="mt-16 pt-10 border-t border-black/8">
            <h2 className="text-xl font-black text-[var(--color-luxury-black)] mb-6">שכונות נוספות</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {others.map((o) => (
                <Link
                  key={o.id}
                  href={`/neighborhoods/${o.id}`}
                  className="group rounded-xl overflow-hidden block"
                >
                  <div className="relative h-28 rounded-xl overflow-hidden">
                    <Image
                      src={o.image_url || FALLBACK}
                      alt={o.neighborhood}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 inset-x-0 text-center px-2">
                      <span className="text-white font-bold text-xs drop-shadow">{o.neighborhood}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  </>
  );
}
