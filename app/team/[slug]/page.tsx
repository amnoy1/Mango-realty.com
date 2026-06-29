import { createClient, createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import PropertyCard, { type Property } from "@/components/ui/PropertyCard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mango-realty-com.vercel.app";
const FALLBACK_AGENT = "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80";
const FALLBACK_PROP  = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80";

function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? "972" + digits.slice(1) : digits;
  return `https://wa.me/${intl}`;
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: a } = await supabase
    .from("agents")
    .select("first_name, last_name, bio, photo_url, city")
    .eq("slug", slug)
    .single();
  if (!a) return {};

  const name        = `${a.first_name} ${a.last_name}`;
  const cityLabel   = a.city ? ` | ${a.city}` : "";
  const title       = `${name}${cityLabel} | סוכן נדל"ן | Mango Realty`;
  const description = a.bio || `${name} — סוכן נדל"ן במנגו ריאלטי${a.city ? ` המתמחה ב${a.city}` : ""}. נכסים למכירה ולהשכרה באזורי הביקוש בישראל.`;
  const image       = a.photo_url || FALLBACK_AGENT;
  const canonical   = `${SITE_URL}/team/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [{ url: image, width: 600, height: 600, alt: name }],
      locale: "he_IL",
      type: "profile",
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [image],
    },
    ...(a.city ? {
      other: {
        "geo.region":    "IL",
        "geo.placename": a.city,
      },
    } : {}),
  };
}

export async function generateStaticParams() {
  const supabase = await createAdminClient();
  const { data } = await supabase.from("agents").select("slug");
  return (data || []).map((a) => ({ slug: a.slug }));
}

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: agent } = await supabase
    .from("agents")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!agent) notFound();

  // Properties handled by this agent
  const { data: propsRaw } = await supabase
    .from("properties")
    .select("id, slug, title, price, rooms, area_sqm, city, neighborhood, images")
    .eq("agent_id", agent.id)
    .eq("status", "active")
    .order("published_at", { ascending: false })
    .limit(6);

  const properties: Property[] = (propsRaw || []).map((p) => ({
    id:           p.id,
    slug:         p.slug,
    title:        p.title,
    price:        p.price || 0,
    rooms:        p.rooms || 0,
    area:         p.area_sqm || 0,
    city:         p.city || "",
    neighborhood: p.neighborhood || "",
    image:        p.images?.[0] || FALLBACK_PROP,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": `${agent.first_name} ${agent.last_name}`,
    "description": agent.bio || undefined,
    "image": agent.photo_url || undefined,
    "url": `${SITE_URL}/team/${agent.slug}`,
    "telephone": agent.phone || undefined,
    "email": agent.email || undefined,
    ...(agent.city ? {
      "areaServed": { "@type": "City", "name": agent.city, "addressCountry": "IL" },
    } : {}),
    "worksFor": {
      "@type": "RealEstateAgent",
      "name": "Mango Realty",
      "url": SITE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-[var(--color-cream)]" dir="rtl">
        {/* Hero */}
        <div className="bg-[var(--color-luxury-black)] pt-28 pb-0 px-4">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/team"
              className="inline-flex items-center gap-2 text-white/40 hover:text-[var(--color-gold)] transition-colors text-sm mb-8"
            >
              → חזרה לצוות
            </Link>

            <div className="flex flex-col md:flex-row gap-10 items-start pb-16">
              {/* Photo */}
              <div className="relative w-40 h-40 md:w-52 md:h-52 rounded-2xl overflow-hidden shrink-0 border-2 border-[var(--color-gold)]/30">
                <Image
                  src={agent.photo_url || FALLBACK_AGENT}
                  alt={`${agent.first_name} ${agent.last_name}`}
                  fill
                  className="object-cover object-top"
                  sizes="208px"
                  priority
                />
              </div>

              {/* Info */}
              <div className="flex-1">
                <span className="text-[var(--color-gold)] text-xs font-bold uppercase tracking-[3px] mb-2 block">
                  מנגו ריאלטי{agent.city ? ` · ${agent.city}` : ""}
                </span>
                <h1 className="text-4xl font-black text-white mb-3">
                  {agent.first_name} {agent.last_name}
                </h1>
                {agent.bio && (
                  <p className="text-white/55 leading-relaxed text-base max-w-2xl mb-6">
                    {agent.bio}
                  </p>
                )}

                {/* Contact buttons */}
                <div className="flex flex-wrap gap-3">
                  {agent.phone && (
                    <a
                      href={whatsappUrl(agent.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm text-white transition"
                      style={{ background: "#25D366" }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.556 4.118 1.528 5.847L.057 23.882l6.2-1.625A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.937 0-3.743-.523-5.29-1.432l-.379-.225-3.931 1.03 1.05-3.82-.247-.392A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                      </svg>
                      וואטסאפ
                    </a>
                  )}
                  {agent.phone && (
                    <a
                      href={`tel:${agent.phone}`}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm border border-white/20 text-white hover:border-[var(--color-gold)] transition-colors"
                    >
                      {agent.phone}
                    </a>
                  )}
                  {agent.email && (
                    <a
                      href={`mailto:${agent.email}`}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
                    >
                      {agent.email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Properties */}
        {properties.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 py-16">
            <span className="text-[var(--color-gold)] text-xs font-bold uppercase tracking-[3px] mb-3 block">
              הנכסים של {agent.first_name}
            </span>
            <h2 className="text-3xl font-black text-[var(--color-luxury-black)] mb-8">
              נכסים בטיפול
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
