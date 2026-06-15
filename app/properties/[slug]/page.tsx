"use client";
import { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bed, Bath, Square, Layers, MapPin, Phone,
  Heart, Share2, ChevronRight, ChevronLeft, Check,
  ArrowLeft, ExternalLink, Navigation, X,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PropertyCard, { type Property } from "@/components/ui/PropertyCard";

/* ─── Types ─── */
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

/* ─── Mock data ─── */
const MOCK_PROPERTIES: PropertyDetail[] = [
  {
    slug: "penthouse-tzafon-yashan",
    title: "רפפורט 3, כפר סבא",
    badge: "חדש",
    price: 8200000,
    price_type: "sale",
    rooms: 6,
    bathrooms: 3,
    area: 220,
    floor: 12,
    total_floors: 12,
    city: "כפר סבא",
    neighborhood: "מרכז העיר",
    street: "רפפורט 3",
    description:
      "פנטהאוז ייחודי בקומה האחרונה עם נוף פנורמי לים ולעיר. הנכס כולל גג פרטי של 80 מ\"ר, מטבח מקצועי מצויד, חדר ראשי מפואר עם חדר הלבשה ואמבטיה סוויטה. גימורים ברמה הגבוהה ביותר — שיש קרארה, חלונות אלומיניום, מיזוג מרכזי ומעלית פרטית.",
    features: [
      "גג פרטי 80 מ\"ר", "מעלית פרטית", "חנייה כפולה", "מחסן",
      "מזגן מרכזי", "שיש קרארה", "נוף לים", "מטבח מקצועי",
      "חדר הלבשה", "ממ\"ד",
    ],
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=85",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&q=85",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1600&q=85",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=85",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=85",
    ],
  },
  {
    slug: "dira-5-chadarim-neve-ofer",
    title: "ביאליק 12, רמת גן",
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
    street: "ביאליק 12",
    description:
      "דירה מרווחת ומוארת בלב נווה עופר המבוקשת. הדירה עברה שיפוץ מקיף לפני שנתיים וכוללת מטבח אמריקאי, סלון גדול עם יציאה למרפסת שמש, חדר הורים עם אמבטיה ענסוויט וארבעה חדרי שינה נוספים.",
    features: [
      "מרפסת שמש", "חנייה", "מחסן", "מזגן מרכזי",
      "מטבח אמריקאי", "ממ\"ד", "שיפוץ מלא",
    ],
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&q=85",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=85",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=85",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1600&q=85",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=85",
    ],
  },
];

const RELATED: Property[] = [
  {
    id: "r1", slug: "gan-eden-givataim", title: "בורוכוב 14, גבעתיים", price: 3800000,
    rooms: 4, area: 110, city: "גבעתיים", neighborhood: "בורוכוב",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80",
  },
  {
    id: "r2", slug: "villa-breicha-ramat-hasharon", title: "לופבן 7, רמת השרון", price: 14500000,
    rooms: 8, area: 450, city: "רמת השרון", neighborhood: "שכונת השרון",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
    badge: "פרימיום",
  },
  {
    id: "r3", title: "הירקון 88, תל אביב", price: 4200000,
    rooms: 4, area: 125, city: "תל אביב", neighborhood: "הצפון הישן",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
  },
];

function formatPrice(n: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency", currency: "ILS", maximumFractionDigits: 0,
  }).format(n);
}

const AGENT_PHOTO = "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80";

/* ─── Popup Modal ─── */
function MapModal({ title, src, onClose }: { title: string; src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ height: "clamp(400px, 70vh, 700px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 py-3"
          style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <span className="font-black text-sm text-[var(--color-luxury-black)]">{title}</span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/8 hover:bg-black/15 flex items-center justify-center transition"
          >
            <X size={15} />
          </button>
        </div>
        {/* iframe */}
        <iframe
          src={src}
          className="w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={title}
        />
      </div>
    </div>
  );
}

export default function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const property = MOCK_PROPERTIES.find((p) => p.slug === slug) ?? MOCK_PROPERTIES[0];

  const [activeImg, setActiveImg] = useState(0);
  const [saved, setSaved] = useState(false);
  const [modal, setModal] = useState<"map" | "sv" | null>(null);

  const prev = () => setActiveImg((i) => (i - 1 + property.images.length) % property.images.length);
  const next = () => setActiveImg((i) => (i + 1) % property.images.length);

  const address = `${property.street}, ${property.city}, Israel`;
  const mapEmbedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=17&ie=UTF8&iwloc=&output=embed`;
  const svEmbedSrc  = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&layer=c&cbp=12,0,0,0,0&output=embed`;

  return (
    <>
      <Navbar />

      {/* ── Modals ── */}
      {modal === "map" && (
        <MapModal title={`מפה — ${address}`} src={mapEmbedSrc} onClose={() => setModal(null)} />
      )}
      {modal === "sv" && (
        <MapModal title={`Street View — ${address}`} src={svEmbedSrc} onClose={() => setModal(null)} />
      )}

      <main className="bg-[var(--color-cream)] min-h-screen pt-16">

        {/* ── Gallery — constrained to page container ── */}
        <div className="max-w-7xl mx-auto px-4 pt-8">
        <div className="relative w-full bg-black rounded-2xl overflow-hidden" style={{ height: "clamp(300px, 48vw, 580px)" }}>
          <Image
            src={property.images[activeImg]}
            alt={property.title}
            fill
            className="object-cover transition-opacity duration-300"
            sizes="100vw"
            priority
          />

          {/* Badge */}
          {property.badge && (
            <span className="absolute top-5 right-5 z-10 bg-[var(--color-gold)] text-[var(--color-luxury-black)] text-xs font-black px-3 py-1 rounded-full">
              {property.badge}
            </span>
          )}

          {/* Save + Share */}
          <div className="absolute top-5 left-5 z-10 flex gap-2">
            <button onClick={() => setSaved(!saved)}
              className="w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center hover:bg-white transition">
              <Heart size={15} className={saved ? "text-red-500" : "text-[var(--color-luxury-black)]"} fill={saved ? "currentColor" : "none"} />
            </button>
            <button className="w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center hover:bg-white transition">
              <Share2 size={15} className="text-[var(--color-luxury-black)]" />
            </button>
          </div>

          {/* Arrows */}
          <button onClick={prev}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center hover:bg-white transition shadow-md">
            <ChevronRight size={20} className="text-[var(--color-luxury-black)]" />
          </button>
          <button onClick={next}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center hover:bg-white transition shadow-md">
            <ChevronLeft size={20} className="text-[var(--color-luxury-black)]" />
          </button>

          {/* Bottom bar */}
          <div className="absolute bottom-0 inset-x-0 z-10 flex items-center justify-between px-5 pb-4 pt-14"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)" }}>

            {/* Thumbnails */}
            <div className="flex gap-2 items-center">
              {property.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className="relative overflow-hidden rounded-lg shrink-0"
                  style={{
                    width: 54, height: 40,
                    outline: activeImg === i ? "2px solid #D4A853" : "2px solid rgba(255,255,255,0.25)",
                    outlineOffset: 1,
                  }}>
                  <Image src={img} alt="" fill className="object-cover" sizes="60px" />
                  {activeImg !== i && <div className="absolute inset-0 bg-black/35" />}
                </button>
              ))}
              <span className="text-white/55 text-xs mr-2 select-none">
                {activeImg + 1}/{property.images.length}
              </span>
            </div>

            {/* Map / Street View popup buttons */}
            <div className="flex gap-2">
              <button onClick={() => setModal("map")}
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/28 backdrop-blur-sm text-white text-xs font-bold px-3 py-2 rounded-lg transition border border-white/20">
                <MapPin size={12} /> מפה
              </button>
              <button onClick={() => setModal("sv")}
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/28 backdrop-blur-sm text-white text-xs font-bold px-3 py-2 rounded-lg transition border border-white/20">
                <Navigation size={12} /> Street View
              </button>
            </div>
          </div>
        </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[var(--color-luxury-black)]/35 mb-6">
            <Link href="/" className="hover:text-[var(--color-gold)] transition-colors">בית</Link>
            <ChevronRight size={11} className="rotate-180" />
            <Link href="/properties" className="hover:text-[var(--color-gold)] transition-colors">נכסים</Link>
            <ChevronRight size={11} className="rotate-180" />
            <span className="text-[var(--color-luxury-black)]/55">{property.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* ── Main column ── */}
            <div className="lg:col-span-2 space-y-7">

              {/* Title */}
              <div>
                <h1 className="text-[1.85rem] font-black text-[var(--color-luxury-black)] mb-1.5 leading-tight">
                  {property.title}
                </h1>
                <div className="flex items-center gap-1.5 text-[var(--color-luxury-black)]/45 text-sm">
                  <MapPin size={13} className="text-[var(--color-gold)]" />
                  {property.street}, {property.neighborhood}, {property.city}
                  <button onClick={() => setModal("map")}
                    className="mr-1 text-[var(--color-gold)] hover:underline flex items-center gap-0.5">
                    <ExternalLink size={11} />
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-6 py-5 border-y border-black/8">
                {[
                  { icon: Bed, label: "חדרים", value: property.rooms },
                  { icon: Bath, label: "אמבטיות", value: property.bathrooms },
                  { icon: Square, label: "מ\"ר", value: property.area },
                  { icon: Layers, label: "קומה", value: `${property.floor}/${property.total_floors}` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon size={16} className="text-[var(--color-gold)]" />
                    <span className="font-black text-lg text-[var(--color-luxury-black)]">{value}</span>
                    <span className="text-xs text-[var(--color-luxury-black)]/40">{label}</span>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div>
                <h2 className="font-black text-[var(--color-luxury-black)] mb-3">תיאור הנכס</h2>
                <p className="text-[var(--color-luxury-black)]/60 leading-relaxed text-sm">{property.description}</p>
              </div>

              {/* Features */}
              <div>
                <h2 className="font-black text-[var(--color-luxury-black)] mb-4">מאפיינים</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {property.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-[var(--color-luxury-black)]/65">
                      <Check size={13} className="text-[var(--color-gold)] shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Location section + embedded map */}
              <div>
                <h2 className="font-black text-[var(--color-luxury-black)] mb-3">מיקום</h2>
                <p className="text-sm text-[var(--color-luxury-black)]/50 mb-3">
                  {property.street}, {property.neighborhood}, {property.city}
                </p>
                {/* Mini-map — click opens full popup, overlay blocks "Open in maps" button */}
                <div
                  className="relative rounded-2xl overflow-hidden border border-black/8 mb-3 cursor-pointer group"
                  style={{ height: 220 }}
                  onClick={() => setModal("map")}
                  title="לחץ לפתיחת המפה"
                >
                  {/* iframe taller than container — clips Google's "Open in Maps" link at bottom */}
                  <iframe
                    src={mapEmbedSrc}
                    className="w-full border-0 pointer-events-none absolute inset-0"
                    style={{ height: "calc(100% + 44px)" }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="מפת נכס"
                  />
                  {/* Transparent overlay — intercepts clicks, blocks iframe buttons */}
                  <div className="absolute inset-0 bg-transparent group-hover:bg-black/5 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm text-[var(--color-luxury-black)] text-xs font-bold px-3 py-1.5 rounded-full shadow">
                      פתח מפה מורחבת
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setModal("map")}
                    className="flex items-center gap-2 border border-black/12 rounded-xl px-4 py-2.5 text-sm font-bold text-[var(--color-luxury-black)]/65 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-all">
                    <MapPin size={14} /> Google Maps
                  </button>
                  <button onClick={() => setModal("sv")}
                    className="flex items-center gap-2 border border-black/12 rounded-xl px-4 py-2.5 text-sm font-bold text-[var(--color-luxury-black)]/65 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-all">
                    <Navigation size={14} /> Street View
                  </button>
                </div>
              </div>
            </div>

            {/* ── Sidebar ── */}
            <div>
              <div className="sticky top-24 space-y-4">

                {/* Price + CTA */}
                <div className="bg-white rounded-2xl p-6 border border-black/8 shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
                  <div className="text-2xl font-black text-[var(--color-luxury-black)] mb-0.5">
                    {formatPrice(property.price)}
                  </div>
                  <div className="text-xs text-[var(--color-luxury-black)]/35 mb-5">
                    {Math.round(property.price / property.area).toLocaleString("he-IL")} ₪/מ&quot;ר
                    {property.price_type === "rent" && " · לחודש"}
                  </div>
                  <div className="space-y-2.5">
                    <button className="w-full py-3 rounded-xl font-black text-sm hover:brightness-110 transition"
                      style={{ background: "#D4A853", color: "#1C1C1E" }}>
                      קבע סיור
                    </button>
                    <a href="tel:+97235000000"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-sm border border-black/12 hover:border-[var(--color-luxury-black)] transition text-[var(--color-luxury-black)]">
                      <Phone size={13} /> 03-500-0000
                    </a>
                  </div>
                </div>

                {/* Agent — איתי גל */}
                <div className="bg-white rounded-2xl p-5 border border-black/8 shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-luxury-black)]/30 mb-3">סוכן מטפל</p>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-[var(--color-gold)]/30">
                      <Image src={AGENT_PHOTO} alt="איתי גל" fill className="object-cover" sizes="56px" />
                    </div>
                    <div>
                      <div className="font-black text-[var(--color-luxury-black)]">איתי גל</div>
                      <div className="text-xs text-[var(--color-luxury-black)]/40">סוכן AI · מנגו ריאלטי</div>
                      <div className="flex gap-0.5 mt-1">
                        {[1,2,3,4,5].map(s => (
                          <svg key={s} width="10" height="10" viewBox="0 0 10 10" fill="#D4A853">
                            <path d="M5 0l1.2 3.6H10L7.1 5.8l1.1 3.4L5 7.3 1.8 9.2l1.1-3.4L0 3.6h3.8z"/>
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button className="w-full py-2.5 rounded-xl font-bold text-sm border-2 hover:bg-[var(--color-gold)]/8 transition text-[var(--color-gold)]"
                    style={{ borderColor: "#D4A853" }}>
                    💬 שוחח עם איתי גל
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* ── Related ── */}
          <div className="mt-16 pt-10 border-t border-black/8">
            <div className="flex items-end justify-between mb-7">
              <h2 className="text-xl font-black text-[var(--color-luxury-black)]">נכסים דומים</h2>
              <Link href="/properties"
                className="flex items-center gap-1.5 text-[var(--color-luxury-black)]/35 hover:text-[var(--color-gold)] transition-colors text-sm">
                כל הנכסים <ArrowLeft size={13} />
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
