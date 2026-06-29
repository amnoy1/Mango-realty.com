import { Phone, Mail, MapPin } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

const NAV = [
  { label: "נכסים למכירה", href: "/properties" },
  { label: "שכונות", href: "/neighborhoods" },
  { label: "הצוות", href: "/team" },
  { label: "אודות", href: "#" },
];

export default async function Footer() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("city")
    .eq("status", "active")
    .order("city");

  const cities = [...new Set((data || []).map((p) => p.city).filter(Boolean))];

  return (
    <footer className="bg-[var(--color-surface)] border-t border-black/8">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Image src="/logo.png" alt="Mango Real Estate" width={56} height={56} className="rounded-xl mb-3" />
            <p className="text-[var(--color-luxury-black)]/40 text-sm leading-relaxed max-w-xs mb-6 mt-3">
              משרד תיווך נדל&quot;ן מוביל המתמחה באזורי הביקוש. עם סוכן AI חכם, מצא את הנכס המושלם שלך.
            </p>
            <div className="space-y-2.5 text-sm text-[var(--color-luxury-black)]/40">
              <div className="flex items-center gap-2.5">
                <Phone size={13} className="text-[var(--color-gold)]" />
                <a href="tel:0525403338" className="hover:text-[var(--color-gold)] transition-colors">
                  052-5403338
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={13} className="text-[var(--color-gold)]" />
                <a href="mailto:amir@mango-realty.com" className="hover:text-[var(--color-gold)] transition-colors">
                  amir@mango-realty.com
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin size={13} className="text-[var(--color-gold)]" />
                רפפורט 3 כפר סבא, קומה 14
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-black text-[var(--color-luxury-black)] text-sm mb-4">ניווט מהיר</h4>
            <ul className="space-y-2.5 text-sm text-[var(--color-luxury-black)]/40">
              {NAV.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="hover:text-[var(--color-gold)] transition-colors">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-black text-[var(--color-luxury-black)] text-sm mb-4">ערים</h4>
            <ul className="space-y-2.5 text-sm text-[var(--color-luxury-black)]/40">
              {cities.map((city) => (
                <li key={city}>
                  <a href="/properties" className="hover:text-[var(--color-gold)] transition-colors">{city}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-black/8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[var(--color-luxury-black)]/25">
          <span>© 2025 Mango Realty. כל הזכויות שמורות.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[var(--color-luxury-black)]/50 transition-colors">תנאי שימוש</a>
            <a href="#" className="hover:text-[var(--color-luxury-black)]/50 transition-colors">מדיניות פרטיות</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
