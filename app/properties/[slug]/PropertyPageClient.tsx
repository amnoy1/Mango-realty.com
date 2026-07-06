"use client";

import React, { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bed, Bath, Square, Layers, MapPin, Phone,
  Heart, Share2, ChevronRight, ChevronLeft, Check,
  ArrowLeft, ExternalLink, Navigation, X, MessageCircle,
  Car, Wind, Package, Fence, TreePine, Shield, MoveUp, Wrench, Tag,
} from "lucide-react";
import PropertyCard, { type Property } from "@/components/ui/PropertyCard";

interface Agent {
  id: string;
  name: string;
  phone: string | null;
  photo_url: string | null;
  bio: string | null;
  slug: string;
  license_number: string | null;
}

interface PropertyData {
  slug: string;
  title: string;
  price: number;
  price_type: "sale" | "rent";
  rooms: number;
  bathrooms: number;
  area: number;
  floor: number | null;
  total_floors: number | null;
  city: string;
  neighborhood: string;
  street: string;
  lat: number | null;
  lng: number | null;
  description: string;
  features: string[];
  images: string[];
  condition:   string | null;
  year_built:  string | null;
  parking:     string | null;
  balcony_sqm: string | null;
  storage_sqm: string | null;
  garden_sqm:  string | null;
  agent:       Agent | null;
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency", currency: "ILS", maximumFractionDigits: 0,
  }).format(n);
}

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
        <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 py-3"
          style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <span className="font-black text-sm text-[var(--color-luxury-black)]">{title}</span>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/8 hover:bg-black/15 flex items-center justify-center transition">
            <X size={15} />
          </button>
        </div>
        <iframe src={src} className="w-full h-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={title} />
      </div>
    </div>
  );
}

const AGENT_FALLBACK = "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80";

function whatsappUrl(phone: string) {
  // Convert Israeli number like 050-0000000 → 972500000000
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? "972" + digits.slice(1) : digits;
  return `https://wa.me/${intl}`;
}

export default function PropertyPageClient({
  property,
  related,
  neighborhoodSection,
  googleMapsKey,
}: {
  property: PropertyData;
  related: Property[];
  neighborhoodSection?: ReactNode;
  googleMapsKey?: string;
}) {
  const [activeImg, setActiveImg] = useState(0);
  const [saved, setSaved] = useState(false);
  const [modal, setModal] = useState<"map" | "streetview" | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", phone: "", message: "" });
  const [contactSent, setContactSent] = useState(false);

  function handleContact(e: React.FormEvent) {
    e.preventDefault();
    const phone = property.agent?.phone;
    if (!phone) return;
    const msg = `שלום, ראיתי את הנכס "${property.title}" ואשמח לשמוע פרטים נוספים.\n\nשמי: ${contactForm.name}\nטלפון: ${contactForm.phone}${contactForm.message ? `\n\n${contactForm.message}` : ""}`;
    window.open(`${whatsappUrl(phone)}?text=${encodeURIComponent(msg)}`, "_blank");
    setContactSent(true);
  }

  const prev = () => setActiveImg((i) => (i - 1 + property.images.length) % property.images.length);
  const next = () => setActiveImg((i) => (i + 1) % property.images.length);

  const address = [property.street, property.city, "Israel"].filter(Boolean).join(", ");
  const mapEmbedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=17&ie=UTF8&iwloc=&output=embed`;

  // Street View — Embed API streetview mode ONLY accepts lat/lng (not address text).
  // If no coordinates, fall back to opening in a new tab.
  const streetViewEmbedSrc = (googleMapsKey && property.lat && property.lng)
    ? `https://www.google.com/maps/embed/v1/streetview?key=${googleMapsKey}&location=${property.lat},${property.lng}&radius=200&fov=80`
    : null;
  const streetViewFallbackUrl = `https://www.google.com/maps?q=${encodeURIComponent(address)}&layer=c`;

  return (
    <>
      {modal === "map" && (
        <MapModal title={`מפה — ${address}`} src={mapEmbedSrc} onClose={() => setModal(null)} />
      )}
      {modal === "streetview" && streetViewEmbedSrc && (
        <MapModal title={`Street View — ${address}`} src={streetViewEmbedSrc} onClose={() => setModal(null)} />
      )}
      {/* Contact form modal */}
      {contactOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setContactOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/8">
              <h3 className="font-black text-lg text-[var(--color-luxury-black)]">השאר פרטים</h3>
              <button onClick={() => setContactOpen(false)}
                className="w-8 h-8 rounded-full bg-black/6 hover:bg-black/12 flex items-center justify-center transition">
                <X size={15} />
              </button>
            </div>

            <div className="px-6 py-5">
              {contactSent ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <Check size={26} className="text-green-500" />
                  </div>
                  <p className="font-black text-[var(--color-luxury-black)] mb-1">נפתח WhatsApp</p>
                  <p className="text-sm text-[var(--color-luxury-black)]/50">הפרטים שלך נשלחו לסוכן</p>
                  <button onClick={() => setContactOpen(false)}
                    className="mt-5 px-6 py-2.5 rounded-xl text-sm font-bold border border-black/12 hover:border-black/25 transition">
                    סגור
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContact} className="space-y-3">
                  <div>
                    <p className="text-xs text-[var(--color-luxury-black)]/45 mb-4">
                      הנכס: <span className="font-bold text-[var(--color-luxury-black)]/70">{property.title}</span>
                    </p>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="שם מלא *"
                    value={contactForm.name}
                    onChange={(e) => setContactForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-black/12 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/30 focus:border-[var(--color-gold)] transition"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="טלפון *"
                    dir="ltr"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full border border-black/12 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/30 focus:border-[var(--color-gold)] transition"
                  />
                  <textarea
                    placeholder="הודעה (אופציונלי)"
                    value={contactForm.message}
                    onChange={(e) => setContactForm(f => ({ ...f, message: e.target.value }))}
                    rows={3}
                    className="w-full border border-black/12 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/30 focus:border-[var(--color-gold)] transition resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl font-black text-sm text-white hover:brightness-110 transition"
                    style={{ background: "#1C1C1E" }}
                  >
                    שלח פרטים בוואטסאפ
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="bg-[var(--color-cream)] min-h-screen pt-16">

        {/* Gallery */}
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

            <div className="absolute top-5 left-5 z-10 flex gap-2">
              <button onClick={() => setSaved(!saved)}
                className="w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center hover:bg-white transition">
                <Heart size={15} className={saved ? "text-red-500" : "text-[var(--color-luxury-black)]"} fill={saved ? "currentColor" : "none"} />
              </button>
              <button className="w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center hover:bg-white transition">
                <Share2 size={15} className="text-[var(--color-luxury-black)]" />
              </button>
            </div>

            <button onClick={prev}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center hover:bg-white transition shadow-md">
              <ChevronRight size={20} className="text-[var(--color-luxury-black)]" />
            </button>
            <button onClick={next}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center hover:bg-white transition shadow-md">
              <ChevronLeft size={20} className="text-[var(--color-luxury-black)]" />
            </button>

            <div className="absolute bottom-0 inset-x-0 z-10 flex items-center justify-between px-5 pb-4 pt-14"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)" }}>
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
              <div className="flex gap-2">
                <button onClick={() => setModal("map")}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/28 backdrop-blur-sm text-white text-xs font-bold px-3 py-2 rounded-lg transition border border-white/20">
                  <MapPin size={12} /> מפה
                </button>
                <button onClick={() => streetViewEmbedSrc ? setModal("streetview") : window.open(streetViewFallbackUrl, "_blank", "noopener,noreferrer")}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/28 backdrop-blur-sm text-white text-xs font-bold px-3 py-2 rounded-lg transition border border-white/20">
                  <Navigation size={12} /> Street View
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <nav className="flex items-center gap-2 text-xs text-[var(--color-luxury-black)]/35 mb-6">
            <Link href="/" className="hover:text-[var(--color-gold)] transition-colors">בית</Link>
            <ChevronRight size={11} className="rotate-180" />
            <Link href="/properties" className="hover:text-[var(--color-gold)] transition-colors">נכסים</Link>
            <ChevronRight size={11} className="rotate-180" />
            <span className="text-[var(--color-luxury-black)]/55">{property.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-7">

              <div>
                <h1 className="text-[1.85rem] font-black text-[var(--color-luxury-black)] mb-1.5 leading-tight">
                  {property.title}
                </h1>
                <div className="flex items-center gap-1.5 text-[var(--color-luxury-black)]/45 text-sm">
                  <MapPin size={13} className="text-[var(--color-gold)]" />
                  {[property.street, property.neighborhood, property.city].filter(Boolean).join(", ")}
                  <button onClick={() => setModal("map")}
                    className="mr-1 text-[var(--color-gold)] hover:underline flex items-center gap-0.5">
                    <ExternalLink size={11} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 py-5 border-y border-black/8">
                {[
                  { icon: Bed, label: "חדרים", value: property.rooms },
                  { icon: Bath, label: "אמבטיות", value: property.bathrooms || "—" },
                  { icon: Square, label: "מ\"ר", value: property.area },
                  ...(property.floor ? [{ icon: Layers, label: "קומה", value: `${property.floor}${property.total_floors ? `/${property.total_floors}` : ""}` }] : []),
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon size={16} className="text-[var(--color-gold)]" />
                    <span className="font-black text-lg text-[var(--color-luxury-black)]">{value}</span>
                    <span className="text-xs text-[var(--color-luxury-black)]/40">{label}</span>
                  </div>
                ))}
              </div>

              {property.description && (
                <div>
                  <h2 className="font-black text-[var(--color-luxury-black)] mb-3">תיאור הנכס</h2>
                  <p className="text-[var(--color-luxury-black)]/60 leading-relaxed text-sm">{property.description}</p>
                </div>
              )}

              {(() => {
                // Build all chips: boolean features + sized fields
                // Labels that have a sized version — skip boolean duplicate
                const skipIfSized = new Set([
                  ...(property.parking     ? ["חניה"]   : []),
                  ...(property.balcony_sqm ? ["מרפסת"]  : []),
                  ...(property.storage_sqm ? ["מחסן"]   : []),
                  ...(property.garden_sqm  ? ["גינה"]   : []),
                ]);
                const iconMap: Record<string, React.ElementType> = {
                  "מעלית": MoveUp, "שיפוץ מלא": Wrench, "מיזוג אוויר": Wind, "ממ\"ד": Shield,
                  "חניה": Car, "מרפסת": Fence, "מחסן": Package, "גינה": TreePine,
                };
                const chips: { icon: React.ElementType; label: string; value?: string }[] = [
                  ...property.features
                    .filter(f => !skipIfSized.has(f))
                    .map(f => ({ icon: iconMap[f] ?? Check, label: f })),
                  ...(property.parking     ? [{ icon: Car,      label: "חניה",   value: `x${property.parking}` }] : []),
                  ...(property.balcony_sqm ? [{ icon: Fence,    label: "מרפסת",  value: `${property.balcony_sqm} מ"ר` }] : []),
                  ...(property.storage_sqm ? [{ icon: Package,  label: "מחסן",   value: `${property.storage_sqm} מ"ר` }] : []),
                  ...(property.garden_sqm  ? [{ icon: TreePine, label: "גינה",   value: `${property.garden_sqm} מ"ר` }]  : []),
                  ...(property.condition   ? [{ icon: Tag,      label: property.condition }] : []),
                ];
                if (!chips.length) return null;
                return (
                  <div>
                    <h2 className="font-black text-[var(--color-luxury-black)] mb-4">יתרונות הנכס</h2>
                    <div className="flex flex-wrap gap-2">
                      {chips.map(({ icon: Icon, label, value }, i) => (
                        <div key={i}
                          className="flex items-center gap-2 border border-black/10 rounded-xl px-3.5 py-2 text-sm text-[var(--color-luxury-black)]/70 bg-white">
                          <Icon size={14} className="text-[var(--color-gold)] shrink-0" />
                          <span>{label}{value ? ` ${value}` : ""}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Location + map */}
              <div>
                <h2 className="font-black text-[var(--color-luxury-black)] mb-3">מיקום</h2>
                <p className="text-sm text-[var(--color-luxury-black)]/50 mb-3">
                  {[property.street, property.neighborhood, property.city].filter(Boolean).join(", ")}
                </p>
                <div
                  className="relative rounded-2xl overflow-hidden border border-black/8 mb-3 cursor-pointer group"
                  style={{ height: 220 }}
                  onClick={() => setModal("map")}
                  title="לחץ לפתיחת המפה"
                >
                  <iframe
                    src={mapEmbedSrc}
                    className="w-full border-0 pointer-events-none absolute inset-0"
                    style={{ height: "calc(100% + 44px)" }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="מפת נכס"
                  />
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
                  <button onClick={() => streetViewEmbedSrc ? setModal("streetview") : window.open(streetViewFallbackUrl, "_blank", "noopener,noreferrer")}
                    className="flex items-center gap-2 border border-black/12 rounded-xl px-4 py-2.5 text-sm font-bold text-[var(--color-luxury-black)]/65 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition-all">
                    <Navigation size={14} /> Street View
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar — unified card */}
            <div>
              <div className="sticky top-24">
                <div className="bg-white rounded-2xl border border-black/8 shadow-[0_4px_24px_rgba(0,0,0,0.07)] overflow-hidden">

                  {/* Price */}
                  <div className="px-6 pt-6 pb-5 border-b border-black/6">
                    <div className="text-2xl font-black text-[var(--color-luxury-black)] mb-0.5">
                      {formatPrice(property.price)}
                    </div>
                    <div className="text-xs text-[var(--color-luxury-black)]/35">
                      {property.area > 0 && `${Math.round(property.price / property.area).toLocaleString("he-IL")} ₪/מ"ר`}
                      {property.price_type === "rent" && " · לחודש"}
                    </div>
                  </div>

                  {/* CTA buttons */}
                  <div className="px-5 py-5 space-y-2.5 border-b border-black/6">
                    {/* Phone — black */}
                    {property.agent?.phone ? (
                      <a href={`tel:${property.agent.phone}`}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-sm text-white hover:brightness-125 transition"
                        style={{ background: "#1C1C1E" }}>
                        <Phone size={14} /> {property.agent.phone}
                      </a>
                    ) : (
                      <a href="tel:+97235000000"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-sm text-white hover:brightness-125 transition"
                        style={{ background: "#1C1C1E" }}>
                        <Phone size={14} /> 03-500-0000
                      </a>
                    )}

                    {/* WhatsApp + contact form */}
                    <div className="grid grid-cols-2 gap-2">
                      {property.agent?.phone && (
                        <a
                          href={whatsappUrl(property.agent.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm border border-black/12 hover:border-[#25D366] hover:text-[#25D366] transition text-[var(--color-luxury-black)]"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.556 4.118 1.528 5.847L.057 23.882l6.2-1.625A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.937 0-3.743-.523-5.29-1.432l-.379-.225-3.931 1.03 1.05-3.82-.247-.392A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                          </svg>
                          וואטסאפ
                        </a>
                      )}
                      <button
                        onClick={() => { setContactSent(false); setContactOpen(true); }}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm border border-black/12 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition text-[var(--color-luxury-black)] ${!property.agent?.phone ? "col-span-2" : ""}`}
                      >
                        <MessageCircle size={14} /> השאר פרטים
                      </button>
                    </div>
                  </div>

                  {/* Agent */}
                  {property.agent && (
                    <div className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Link href={`/team/${property.agent.slug}`} className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-[var(--color-gold)]/30 hover:border-[var(--color-gold)] transition-colors">
                          <Image
                            src={property.agent.photo_url || AGENT_FALLBACK}
                            alt={property.agent.name}
                            fill
                            className="object-cover object-top"
                            sizes="56px"
                          />
                        </Link>
                        <div>
                          <Link href={`/team/${property.agent.slug}`} className="font-black text-[var(--color-luxury-black)] hover:text-[var(--color-gold)] transition-colors block leading-tight">
                            {property.agent.name}
                          </Link>
                          <div className="text-xs text-[var(--color-luxury-black)]/40 mt-0.5">מנגו נדל&quot;ן</div>
                          {property.agent.license_number && (
                            <div className="text-xs text-[var(--color-luxury-black)]/35 mt-0.5">
                              רישיון {property.agent.license_number}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Neighborhood */}
          {neighborhoodSection}

          {/* Related */}
          {related.length > 0 && (
            <div className="mt-16 pt-10 border-t border-black/8">
              <div className="flex items-end justify-between mb-7">
                <h2 className="text-xl font-black text-[var(--color-luxury-black)]">נכסים דומים</h2>
                <Link href="/properties"
                  className="flex items-center gap-1.5 text-[var(--color-luxury-black)]/35 hover:text-[var(--color-gold)] transition-colors text-sm">
                  כל הנכסים <ArrowLeft size={13} />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {related.map((p) => <PropertyCard key={p.id} property={p} />)}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
