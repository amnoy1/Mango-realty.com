"use client";
import { useState } from "react";
import { Search, MapPin, Home } from "lucide-react";
import { motion } from "framer-motion";

const CITIES = ["תל אביב", "רמת גן", "גבעתיים", "רמת השרון", "הרצליה"];

export default function Hero() {
  const [city, setCity] = useState("");
  const [type, setType] = useState("apartment");

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-luxury-black)] via-[#1a1a2a] to-[var(--color-charcoal)]" />

      {/* Glow effects */}
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-[var(--color-mango)]/6 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-[var(--color-gold)]/4 blur-[80px] pointer-events-none" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--color-cream) 1px, transparent 1px), linear-gradient(90deg, var(--color-cream) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 w-full">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-[var(--color-mango)]/30 bg-[var(--color-mango)]/5 text-[var(--color-mango)] text-sm font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-mango)] animate-pulse" />
              נדל&quot;ן יוקרה באזורי הביקוש
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-[var(--color-cream)] leading-[1.1] mb-6"
          >
            מצא את הנכס
            <br />
            <span className="text-[var(--color-mango)]">שחלמת עליו</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-xl text-[var(--color-cream)]/55 mb-12 leading-relaxed"
          >
            מנגו ריאלטי — סוכן AI אישי שמכיר כל נכס, כל שכונה,
            <br className="hidden md:block" />
            ועובד בשבילך 24/7
          </motion.p>

          {/* Search box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex flex-col sm:flex-row gap-3 shadow-2xl"
          >
            {/* City input */}
            <div className="flex-1 flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3.5 border border-white/5">
              <MapPin size={17} className="text-[var(--color-mango)] shrink-0" />
              <input
                type="text"
                placeholder="עיר, שכונה או רחוב..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-transparent text-[var(--color-cream)] placeholder-white/25 outline-none w-full text-sm"
              />
            </div>

            {/* Type select */}
            <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3.5 border border-white/5">
              <Home size={17} className="text-[var(--color-mango)] shrink-0" />
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="bg-transparent text-[var(--color-cream)] outline-none text-sm cursor-pointer appearance-none"
              >
                <option value="apartment" className="bg-[#1C1C1E]">דירה</option>
                <option value="house" className="bg-[#1C1C1E]">בית פרטי</option>
                <option value="commercial" className="bg-[#1C1C1E]">מסחרי</option>
                <option value="land" className="bg-[#1C1C1E]">קרקע</option>
              </select>
            </div>

            {/* Search CTA */}
            <button className="bg-[var(--color-mango)] hover:bg-[var(--color-mango-light)] text-black font-black rounded-xl px-8 py-3.5 flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-[var(--color-mango)]/25 whitespace-nowrap">
              <Search size={18} />
              חפש נכסים
            </button>
          </motion.div>

          {/* Quick city links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-6 flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-sm"
          >
            <span className="text-[var(--color-cream)]/30">פופולרי:</span>
            {CITIES.map((c) => (
              <button
                key={c}
                onClick={() => setCity(c)}
                className="text-[var(--color-cream)]/50 hover:text-[var(--color-mango)] transition-colors"
              >
                {c}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[var(--color-cream)]/20 text-xs">גלול למטה</span>
          <div className="w-px h-8 bg-gradient-to-b from-[var(--color-mango)]/40 to-transparent animate-pulse" />
        </motion.div>
      </div>
    </section>
  );
}
