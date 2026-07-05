"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "./ImageUploader";

interface UploadedImage {
  id: string;
  url: string;
  name: string;
}

interface PropertyFeatures {
  // Boolean amenities
  elevator:  boolean;
  renovated: boolean;
  aircon:    boolean;
  saferoom:  boolean;
  // Sized / counted fields
  parking:     string;   // "ללא" | "1" | "2" | "3"
  balcony_sqm: string;
  storage_sqm: string;
  garden_sqm:  string;
  // Condition & age
  condition:  string;
  year_built: string;
}

interface Agent { id: string; first_name: string; last_name: string; }

interface PropertyFormData {
  title:            string;
  slug:             string;
  price:            string;
  price_type:       "sale" | "rent";
  property_type:    string;
  status:           "active" | "draft" | "sold" | "rented";
  city:             string;
  neighborhood:     string;
  street:           string;
  rooms:            string;
  bathrooms:        string;
  area_sqm:         string;
  floor:            string;
  total_floors:     string;
  description:      string;
  features:         PropertyFeatures;
  images:           UploadedImage[];
  meta_title:       string;
  meta_description: string;
  agent_id:         string;
}

const PROPERTY_TYPES: { value: string; label: string }[] = [
  { value: "apartment",      label: "דירה" },
  { value: "roof_apt",       label: "דירת גג" },
  { value: "garden_apt",     label: "דירת גן" },
  { value: "penthouse",      label: "פנטהאוז" },
  { value: "mini_penthouse", label: "מיני פנטהאוז" },
  { value: "duplex",         label: "דופלקס" },
  { value: "cottage",        label: "קוטג'" },
  { value: "townhouse",      label: "קוטג' טורי" },
  { value: "semi_detached",  label: "דו-משפחתי" },
  { value: "house",          label: "בית פרטי / וילה" },
  { value: "unit",           label: "יחידת דיור" },
  { value: "studio",         label: "סטודיו / לופט" },
  { value: "building",       label: "בניין מגורים" },
  { value: "land",           label: "מגרש" },
  { value: "commercial",     label: "מסחרי" },
  { value: "other",          label: "אחר" },
];

const CONDITION_OPTIONS = [
  "חדש מקבלן (לא גרו בו)",
  "חדש עד 5 שנים",
  "משופץ",
  "שמור",
  "ישן",
];

const BOOLEAN_FEATURES: { key: keyof PropertyFeatures; label: string }[] = [
  { key: "elevator",  label: "מעלית" },
  { key: "renovated", label: "משופץ" },
  { key: "aircon",    label: "מיזוג אוויר" },
  { key: "saferoom",  label: "ממ\"ד" },
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[֐-׿]+/g, (m) => {
      const map: Record<string, string> = {
        "א":"a","ב":"b","ג":"g","ד":"d","ה":"h","ו":"v","ז":"z",
        "ח":"h","ט":"t","י":"y","כ":"k","ל":"l","מ":"m","נ":"n",
        "ס":"s","ע":"a","פ":"p","צ":"tz","ק":"k","ר":"r","ש":"sh","ת":"t",
        "ך":"k","ם":"m","ן":"n","ף":"p","ץ":"tz",
      };
      return m.split("").map((c) => map[c] || "").join("");
    })
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || `property-${Date.now()}`;
}

interface Props {
  initialData?: Partial<PropertyFormData> & { id?: string };
  onSubmit: (data: PropertyFormData) => Promise<{ error?: string }>;
  agents?: Agent[];
}

const emptyForm: PropertyFormData = {
  title: "", slug: "", price: "", price_type: "sale", property_type: "apartment",
  status: "active", city: "", neighborhood: "", street: "",
  rooms: "", bathrooms: "", area_sqm: "", floor: "", total_floors: "",
  description: "",
  features: {
    elevator: false, renovated: false, aircon: false, saferoom: false,
    parking: "ללא", balcony_sqm: "", storage_sqm: "", garden_sqm: "",
    condition: "", year_built: "",
  },
  images: [], meta_title: "", meta_description: "", agent_id: "",
};

export default function PropertyForm({ initialData, onSubmit, agents = [] }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<PropertyFormData>({
    ...emptyForm,
    ...initialData,
    features: { ...emptyForm.features, ...(initialData?.features as PropertyFeatures) },
    images: (initialData?.images as UploadedImage[]) || [],
  });
  const [slugManual, setSlugManual] = useState(!!initialData?.slug);
  const [error, setError] = useState<string | null>(null);

  // AI description enhancer
  const [aiPanel, setAiPanel] = useState(false);
  const [buyerType, setBuyerType] = useState("כלל הקהל");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ description: string; metaDescription: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  async function enhanceDescription() {
    setAiLoading(true);
    setAiResult(null);
    setAiError(null);
    try {
      const res = await fetch("/api/admin/enhance-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.description,
          title: form.title,
          price: form.price,
          price_type: form.price_type,
          property_type: form.property_type,
          city: form.city,
          neighborhood: form.neighborhood,
          rooms: form.rooms,
          area_sqm: form.area_sqm,
          floor: form.floor,
          features: form.features,
          buyerType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה");
      setAiResult(data);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "שגיאה בלתי צפויה");
    } finally {
      setAiLoading(false);
    }
  }

  function applyAiResult() {
    if (!aiResult) return;
    set("description", aiResult.description);
    set("meta_description", aiResult.metaDescription);
    setAiPanel(false);
    setAiResult(null);
  }

  function set<K extends keyof PropertyFormData>(key: K, value: PropertyFormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && !slugManual) {
        next.slug = generateSlug(value as string);
      }
      return next;
    });
  }

  function setFeat(key: keyof PropertyFeatures, value: boolean | string) {
    setForm((prev) => ({ ...prev, features: { ...prev.features, [key]: value } }));
  }

  function autoFillSEO() {
    const typeLabel = PROPERTY_TYPES.find(t => t.value === form.property_type)?.label ?? "נכס";
    const txLabel   = form.price_type === "rent" ? "להשכרה" : "למכירה";
    const location  = [form.neighborhood, form.city].filter(Boolean).join(", ");
    const priceStr  = form.price
      ? `${Number(form.price).toLocaleString("he-IL")} ₪`
      : "";

    const rawTitle = form.title
      ? `${form.title} | Mango Realty`
      : `${typeLabel} ${txLabel}${location ? ` ב${location}` : ""} | Mango Realty`;

    const descParts = [
      `${typeLabel} ${txLabel}${location ? ` ב${location}` : ""}`,
      form.rooms    && `${form.rooms} חדרים`,
      form.area_sqm && `${form.area_sqm} מ"ר`,
      priceStr,
      "מנגו נדל\"ן — יוקרתי.",
    ].filter(Boolean).join(" · ");

    set("meta_title",       rawTitle.slice(0, 60));
    set("meta_description", descParts.slice(0, 160));
  }

  function handleSlugChange(value: string) {
    setSlugManual(true);
    set("slug", value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await onSubmit(form);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/admin");
        router.refresh();
      }
    });
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const sectionClass = "bg-white rounded-xl border border-gray-200 p-6 space-y-4";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* ── Basic ── */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-gray-800 text-base">פרטים בסיסיים</h2>

        <div>
          <label className={labelClass}>כותרת הנכס *</label>
          <input
            type="text" className={inputClass} value={form.title} required
            onChange={(e) => set("title", e.target.value)}
            placeholder="למשל: דירת 4 חדרות ברחוב רפפורט 3, כפר סבא"
          />
        </div>

        <div>
          <label className={labelClass}>Slug (URL)</label>
          <div className="flex gap-2">
            <input
              type="text" className={inputClass} value={form.slug} dir="ltr"
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="rappaport-3-kfar-saba"
            />
            <button
              type="button"
              onClick={() => { setSlugManual(false); set("slug", generateSlug(form.title)); }}
              className="text-xs text-[#F5A623] hover:underline whitespace-nowrap"
            >
              אפס
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>מחיר (₪) *</label>
            <input
              type="number" className={inputClass} value={form.price} required
              onChange={(e) => set("price", e.target.value)} placeholder="2500000"
            />
          </div>
          <div>
            <label className={labelClass}>סוג עסקה</label>
            <select className={inputClass} value={form.price_type} onChange={(e) => set("price_type", e.target.value as "sale" | "rent")}>
              <option value="sale">מכירה</option>
              <option value="rent">השכרה</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>סוג נכס</label>
            <select className={inputClass} value={form.property_type} onChange={(e) => set("property_type", e.target.value)}>
              {PROPERTY_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>סטטוס</label>
            <select className={inputClass} value={form.status} onChange={(e) => set("status", e.target.value as PropertyFormData["status"])}>
              <option value="active">פעיל</option>
              <option value="draft">טיוטה</option>
              <option value="sold">נמכר</option>
              <option value="rented">הושכר</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>סוכן מטפל</label>
          {agents.length > 0 ? (
            <select className={inputClass} value={form.agent_id} onChange={(e) => set("agent_id", e.target.value)}>
              <option value="">— לא שויך —</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-2 border border-dashed border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-400">
              אין סוכנים במערכת —{" "}
              <a href="/admin/agents/new" className="text-[#F5A623] hover:underline">הוסף סוכן</a>
            </div>
          )}
        </div>
      </div>

      {/* ── Location ── */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-gray-800 text-base">מיקום</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>עיר *</label>
            <input type="text" className={inputClass} value={form.city} required
              onChange={(e) => set("city", e.target.value)} placeholder="כפר סבא" />
          </div>
          <div>
            <label className={labelClass}>שכונה</label>
            <input type="text" className={inputClass} value={form.neighborhood}
              onChange={(e) => set("neighborhood", e.target.value)} placeholder="מרכז העיר" />
          </div>
          <div>
            <label className={labelClass}>רחוב</label>
            <input type="text" className={inputClass} value={form.street}
              onChange={(e) => set("street", e.target.value)} placeholder="רחוב רפפורט 3" />
          </div>
        </div>
      </div>

      {/* ── Technical Details ── */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-gray-800 text-base">פרטים טכניים</h2>

        {/* Row 1: rooms / bathrooms / area */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>חדרים</label>
            <input type="number" step="0.5" className={inputClass} value={form.rooms}
              onChange={(e) => set("rooms", e.target.value)} placeholder="4" />
          </div>
          <div>
            <label className={labelClass}>חדרי רחצה</label>
            <input type="number" className={inputClass} value={form.bathrooms}
              onChange={(e) => set("bathrooms", e.target.value)} placeholder="2" />
          </div>
          <div>
            <label className={labelClass}>שטח מ"ר</label>
            <input type="number" className={inputClass} value={form.area_sqm}
              onChange={(e) => set("area_sqm", e.target.value)} placeholder="110" />
          </div>
        </div>

        {/* Row 2: floor / total floors / year */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>קומה</label>
            <input type="number" className={inputClass} value={form.floor}
              onChange={(e) => set("floor", e.target.value)} placeholder="3" />
          </div>
          <div>
            <label className={labelClass}>סה"כ קומות</label>
            <input type="number" className={inputClass} value={form.total_floors}
              onChange={(e) => set("total_floors", e.target.value)} placeholder="8" />
          </div>
          <div>
            <label className={labelClass}>שנת בנייה</label>
            <input type="number" className={inputClass} value={form.features.year_built}
              onChange={(e) => setFeat("year_built", e.target.value)}
              placeholder="2010" min="1900" max="2030" />
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className={labelClass}>מצב הנכס</label>
          <select className={inputClass} value={form.features.condition}
            onChange={(e) => setFeat("condition", e.target.value)}>
            <option value="">— לא צוין —</option>
            {CONDITION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Row 3: balcony / storage / garden / parking */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>מרפסת מ"ר</label>
            <input type="number" className={inputClass} value={form.features.balcony_sqm}
              onChange={(e) => setFeat("balcony_sqm", e.target.value)} placeholder="12" min="0" />
          </div>
          <div>
            <label className={labelClass}>מחסן מ"ר</label>
            <input type="number" className={inputClass} value={form.features.storage_sqm}
              onChange={(e) => setFeat("storage_sqm", e.target.value)} placeholder="6" min="0" />
          </div>
          <div>
            <label className={labelClass}>גינה מ"ר</label>
            <input type="number" className={inputClass} value={form.features.garden_sqm}
              onChange={(e) => setFeat("garden_sqm", e.target.value)} placeholder="50" min="0" />
          </div>
          <div>
            <label className={labelClass}>חניה</label>
            <select className={inputClass} value={form.features.parking}
              onChange={(e) => setFeat("parking", e.target.value)}>
              <option value="ללא">ללא</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Description ── */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-800 text-base">תיאור</h2>
          <button
            type="button"
            onClick={() => { setAiPanel(v => !v); setAiResult(null); setAiError(null); }}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition"
          >
            ✨ שיפור AI
          </button>
        </div>
        <textarea
          className={`${inputClass} min-h-[120px] resize-y`}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="תיאור שיווקי של הנכס..."
        />

        {/* AI Enhancement Panel */}
        {aiPanel && (
          <div className="mt-3 border border-amber-200 rounded-xl bg-amber-50/60 p-4 space-y-3">
            <p className="text-xs font-bold text-amber-800">בחר קהל יעד:</p>
            <div className="flex flex-wrap gap-2">
              {["כלל הקהל", "משקיעים", "משפחות צעירות", "זוגות מבוגרים"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setBuyerType(type)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition ${
                    buyerType === type
                      ? "bg-amber-500 border-amber-500 text-white"
                      : "bg-white border-gray-200 text-gray-600 hover:border-amber-300"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={enhanceDescription}
              disabled={aiLoading}
              className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition disabled:opacity-60"
            >
              {aiLoading ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  מנסח...
                </>
              ) : "שפר תיאור ←"}
            </button>

            {aiError && (
              <p className="text-xs text-red-600 font-medium">{aiError}</p>
            )}

            {aiResult && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-amber-800">הצעת AI:</p>
                <div className="bg-white border border-amber-200 rounded-lg p-3 text-sm text-gray-700 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {aiResult.description}
                </div>
                <p className="text-xs text-gray-500">
                  <span className="font-semibold">Meta:</span> {aiResult.metaDescription}
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={applyAiResult}
                    className="text-xs font-bold px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition"
                  >
                    ✓ אשר שינויים
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAiResult(null); setAiPanel(false); }}
                    className="text-xs font-bold px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-gray-300 transition"
                  >
                    ✗ בטל
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Amenities ── */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-gray-800 text-base">מאפיינים</h2>
        <div className="grid grid-cols-4 gap-3">
          {BOOLEAN_FEATURES.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.features[key] as boolean}
                onChange={(e) => setFeat(key, e.target.checked)}
                className="w-4 h-4 accent-[#F5A623] rounded"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Images ── */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-gray-800 text-base">תמונות</h2>
        <ImageUploader
          images={form.images}
          onChange={(imgs) => set("images", imgs)}
          propertySlug={form.slug}
        />
      </div>

      {/* ── SEO ── */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-base">SEO</h2>
          <button
            type="button"
            onClick={autoFillSEO}
            className="text-xs text-[#F5A623] hover:underline font-medium"
          >
            ✨ מלא אוטומטית
          </button>
        </div>
        <div>
          <label className={labelClass}>Meta Title</label>
          <input
            type="text" className={inputClass} value={form.meta_title} dir="auto"
            onChange={(e) => set("meta_title", e.target.value)}
            placeholder="כותרת עד 60 תווים" maxLength={60}
          />
          <p className="text-xs text-gray-400 mt-1">{form.meta_title.length}/60</p>
        </div>
        <div>
          <label className={labelClass}>Meta Description</label>
          <textarea
            className={`${inputClass} h-20 resize-none`}
            value={form.meta_description} dir="auto"
            onChange={(e) => set("meta_description", e.target.value)}
            placeholder="תיאור עד 160 תווים" maxLength={160}
          />
          <p className="text-xs text-gray-400 mt-1">{form.meta_description.length}/160</p>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-3 pb-8">
        <button
          type="submit" disabled={isPending}
          className="bg-[#F5A623] hover:bg-[#D4881A] disabled:opacity-60 text-white font-medium px-8 py-2.5 rounded-xl transition-colors"
        >
          {isPending ? "שומר..." : initialData?.id ? "עדכן נכס" : "פרסם נכס"}
        </button>
        <button
          type="button" onClick={() => router.push("/admin/properties")}
          className="text-gray-500 hover:text-gray-700 px-4 py-2.5 text-sm transition-colors"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}
