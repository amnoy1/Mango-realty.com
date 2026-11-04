"use client";

import { useState, useEffect } from "react";
import { Sparkles, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { NIR_SEARCH_EVENT } from "./PropertySearch";

// Amir updates this list from time to time (currently: the Sharon area).
const CITIES = ["כפר סבא", "אלפי מנשה", "רעננה"];

// Typed one character at a time inside the empty field, to show visitors they
// can write to Nir in free language.
// Mostly Kfar Saba (~90%), a little Raanana and Alfei Menashe.
// RULE (Amir, 2026-11-04): only searches the property table can answer -
// city, neighborhood, street, rooms, property type, floor, sqm, price,
// mamad / elevator / parking / storage / balcony. Never "near schools",
// "quiet", "new building", "view" etc. A visitor who types the example
// must get real results, not a disappointment.
const TYPED_EXAMPLES = [
  '4 חדרים בכפר סבא עם ממ"ד ומרפסת, עד 3.2 מיליון',
  "5 חדרים בכפר סבא עם חניה ומחסן",
  "דירת גן בכפר סבא",
  "פנטהאוז בכפר סבא",
  "3 חדרים בכפר סבא עד 2.5 מיליון",
  "4 חדרים בכפר סבא עם מעלית וחניה",
  'דירה בכפר סבא מעל 120 מ"ר',
  "5 חדרים ומעלה בכפר סבא",
  "4 חדרים ברעננה",
  "דירה באלפי מנשה",
];

function useTypewriter(lines: string[], paused: boolean) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (paused) return;
    let line = 0, pos = 0, deleting = false;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const full = lines[line];
      if (!deleting) {
        pos++;
        setText(full.slice(0, pos));
        if (pos === full.length) { deleting = true; t = setTimeout(tick, 1800); return; }
        t = setTimeout(tick, 55 + Math.random() * 45);
      } else {
        pos--;
        setText(full.slice(0, pos));
        if (pos === 0) { deleting = false; line = (line + 1) % lines.length; t = setTimeout(tick, 400); return; }
        t = setTimeout(tick, 25);
      }
    };
    t = setTimeout(tick, 600);
    return () => clearTimeout(t);
  }, [lines, paused]);
  return text;
}

interface Slide {
  image: string;
  title: string;
  slug: string;
}

export default function HeroSlider({ slides }: { slides: Slide[] }) {
  const [city, setCity]       = useState("");
  const [current, setCurrent] = useState(0);
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const typed = useTypewriter(TYPED_EXAMPLES, focused || city.length > 0);

  function askNir(text: string) {
    const q = text.trim();
    if (!q) return;
    window.dispatchEvent(new CustomEvent(NIR_SEARCH_EVENT, { detail: q }));
  }

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      setCurrent(i => (i + 1) % slides.length);
    }, 4000);
    return () => clearInterval(id);
  }, [slides.length]);

  const bg = slides[current]?.image ?? "";

  return (
    <section className="relative h-screen flex flex-col justify-center overflow-hidden pt-16">
      {/* Background images — cross-fade */}
      {slides.map((s, i) => (
        <div
          key={s.slug}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url('${s.image}')`,
            opacity: i === current ? 1 : 0,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

      {/* Content */}
      <div
        className="relative z-10 mt-12"
        style={{ paddingRight: "clamp(2rem, 8vw, 6rem)", paddingLeft: "clamp(2rem, 38vw, 52rem)" }}
      >
        <h1
          className="font-black text-white mb-3"
          style={{
            fontSize: "clamp(2rem, 4.5vw, 3.6rem)",
            lineHeight: 1.12,
            textShadow: "0 2px 20px rgba(0,0,0,0.4)",
          }}
        >
          מצא את הנכס<br />
          <span style={{ color: "#e8c86a" }}>שחלמת עליו</span>
        </h1>

        <p className="mb-7 font-black text-white" style={{ fontSize: "clamp(0.95rem, 1.4vw, 1.15rem)", fontFamily: "var(--font-heebo)", textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
          רשמו לניר כאן למטה מה אתם מחפשים ↓
        </p>

        {/* Tabs + Search bar */}
        <div style={{ width: "clamp(260px, 30vw, 420px)" }}>

          {/* Tab row */}
          <div className="flex gap-1">
            {/* קונים — active, gold, not clickable */}
            <div
              className="px-5 py-2 text-sm font-black"
              style={{
                background: "#D4A853",
                color: "#1C1C1E",
                borderRadius: "12px 12px 0 0",
                fontFamily: "var(--font-heebo)",
              }}
            >
              קונים
            </div>
            {/* מוכרים נכס? — inactive, glass, clickable */}
            <button
              onClick={() => router.push("/sell")}
              className="px-5 py-2 text-sm font-bold transition-all hover:brightness-110"
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.75)",
                border: "1px solid rgba(255,255,255,0.22)",
                borderBottom: "none",
                borderRadius: "12px 12px 0 0",
                fontFamily: "var(--font-heebo)",
                backdropFilter: "blur(8px)",
              }}
            >
              מוכרים נכס?
            </button>
          </div>

          {/* Search bar — top-right flat (connects to קונים tab in RTL) */}
          <form
            onSubmit={(e) => { e.preventDefault(); askNir(city); }}
            className="flex items-center gap-2 p-2"
            style={{
              borderRadius: "18px 0 18px 18px",
              background: "rgba(255,250,244,0.13)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              border: "1px solid rgba(255,255,255,0.22)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
            }}
          >
          <div
            className="flex-1 flex items-center gap-2 rounded-[12px] px-3 py-2"
            style={{ background: "rgba(255,255,255,0.11)", border: "1px solid rgba(255,255,255,0.14)" }}
          >
            <Sparkles size={14} style={{ color: "#D4A853", flexShrink: 0 }} />
            <input
              type="text"
              aria-label="ספרו לניר מה אתם מחפשים"
              placeholder={focused ? "ספרו לניר מה אתם מחפשים..." : typed}
              value={city}
              maxLength={300}
              onChange={(e) => setCity(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="bg-transparent text-white placeholder-white/55 outline-none w-full text-sm"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-[12px] px-4 py-2 font-black text-sm whitespace-nowrap hover:brightness-110 transition-all shrink-0"
            style={{ background: "#D4A853", color: "#1C1C1E", fontFamily: "var(--font-heebo)" }}
          >
            <Search size={13} />
            חפש
          </button>
        </form>
        </div>{/* end tabs+searchbar wrapper */}

        {/* Quick city links */}
        <div className="mt-3.5 flex flex-wrap gap-x-3 gap-y-1 items-center text-[11px] text-white/35">
          <span>פופולרי:</span>
          {CITIES.map((c) => (
            <button key={c} onClick={() => { setCity(c); askNir(c); }}
              className="text-white/50 hover:text-[#e8c86a] transition-colors">
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Slide dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width:   i === current ? 20 : 6,
                height:  6,
                background: i === current ? "#D4A853" : "rgba(255,255,255,0.4)",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
