"use client";
import { useState } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Bed, Bath, Square, Layers, MapPin, Phone, MessageCircle,
  Heart, Share2, ChevronRight, Check, Bot, ArrowLeft,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PropertyCard, { type Property } from "@/components/ui/PropertyCard";

/* ─── Mock data (replace with Supabase query) ─── */
interface PropertyDetail {
  slug: string;
  title: string;
  badge?: string;
  price: number;
  price_type: "sale" | "rent";
  rooms: number;
  bathrooms: number;
  area: number;
  floor: number;
  total_floors: number;
  city: string;
  neighborhood: string;
  street: string;
  description: string;
  features: string[];
  images: string[];
}

const MOCK_PROPERTIES: PropertyDetail[] = [
  {
    slug: "penthouse-tzafon-yashan",
    title: "פנטהאוז יוקרה מדהים",
    badge: "חדש",
    price: 8200000,
    price_type: "sale",
    rooms: 6,
    bathrooms: 3,
    area: 220,
    floor: 12,
    total_floors: 12,
    city: "תל אביב",
    neighborhood: "הצפון הישן",
    street: "רחוב ארלוזורוב 45",
    description:
      "פנטהאוז ייחודי בקומה האחרונה עם נוף פנורמי לים ולעיר. הנכס כולל גג פרטי של 80 מ\"ר, מטבח מקצועי מצויד, חדר ראשי מפואר עם חדר הלבשה ואמבטיה סוויטה. גימורים ברמה הגבוהה ביותר — שיש קרארה, חלונות אלומיניום, מיזוג מרכזי ומעלית פרטית.",
    features: [
      "גג פרטי 80 מ\"ר",
      "מעלית פרטית",
      "חנייה כפולה",
      "מחסן",
      "מזגן מרכזי",
      "שיש קרארה",
      "נוף לים",
      "מטבח מקצועי",
      "חדר הלבשה",
      "ממ\"ד",
    ],
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=85",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
    ],
  },
  {
    slug: "dira-5-chadarim-neve-ofer",
    title: "דירת 5 חדרים מרווחת",
    badge: "בלעדי",
    price: 5500000,
    price_type: "sale",
    rooms: 5,
    bathrooms: 2,
    area: 148,
    floor: 4,
    total_floors: 8,
    city: "רמת גן",
    neighborhood: "נווה עופר",
    street: "רחוב ביאליק 12",
    description:
      "דירה מרווחת ומוארת בלב נווה עופר המבוקשת. הדירה עברה שיפוץ מקיף לפני שנתיים וכוללת מטבח אמריקאי, סלון גדול עם יציאה למרפסת שמש, חדר הורים עם אמבטיה ענסוויט וארבעה חדרי שינה נוספים.",
    features: [
      "מרפסת שמש",
      "חנייה",
      "מחסן",
      "מזגן מרכזי",
      "מטבח אמריקאי",
      "ממ\"ד",
      "שיפוץ מלא",
    ],
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=85",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
    ],
  },
];

/* related cards shown at bottom */
const RELATED: Property[] = [
  {
    id: "r1", title: "גן עדן בגבעתיים", price: 3800000,
    rooms: 4, area: 110, city: "גבעתיים", neighborhood: "בורוכוב",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80",
  },
  {
    id: "r2", title: "וילה פרטית עם בריכה", price: 14500000,
    rooms: 8, area: 450, city: "רמת השרון", neighborhood: "שכונת השרון",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
    badge: "פרימיום",
  },
  {
    id: "r3", title: "דירת 4 חדרים חדשה", price: 4200000,
    rooms: 4, area: 125, city: "תל אביב", neighborhood: "הצפון הישן",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
  },
];

function formatPrice(n: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency", currency: "ILS", maximumFractionDigits: 0,
  }).format(n);
}

export default function PropertyPage({ params }: { params: { slug: string } }) {
  const property = MOCK_PROPERTIES.find((p) => p.slug === params.slug)
    ?? MOCK_PROPERTIES[0]; // fallback for demo

  const [activeImg, setActiveImg] = useState(0);
  const [saved, setSaved] = useState(false);

  return (
    <>
      <Navbar />
      <main className="bg-[var(--color-cream)] min-h-screen pt-16">

        {/* ── Gallery ── */}
        <div className="max-w-7xl mx-auto px-4 pt-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[var(--color-luxury-black)]/40 mb-5">
            <Link href="/" className="hover:text-[var(--color-gold)] transition-colors">בית</Link>
            <ChevronRight size={12} className="rotate-180" />
            <Link href="/properties" className="hover:text-[var(--color-gold)] transition-colors">נכסים</Link>
            <ChevronRight size={12} className="rotate-180" />
            <span className="text-[var(--color-luxury-black)]/60">{property.title}</span>
          </nav>

          {/* Images grid */}
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px] rounded-2xl overflow-hidden">
            {/* Main image */}
            <div className="col-span-3 row-span-2 relative cursor-pointer" onClick={() => setActiveImg(0)}>
              <Image
                src={property.images[0]}
                alt={property.title}
                fill
                className="object-cover hover:brightness-95 transition"
                sizes="75vw"
                priority
              />
              {property.badge && (
                <span className="absolute top-4 right-4 bg-[var(--color-gold)] text-[var(--color-luxury-black)] text-xs font-black px-3 py-1 rounded-full">
                  {property.badge}
                </span>
              )}
            </div>
            {/* Thumbnails */}
            {property.images.slice(1, 5).map((img, i) => (
              <div key={i} className="relative cursor-pointer" onClick={() => setActiveImg(i + 1)}>
                <Image
                  src={img}
                  alt={`תמונה ${i + 2}`}
                  fill
                  className={`object-cover hover:brightness-90 transition ${activeImg === i + 1 ? "brightness-75" : ""}`}
                  sizes="25vw"
                />
                {i === 3 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">+{property.images.length - 4} תמונות</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Left column — details */}
            <div className="lg:col-span-2 space-y-8">

              {/* Title + actions */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black text-[var(--color-luxury-black)] mb-1">{property.title}</h1>
                  <div className="flex items-center gap-1.5 text-[var(--color-luxury-black)]/45 text-sm">
                    <MapPin size={13} className="text-[var(--color-gold)]" />
                    {property.street}, {property.neighborhood}, {property.city}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSaved(!saved)}
                    className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${saved ? "bg-red-50 border-red-200 text-red-500" : "border-black/10 text-[var(--color-luxury-black)]/40 hover:border-[var(--color-gold)]"}`}
                  >
                    <Heart size={15} fill={saved ? "currentColor" : "none"} />
                  </button>
                  <button className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center text-[var(--color-luxury-black)]/40 hover:border-[var(--color-gold)] transition-colors">
                    <Share2 size={15} />
                  </button>
                </div>
              </div>

              {/* Key stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { icon: Bed, label: "חדרים", value: property.rooms },
                  { icon: Bath, label: "אמבטיות", value: property.bathrooms },
                  { icon: Square, label: "מ\"ר", value: property.area },
                  { icon: Layers, label: "קומה", value: `${property.floor}/${property.total_floors}` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label}
                    className="bg-white rounded-xl p-4 text-center border border-black/6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                    <Icon size={18} className="text-[var(--color-gold)] mx-auto mb-2" />
                    <div className="text-xl font-black text-[var(--color-luxury-black)]">{value}</div>
                    <div className="text-xs text-[var(--color-luxury-black)]/40 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="bg-white rounded-2xl p-6 border border-black/6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                <h2 className="font-black text-[var(--color-luxury-black)] mb-4 text-lg">תיאור הנכס</h2>
                <p className="text-[var(--color-luxury-black)]/60 leading-relaxed text-sm">{property.description}</p>
              </div>

              {/* Features */}
              <div className="bg-white rounded-2xl p-6 border border-black/6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                <h2 className="font-black text-[var(--color-luxury-black)] mb-5 text-lg">מאפיינים ותוספות</h2>
                <div className="grid grid-cols-2 gap-3">
                  {property.features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm text-[var(--color-luxury-black)]/70">
                      <div className="w-5 h-5 rounded-full bg-[var(--color-gold)]/15 flex items-center justify-center shrink-0">
                        <Check size={11} className="text-[var(--color-gold)]" />
                      </div>
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="bg-white rounded-2xl p-6 border border-black/6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                <h2 className="font-black text-[var(--color-luxury-black)] mb-4 text-lg">מיקום</h2>
                <div className="flex items-center gap-2 text-sm text-[var(--color-luxury-black)]/55 mb-4">
                  <MapPin size={14} className="text-[var(--color-gold)]" />
                  {property.street}, {property.neighborhood}, {property.city}
                </div>
                {/* Map placeholder */}
                <div className="h-48 rounded-xl bg-[var(--color-cream)] border border-black/8 flex items-center justify-center text-[var(--color-luxury-black)]/25 text-sm">
                  מפה — בקרוב
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-5">

              {/* Price card */}
              <div className="bg-white rounded-2xl p-6 border border-black/6 shadow-[0_4px_24px_rgba(0,0,0,0.08)] sticky top-24">
                <div className="text-3xl font-black text-[var(--color-gold)] mb-1">
                  {formatPrice(property.price)}
                </div>
                <div className="text-xs text-[var(--color-luxury-black)]/35 mb-5">
                  {property.price_type === "rent" ? "לחודש" : "מחיר מכירה"} ·{" "}
                  {Math.round(property.price / property.area).toLocaleString("he-IL")} ₪/מ&quot;ר
                </div>

                {/* CTA buttons */}
                <div className="space-y-2.5">
                  <a
                    href="tel:+97235000000"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-sm transition-all hover:brightness-110"
                    style={{ background: "#1C1C1E", color: "#FFF8F0" }}
                  >
                    <Phone size={14} />
                    התקשר עכשיו
                  </a>
                  <a
                    href="https://wa.me/97235000000"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-sm transition-all hover:brightness-105"
                    style={{ background: "#25D366", color: "#fff" }}
                  >
                    <MessageCircle size={14} />
                    WhatsApp
                  </a>
                </div>

                <div className="mt-4 pt-4 border-t border-black/6 text-center">
                  <p className="text-xs text-[var(--color-luxury-black)]/35 mb-3">או שוחח עם הסוכן החכם שלנו</p>
                  <button
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-sm border-2 transition-all hover:bg-[var(--color-gold)]/8"
                    style={{ borderColor: "#D4A853", color: "#D4A853" }}
                  >
                    <Bot size={15} />
                    סוכן AI — שאל שאלה
                  </button>
                </div>

                {/* Agent */}
                <div className="mt-5 pt-4 border-t border-black/6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-gold)]/20 flex items-center justify-center text-[var(--color-gold)] font-black text-sm shrink-0">
                    מ
                  </div>
                  <div>
                    <div className="text-sm font-black text-[var(--color-luxury-black)]">מנגו ריאלטי</div>
                    <div className="text-xs text-[var(--color-luxury-black)]/40">סוכן מורשה</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Related properties ── */}
          <div className="mt-16">
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-2xl font-black text-[var(--color-luxury-black)]">נכסים דומים</h2>
              <Link href="/properties"
                className="flex items-center gap-2 text-[var(--color-luxury-black)]/35 hover:text-[var(--color-gold)] transition-colors text-sm">
                כל הנכסים <ArrowLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {RELATED.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
