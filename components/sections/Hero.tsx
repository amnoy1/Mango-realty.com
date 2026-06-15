"use client";
import { useState } from "react";
import { MapPin, Home } from "lucide-react";

const CITIES = ["תל אביב", "רמת גן", "גבעתיים", "רמת השרון", "הרצליה"];

export default function Hero() {
  const [city, setCity] = useState("");
  const [type, setType] = useState("apartment");

  return (
    <section className="relative h-screen flex flex-col items-center justify-center overflow-visible pt-16">
      {/* Background photo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=85')",
        }}
      />
      {/* Light overlay — image stays alive */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/52 via-black/16 to-black/04" />

      {/* Text */}
      <div className="relative z-10 text-center px-4 mb-24">
        <span
          className="inline-block mb-5 px-4 py-1.5 rounded-full border border-[var(--color-gold)]/45 bg-[var(--color-gold)]/14 text-[#e8c86a] text-sm backdrop-blur-sm"
          style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic" }}
        >
          נדל&quot;ן יוקרה באזורי הביקוש
        </span>
        <h1
          className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-4"
          style={{ textShadow: "0 2px 24px rgba(0,0,0,0.35)" }}
        >
          מצא את הנכס<br />
          <span style={{ color: "#e8c86a" }}>שחלמת עליו</span>
        </h1>
        <p className="text-lg text-white/62 max-w-lg mx-auto">
          מנגו ריאלטי — נדל&quot;ן יוקרה עם ליווי AI אישי 24/7
        </p>
      </div>

      {/* Floating search bar — half in hero, half in stats */}
      <div className="absolute bottom-0 translate-y-1/2 z-20 w-full px-4 flex justify-center">
        <div
          className="w-full max-w-3xl rounded-2xl p-2.5 flex flex-col sm:flex-row gap-2.5"
          style={{
            background: "rgba(255,250,244,0.13)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(255,255,255,0.22)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          <div
            className="flex-1 flex items-center gap-2.5 rounded-xl px-4 py-3"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <MapPin size={16} style={{ color: "#D4A853", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="עיר, שכונה או רחוב..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-transparent text-white placeholder-white/38 outline-none w-full text-sm"
            />
          </div>

          <div
            className="flex items-center gap-2 rounded-xl px-4 py-3"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <Home size={15} style={{ color: "#D4A853", flexShrink: 0 }} />
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
            className="rounded-xl px-8 py-3 font-black text-sm transition-all whitespace-nowrap hover:brightness-110"
            style={{
              background: "#D4A853",
              color: "#1C1C1E",
              fontFamily: "var(--font-heebo)",
            }}
          >
            🔍 חפש נכסים
          </button>
        </div>
      </div>
    </section>
  );
}
