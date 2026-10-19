"use client";
import { useState } from "react";
import { Search, Loader2, ShieldCheck, ArrowUpDown, Car, Package, Sun, MessageCircle } from "lucide-react";

// Public property search (property-search-spec.md, door 4). Cards come from
// /api/property-search already reduced to the public view (spec 2b): street
// with no house number, exact price, no broker. "Talk to Nir" opens WhatsApp
// to Nir's number with the card's code, so Nir knows the listing (spec 5b).

const NIR_WHATSAPP = "972545370056";

const EXAMPLES = [
  '4 חדרים בכפר סבא עד 3.2 מיליון',
  'דירת גן ברעננה',
  '5 חדרים עם ממ"ד וחניה',
];

interface Card {
  ref: string | null;
  property_type: string | null;
  city: string | null;
  neighborhood: string | null;
  street: string | null;
  rooms: number | null;
  area_sqm: number | null;
  floor: number | null;
  price: number | null;
  previous_price: number | null;
  mamad: boolean;
  elevator: boolean;
  parking: boolean;
  storage: boolean;
  balcony: boolean;
  updated: string | null;
}

interface Result {
  echo: string;
  unparsed: string | null;
  total: number;
  cards: Card[];
}

function shekels(n: number) {
  return `₪${n.toLocaleString("he-IL")}`;
}

function shortDate(d: string) {
  const date = new Date(d);
  return Number.isFinite(date.getTime()) ? `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}` : "";
}

function whatsappLink(c: Card) {
  const facts = [
    c.rooms ? `${c.rooms} חד'` : null,
    c.street ? `רחוב ${c.street}` : null,
    c.city,
  ].filter(Boolean).join(", ");
  const text = `שלום ניר, ראיתי באתר של מנגו את הנכס ${c.ref}${facts ? ` (${facts})` : ""} ואשמח לקבל תמונות`;
  return `https://wa.me/${NIR_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

function Feature({ on, icon: Icon, label }: { on: boolean; icon: typeof Car; label: string }) {
  if (!on) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[var(--color-cream)]/70 bg-white/5 rounded-full px-2.5 py-1">
      <Icon size={12} className="text-[var(--color-gold)]" />
      {label}
    </span>
  );
}

function PropertyCard({ c }: { c: Card }) {
  const title = [c.property_type, c.rooms ? `${c.rooms} חדרים` : null].filter(Boolean).join(" · ");
  const where = [c.street ? `רחוב ${c.street}` : null, c.neighborhood, c.city].filter(Boolean).join(", ");
  const specs = [
    c.area_sqm ? `${c.area_sqm} מ"ר` : null,
    c.floor != null ? (c.floor === 0 ? "קומת קרקע" : `קומה ${c.floor}`) : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="bg-[var(--color-charcoal)] border border-white/8 rounded-2xl p-5 flex flex-col gap-3 text-right">
      <div>
        <div className="text-[var(--color-cream)] font-bold text-lg leading-snug">{title || "נכס"}</div>
        {where && <div className="text-[var(--color-cream)]/60 text-sm mt-1">{where}</div>}
      </div>

      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-[var(--color-gold)] font-black text-xl">{c.price ? shekels(c.price) : "מחיר לפי פנייה"}</span>
        {c.previous_price && (
          <span className="text-[var(--color-cream)]/40 text-sm line-through">{shekels(c.previous_price)}</span>
        )}
      </div>

      {specs && <div className="text-[var(--color-cream)]/60 text-sm">{specs}</div>}

      <div className="flex flex-wrap gap-1.5">
        <Feature on={c.mamad} icon={ShieldCheck} label='ממ"ד' />
        <Feature on={c.elevator} icon={ArrowUpDown} label="מעלית" />
        <Feature on={c.parking} icon={Car} label="חניה" />
        <Feature on={c.storage} icon={Package} label="מחסן" />
        <Feature on={c.balcony} icon={Sun} label="מרפסת" />
      </div>

      {c.updated && <div className="text-[var(--color-cream)]/35 text-xs">עודכן {shortDate(c.updated)}</div>}

      {c.ref && (
        <a
          href={whatsappLink(c)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold leading-snug transition-all hover:brightness-110"
          style={{ background: "#D4A853", color: "#1C1C1E" }}
        >
          <MessageCircle size={16} className="shrink-0" />
          לתמונות ופרטים נוספים, דבר בווצאפ עם ניר מנהל מחלקת הקונים של מנגו נדל&quot;ן
        </a>
      )}
    </div>
  );
}

export default function PropertySearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function run(text: string) {
    const q = text.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/property-search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: q }),
      });
      if (res.status === 429) throw new Error("הגעתם למספר החיפושים המקסימלי לשעה. נסו שוב מאוחר יותר");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "החיפוש נכשל");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "החיפוש נכשל");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <form
        onSubmit={(e) => { e.preventDefault(); run(query); }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={300}
          placeholder='ספרו לניר מה אתם מחפשים, למשל: 4 חדרים בכפר סבא עד 3.2 מיליון עם ממ"ד'
          className="flex-1 min-w-0 bg-[var(--color-charcoal)] border border-white/10 rounded-full px-5 py-4 text-[var(--color-cream)] placeholder:text-[var(--color-cream)]/35 focus:outline-none focus:border-[var(--color-gold)]"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex items-center justify-center gap-2 font-black px-8 py-4 rounded-full transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "#D4A853", color: "#1C1C1E" }}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          חפש
        </button>
      </form>

      {!result && (
        <div className="flex flex-wrap gap-2 mt-3">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => { setQuery(ex); run(ex); }}
              className="text-xs text-[var(--color-cream)]/60 border border-white/10 rounded-full px-3 py-1.5 hover:border-[var(--color-gold)]/50 hover:text-[var(--color-cream)] transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="mt-6">
          <p className="text-sm text-[var(--color-cream)]/60 mb-4">
            {result.total > 0
              ? <><span className="text-[var(--color-cream)] font-semibold">נמצאו {result.total} נכסים</span> · {result.echo}</>
              : <>לא נמצאו נכסים שמתאימים לכל התנאים ({result.echo}). נסו להרחיב את החיפוש.</>}
            {result.unparsed && <span className="block mt-1 text-[var(--color-cream)]/40">לא נכלל בחיפוש: {result.unparsed}</span>}
          </p>
          {result.total > result.cards.length && (
            <p className="text-xs text-[var(--color-cream)]/40 mb-4">מוצגים {result.cards.length} הראשונים, מהזול ליקר. כדאי לדייק את החיפוש.</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.cards.map((c, i) => <PropertyCard key={c.ref || i} c={c} />)}
          </div>
        </div>
      )}
    </div>
  );
}
