import { Phone, Mail, MapPin } from "lucide-react";

const NAV = ["נכסים למכירה", "נכסים להשכרה", "שכונות", "סוכן AI", "אודות"];
const CITIES = ["תל אביב", "רמת גן", "גבעתיים", "רמת השרון", "הרצליה"];

export default function Footer() {
  return (
    <footer className="bg-[var(--color-surface)] border-t border-black/8">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="text-2xl font-black text-[var(--color-luxury-black)] mb-1">
              Mango <span className="text-[var(--color-gold)]">Realty</span>
            </div>
            <p className="text-[var(--color-luxury-black)]/40 text-sm leading-relaxed max-w-xs mb-6 mt-3">
              משרד תיווך נדל&quot;ן מוביל המתמחה באזורי הביקוש. עם סוכן AI חכם, מצא את הנכס המושלם שלך.
            </p>
            <div className="space-y-2.5 text-sm text-[var(--color-luxury-black)]/40">
              <div className="flex items-center gap-2.5">
                <Phone size={13} className="text-[var(--color-gold)]" /> 03-500-0000
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={13} className="text-[var(--color-gold)]" /> info@mango-realty.com
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin size={13} className="text-[var(--color-gold)]" /> תל אביב, ישראל
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-black text-[var(--color-luxury-black)] text-sm mb-4">ניווט מהיר</h4>
            <ul className="space-y-2.5 text-sm text-[var(--color-luxury-black)]/40">
              {NAV.map((l) => (
                <li key={l}>
                  <a href="#" className="hover:text-[var(--color-gold)] transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-black text-[var(--color-luxury-black)] text-sm mb-4">ערים</h4>
            <ul className="space-y-2.5 text-sm text-[var(--color-luxury-black)]/40">
              {CITIES.map((c) => (
                <li key={c}>
                  <a href="#" className="hover:text-[var(--color-gold)] transition-colors">{c}</a>
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
