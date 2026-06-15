"use client";
import { useState } from "react";
import { MapPin, Search } from "lucide-react";

const CITIES = ["תל אביב", "רמת גן", "גבעתיים", "רמת השרון"];

export default function Hero() {
  const [city, setCity] = useState("");

  return (
    <section className="relative h-screen flex flex-col justify-center overflow-hidden pt-16">
      {/* Background photo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=85')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

      {/* Content — right side, pushed slightly below center */}
      <div
        className="relative z-10 mt-12"
        style={{ paddingRight: "clamp(2rem, 8vw, 6rem)", paddingLeft: "clamp(2rem, 38vw, 52rem)" }}
      >
        {/* Badge */}
        <span
          className="inline-block mb-4 px-3.5 py-1 rounded-full border border-[#D4A853]/45 bg-[#D4A853]/12 text-[#e8c86a] text-[13px] backdrop-blur-sm"
          style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic" }}
        >
          נדל&quot;ן יוקרה באזורי הביקוש
        </span>

        {/* Headline */}
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

        {/* Subtitle */}
        <p className="mb-7 text-white/60" style={{ fontSize: "clamp(0.85rem, 1.2vw, 1rem)" }}>
          מנגו ריאלטי — נדל&quot;ן יוקרה עם ליווי AI אישי 24/7
        </p>

        {/* Search bar — input + button only */}
        <div
          className="flex items-center gap-2 rounded-[18px] p-2"
          style={{
            width: "clamp(260px, 30vw, 420px)",
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
            <MapPin size={14} style={{ color: "#D4A853", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="עיר, שכונה..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-transparent text-white placeholder-white/35 outline-none w-full text-sm"
            />
          </div>
          <button
            className="flex items-center gap-1.5 rounded-[12px] px-4 py-2 font-black text-sm whitespace-nowrap hover:brightness-110 transition-all shrink-0"
            style={{ background: "#D4A853", color: "#1C1C1E", fontFamily: "var(--font-heebo)" }}
          >
            <Search size={13} />
            חפש
          </button>
        </div>

        {/* Quick city links */}
        <div className="mt-3.5 flex flex-wrap gap-x-3 gap-y-1 items-center text-[11px] text-white/35">
          <span>פופולרי:</span>
          {CITIES.map((c) => (
            <button key={c} onClick={() => setCity(c)}
              className="text-white/50 hover:text-[#e8c86a] transition-colors">
              {c}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
