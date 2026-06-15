"use client";
import { useState } from "react";
import { MapPin, Home } from "lucide-react";

const CITIES = ["תל אביב", "רמת גן", "גבעתיים", "רמת השרון", "הרצליה"];

export default function Hero() {
  const [city, setCity] = useState("");
  const [type, setType] = useState("apartment");

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
      {/* Light overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/52 via-black/16 to-black/04" />

      {/* Content block — right-aligned, pushed lower */}
      <div className="relative z-10 w-full mt-16 pr-8 md:pr-20 pl-[30%] md:pl-[42%]">
        {/* Badge */}
        <span
          className="inline-block mb-5 px-4 py-1.5 rounded-full border border-[var(--color-gold)]/45 bg-[var(--color-gold)]/14 text-[#e8c86a] text-sm backdrop-blur-sm"
          style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic" }}
        >
          נדל&quot;ן יוקרה באזורי הביקוש
        </span>

        {/* Headline — 10% smaller than before */}
        <h1
          className="font-black text-white leading-[1.1] mb-4"
          style={{
            fontSize: "clamp(2.4rem, 5.4vw, 4.05rem)",
            textShadow: "0 2px 24px rgba(0,0,0,0.35)",
          }}
        >
          מצא את הנכס<br />
          <span style={{ color: "#e8c86a" }}>שחלמת עליו</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base text-white/62 mb-8 max-w-sm">
          מנגו ריאלטי — נדל&quot;ן יוקרה עם ליווי AI אישי 24/7
        </p>

        {/* Search bar */}
        <div
          className="w-full rounded-2xl p-2.5 flex flex-col sm:flex-row gap-2.5"
          style={{
            background: "rgba(255,250,244,0.13)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(255,255,255,0.22)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          <div
            className="flex-1 flex items-center gap-2.5 rounded-xl px-4 py-2.5"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <MapPin size={15} style={{ color: "#D4A853", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="עיר, שכונה או רחוב..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-transparent text-white placeholder-white/38 outline-none w-full text-sm"
            />
          </div>

          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <Home size={14} style={{ color: "#D4A853", flexShrink: 0 }} />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-transparent text-white outline-none text-sm cursor-pointer appearance-none"
            >
              <option value="apartment" className="bg-[#2D2D2D]">דירה</option>
              <option value="house" className="bg-[#2D2D2D]">בית פרטי</option>
              <option value="commercial" className="bg-[#2D2D2D]">מסחרי</option>
              <option value="land" className="bg-[#2D2D2D]">קרקע</option>
            </select>
          </div>

          <button
            className="rounded-xl px-6 py-2.5 font-black text-sm transition-all whitespace-nowrap hover:brightness-110"
            style={{ background: "#D4A853", color: "#1C1C1E", fontFamily: "var(--font-heebo)" }}
          >
            🔍 חפש
          </button>
        </div>

        {/* Quick city links */}
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/35">
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
