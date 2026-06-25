"use client";

import Link from "next/link";

export default function PropertyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center"
      style={{ background: "var(--color-cream, #FFF8F0)" }}
    >
      <h1
        className="text-2xl font-black"
        style={{ color: "var(--color-luxury-black, #1C1C1E)" }}
      >
        אירעה שגיאה בטעינת הנכס
      </h1>
      <p style={{ color: "rgba(28,28,30,0.5)" }} className="text-sm max-w-sm">
        לא הצלחנו לטעון את עמוד הנכס. אפשר לנסות שוב או לחזור לרשימת הנכסים.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--color-gold, #D4A853)" }}
        >
          נסה שוב
        </button>
        <Link
          href="/properties"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold border"
          style={{ borderColor: "rgba(28,28,30,0.15)", color: "var(--color-luxury-black, #1C1C1E)" }}
        >
          חזרה לנכסים
        </Link>
      </div>
    </div>
  );
}
