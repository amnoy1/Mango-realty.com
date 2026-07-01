import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "הצוות | Mango Realty",
  description: "הכירו את צוות הסוכנים המקצועי של מנגו נדל\"ן — מומחי נדל\"ן באזורי הביקוש",
};

export const dynamic = "force-dynamic";

const FALLBACK = "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80";

// Per-agent photo crop overrides (object-position), keyed by "first_name last_name"
const PHOTO_POSITION: Record<string, string> = {
  "דור כהן": "50% 60%",
};

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: agents } = await supabase
    .from("agents")
    .select("*")
    .order("first_name");

  return (
    <>
      <main className="min-h-screen bg-[var(--color-cream)]" dir="rtl">
        {/* Hero */}
        <div className="bg-[var(--color-luxury-black)] pt-28 pb-16 px-4">
          <div className="max-w-7xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-[var(--color-gold)] transition-colors text-sm mb-8">
              → חזרה לעמוד הבית
            </Link>
            <span className="text-[var(--color-gold)] text-xs font-bold uppercase tracking-[3px] mb-3 block">
              המומחים שלנו
            </span>
            <h1 className="text-5xl font-black text-white mb-2">הצוות שלנו</h1>
            <p className="text-white/50 text-base">
              מקצוענים עם ניסיון, ידע מקומי ומחויבות לתוצאות
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          {(!agents || agents.length === 0) && (
            <div className="text-center py-24 text-[var(--color-luxury-black)]/40">
              <p className="text-xl font-bold mb-2">עדיין אין סוכנים</p>
              <p className="text-sm">חיזרו בקרוב</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {agents?.map((agent) => (
              <Link
                key={agent.id}
                href={`/team/${agent.slug}`}
                className="group bg-white rounded-2xl overflow-hidden border border-black/6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-1"
              >
                {/* Photo */}
                <div className="relative h-64 bg-gray-100">
                  <Image
                    src={agent.photo_url || FALLBACK}
                    alt={`${agent.first_name} ${agent.last_name}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    style={{ objectPosition: PHOTO_POSITION[`${agent.first_name} ${agent.last_name}`] ?? "top" }}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                {/* Info */}
                <div className="p-6">
                  <h2 className="text-xl font-black text-[var(--color-luxury-black)] mb-0.5">
                    {agent.first_name} {agent.last_name}
                  </h2>
                  <p className="text-xs text-[var(--color-gold)] font-semibold uppercase tracking-wider mb-3">
                    מנגו נדל"ן
                  </p>
                  {agent.bio && (
                    <p className="text-sm text-[var(--color-luxury-black)]/50 leading-relaxed line-clamp-2">
                      {agent.bio}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-4 text-xs text-[var(--color-luxury-black)]/40">
                    {agent.phone && <span>{agent.phone}</span>}
                    {agent.email && <span>{agent.email}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
