"use client";

import { useState } from "react";
import { CheckCircle, ChevronDown, Home, Camera, Handshake, FileCheck } from "lucide-react";

const PROPERTY_TYPES = ["דירה", "בית פרטי", "פנטהאוס", "קרקע", "נכס מסחרי", "אחר"];

const STEPS = [
  {
    icon: Home,
    title: "שיחת ייעוץ חינמית",
    desc: "נקיים פגישה, נעריך את שווי הנכס שלכם ונגבש יחד אסטרטגיית מכירה מותאמת אישית.",
  },
  {
    icon: Camera,
    title: "שיווק מקצועי",
    desc: "צילום מקצועי, סטיילינג, פרסום ברשתות החברתיות ובאתר מנגו נדל\"ן עם חשיפה מקסימלית.",
  },
  {
    icon: Handshake,
    title: "ניהול מו\"מ",
    desc: "טיפול בכל הפניות, סינון רוכשים רציניים וניהול משא ומתן מקצועי לקבלת המחיר הטוב ביותר.",
  },
  {
    icon: FileCheck,
    title: "סגירת עסקה",
    desc: "ליווי משפטי מלא, תיאום מול עורכי דין ומסירת הנכס — עד לסיום העסקה ברוגע.",
  },
];

export default function SellPageClient() {
  const [form, setForm] = useState({
    name: "", phone: "", city: "", property_type: "", notes: "",
  });
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState("");

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError("אנא מלא שם וטלפון");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/seller-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSuccess(true);
    } catch {
      setError("שגיאה בשליחה, אנא נסה שוב");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir="rtl" className="bg-[var(--color-cream)] min-h-screen">

      {/* Hero Section */}
      <section
        className="relative h-[80vh] flex flex-col items-center justify-center text-center px-4"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1800&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/30 to-black/10" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <p
            className="text-[var(--color-gold)] text-sm font-bold tracking-widest uppercase mb-4"
            style={{ fontFamily: "var(--font-heebo)" }}
          >
            מנגו נדל&quot;ן
          </p>
          <h1
            className="font-black text-white mb-5"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.6rem)",
              lineHeight: 1.12,
              textShadow: "0 2px 24px rgba(0,0,0,0.5)",
              fontFamily: "var(--font-heebo)",
            }}
          >
            חושבים למכור?<br />
            <span style={{ color: "#e8c86a" }}>אנחנו כאן בשבילכם</span>
          </h1>
          <p className="text-white/70 mb-8 text-base leading-relaxed">
            ניסיון רב, שיווק מקצועי וליווי צמוד — מההחלטה ועד מסירת המפתחות
          </p>
          <a
            href="#form"
            className="inline-flex items-center gap-2 font-bold text-[var(--color-luxury-black)] px-8 py-3.5 rounded-full transition-all hover:brightness-110 active:scale-95"
            style={{ background: "#D4A853", fontFamily: "var(--font-heebo)", fontSize: "1rem" }}
          >
            השאירו פרטים
            <ChevronDown size={18} />
          </a>
        </div>
      </section>

      {/* Form Section */}
      <section id="form" className="py-20 px-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="font-black text-[var(--color-luxury-black)] mb-2"
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontFamily: "var(--font-heebo)" }}
            >
              נשמח לשמוע עליכם
            </h2>
            <p className="text-[var(--color-charcoal)]/60 text-sm">
              מלאו את הפרטים ונחזור אליכם תוך 24 שעות
            </p>
          </div>

          {success ? (
            <div className="text-center py-14">
              <CheckCircle size={56} className="mx-auto mb-4" style={{ color: "#D4A853" }} />
              <h3 className="font-black text-xl text-[var(--color-luxury-black)] mb-2"
                style={{ fontFamily: "var(--font-heebo)" }}>
                פרטיכם התקבלו!
              </h3>
              <p className="text-[var(--color-charcoal)]/60 text-sm">
                נחזור אליכם בהקדם האפשרי
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl p-8 flex flex-col gap-4"
              style={{
                background: "#fff",
                boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
                border: "1px solid rgba(212,168,83,0.18)",
              }}
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--color-luxury-black)]/60 tracking-wide">
                  שם מלא *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  placeholder="ישראל ישראלי"
                  className="rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    background: "#FAF6F0",
                    border: "1.5px solid rgba(0,0,0,0.1)",
                    fontFamily: "var(--font-assistant)",
                  }}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--color-luxury-black)]/60 tracking-wide">
                  טלפון *
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                  placeholder="05X-XXXXXXX"
                  dir="ltr"
                  className="rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    background: "#FAF6F0",
                    border: "1.5px solid rgba(0,0,0,0.1)",
                    fontFamily: "var(--font-assistant)",
                    textAlign: "right",
                  }}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--color-luxury-black)]/60 tracking-wide">
                  עיר / שכונה
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => set("city", e.target.value)}
                  placeholder="כפר סבא, רמת השרון..."
                  className="rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    background: "#FAF6F0",
                    border: "1.5px solid rgba(0,0,0,0.1)",
                    fontFamily: "var(--font-assistant)",
                  }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--color-luxury-black)]/60 tracking-wide">
                  סוג הנכס
                </label>
                <select
                  value={form.property_type}
                  onChange={e => set("property_type", e.target.value)}
                  className="rounded-xl px-4 py-3 text-sm outline-none transition-all appearance-none"
                  style={{
                    background: "#FAF6F0",
                    border: "1.5px solid rgba(0,0,0,0.1)",
                    fontFamily: "var(--font-assistant)",
                    color: form.property_type ? "var(--color-luxury-black)" : "rgba(0,0,0,0.35)",
                  }}
                >
                  <option value="">בחרו סוג נכס</option>
                  {PROPERTY_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--color-luxury-black)]/60 tracking-wide">
                  הערות (אופציונלי)
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => set("notes", e.target.value)}
                  placeholder="מה חשוב לנו לדעת?"
                  rows={3}
                  className="rounded-xl px-4 py-3 text-sm outline-none resize-none transition-all"
                  style={{
                    background: "#FAF6F0",
                    border: "1.5px solid rgba(0,0,0,0.1)",
                    fontFamily: "var(--font-assistant)",
                  }}
                />
              </div>

              {error && (
                <p className="text-red-500 text-xs text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 font-black py-3.5 rounded-xl transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
                style={{
                  background: "#D4A853",
                  color: "#1C1C1E",
                  fontFamily: "var(--font-heebo)",
                  fontSize: "1rem",
                }}
              >
                {loading ? "שולח..." : "שלחו פרטים"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-4" style={{ background: "#1C1C1E" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="font-black text-white mb-3"
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontFamily: "var(--font-heebo)" }}
            >
              איך זה עובד?
            </h2>
            <p className="text-white/40 text-sm">תהליך מכירה ברור, מקצועי ושקוף</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl p-6 flex flex-col gap-4"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.09)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "rgba(212,168,83,0.15)" }}
                    >
                      <Icon size={18} style={{ color: "#D4A853" }} />
                    </div>
                    <span
                      className="text-[#D4A853] font-black text-xs tracking-widest"
                      style={{ fontFamily: "var(--font-heebo)" }}
                    >
                      שלב {i + 1}
                    </span>
                  </div>
                  <h3
                    className="font-black text-white text-base"
                    style={{ fontFamily: "var(--font-heebo)" }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-white/45 text-xs leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
