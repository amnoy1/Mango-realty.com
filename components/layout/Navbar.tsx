"use client";
import { useState, useEffect } from "react";
import { Menu, X, Phone } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--color-luxury-black)]/95 backdrop-blur-md border-b border-white/5 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="font-heebo font-black text-2xl text-[var(--color-mango)]">
          Mango Realty
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-sm text-[var(--color-cream)]/70">
          <a href="#properties" className="hover:text-[var(--color-mango)] transition-colors">
            נכסים
          </a>
          <a href="#neighborhoods" className="hover:text-[var(--color-mango)] transition-colors">
            שכונות
          </a>
          <a href="#agent" className="hover:text-[var(--color-mango)] transition-colors">
            סוכן AI
          </a>
          <a
            href="tel:+97235000000"
            className="flex items-center gap-2 bg-[var(--color-mango)] text-black px-5 py-2 rounded-full font-bold hover:bg-[var(--color-mango-light)] transition-colors"
          >
            <Phone size={14} />
            צור קשר
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-[var(--color-cream)] p-1"
          onClick={() => setOpen(!open)}
          aria-label="תפריט"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[var(--color-charcoal)] border-t border-white/5 px-6 py-5 flex flex-col gap-5 text-[var(--color-cream)]/80">
          <a href="#properties" onClick={() => setOpen(false)}>נכסים</a>
          <a href="#neighborhoods" onClick={() => setOpen(false)}>שכונות</a>
          <a href="#agent" onClick={() => setOpen(false)}>סוכן AI</a>
          <a
            href="tel:+97235000000"
            className="flex items-center gap-2 text-[var(--color-mango)] font-bold"
          >
            <Phone size={16} /> 03-500-0000
          </a>
        </div>
      )}
    </nav>
  );
}
