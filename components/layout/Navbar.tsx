"use client";
import { useState, useEffect } from "react";
import { Menu, X, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--color-cream)]/95 backdrop-blur-md shadow-sm"
          : "bg-[var(--color-cream)]"
      } border-b border-black/8`}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo — fits inside the 64px strip */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/logo.png"
            alt="Mango Real Estate"
            width={48}
            height={48}
            className="rounded-xl"
            priority
          />
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-[var(--color-luxury-black)]/55">
          <Link href="/properties" className="hover:text-[var(--color-gold)] transition-colors">נכסים</Link>
          <Link href="/neighborhoods" className="hover:text-[var(--color-gold)] transition-colors">שכונות</Link>
          <Link href="/team" className="hover:text-[var(--color-gold)] transition-colors">הצוות</Link>
          <Link href={isHome ? "#agent" : "/#agent"} className="hover:text-[var(--color-gold)] transition-colors">סוכן AI</Link>
          <a
            href="tel:+97235000000"
            className="flex items-center gap-2 bg-[var(--color-luxury-black)] text-[var(--color-cream)] px-5 py-2 rounded-full font-bold hover:bg-[var(--color-charcoal)] transition-colors text-xs"
          >
            <Phone size={13} />
            צור קשר
          </a>
        </div>

        <button className="md:hidden p-1 text-[var(--color-luxury-black)]" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[var(--color-cream)] border-t border-black/8 px-6 py-5 flex flex-col gap-5 text-sm text-[var(--color-luxury-black)]/70">
          <Link href="/properties" onClick={() => setOpen(false)}>נכסים</Link>
          <Link href="/neighborhoods" onClick={() => setOpen(false)}>שכונות</Link>
          <Link href="/team" onClick={() => setOpen(false)}>הצוות</Link>
          <Link href={isHome ? "#agent" : "/#agent"} onClick={() => setOpen(false)}>סוכן AI</Link>
          <a href="tel:+97235000000" className="flex items-center gap-2 font-bold text-[var(--color-luxury-black)]">
            <Phone size={15} /> 03-500-0000
          </a>
        </div>
      )}
    </nav>
  );
}
