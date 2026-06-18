"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "./ImageUploader";

interface UploadedImage {
  id: string;
  url: string;
  name: string;
}

interface PropertyFormData {
  title: string;
  slug: string;
  price: string;
  price_type: "sale" | "rent";
  property_type: "apartment" | "house" | "commercial" | "land";
  status: "active" | "draft" | "sold" | "rented";
  city: string;
  neighborhood: string;
  street: string;
  rooms: string;
  bathrooms: string;
  area_sqm: string;
  floor: string;
  total_floors: string;
  description: string;
  features: {
    parking: boolean;
    balcony: boolean;
    elevator: boolean;
    storage: boolean;
    renovated: boolean;
    aircon: boolean;
    saferoom: boolean;
    garden: boolean;
  };
  images: UploadedImage[];
  meta_title: string;
  meta_description: string;
}

const FEATURE_LABELS: Record<keyof PropertyFormData["features"], string> = {
  parking: "חניה",
  balcony: "מרפסת",
  elevator: "מעלית",
  storage: "מחסן",
  renovated: "משופץ",
  aircon: "מיזוג אוויר",
  saferoom: "ממ\"ד",
  garden: "גינה",
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[֐-׿]+/g, (m) => {
      const map: Record<string, string> = {
        "א": "a","ב": "b","ג": "g","ד": "d","ה": "h","ו": "v","ז": "z",
        "ח": "h","ט": "t","י": "y","כ": "k","ל": "l","מ": "m","נ": "n",
        "ס": "s","ע": "a","פ": "p","צ": "tz","ק": "k","ר": "r","ש": "sh","ת": "t",
        "ך": "k","ם": "m","ן": "n","ף": "p","ץ": "tz",
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
}

const emptyForm: PropertyFormData = {
  title: "", slug: "", price: "", price_type: "sale", property_type: "apartment",
  status: "active", city: "", neighborhood: "", street: "", rooms: "", bathrooms: "",
  area_sqm: "", floor: "", total_floors: "", description: "",
  features: { parking: false, balcony: false, elevator: false, storage: false,
    renovated: false, aircon: false, saferoom: false, garden: false },
  images: [], meta_title: "", meta_description: "",
};

export default function PropertyForm({ initialData, onSubmit }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<PropertyFormData>({
    ...emptyForm,
    ...initialData,
    features: { ...emptyForm.features, ...(initialData?.features as PropertyFormData["features"]) },
    images: (initialData?.images as UploadedImage[]) || [],
  });
  const [slugManual, setSlugManual] = useState(!!initialData?.slug);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof PropertyFormData>(key: K, value: PropertyFormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && !slugManual) {
        next.slug = generateSlug(value as string);
      }
      return next;
    });
  }

  function setFeature(key: keyof PropertyFormData["features"], value: boolean) {
    setForm((prev) => ({ ...prev, features: { ...prev.features, [key]: value } }));
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
        router.push("/admin/properties");
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

      {/* Basic */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-gray-800 text-base">פרטים בסיסיים</h2>

        <div>
          <label className={labelClass}>כותרת הנכס *</label>
          <input
            type="text"
            className={inputClass}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="למשל: דירת 4 חדרות ברחוב רפפורט 3, כפר סבא"
            required
          />
        </div>

        <div>
          <label className={labelClass}>Slug (URL)</label>
          <div className="flex gap-2">
            <input
              type="text"
              className={inputClass}
              value={form.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="rappaport-3-kfar-saba"
              dir="ltr"
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
              type="number"
              className={inputClass}
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="2500000"
              required
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
            <select className={inputClass} value={form.property_type} onChange={(e) => set("property_type", e.target.value as PropertyFormData["property_type"])}>
              <option value="apartment">דירה</option>
              <option value="house">בית פרטי</option>
              <option value="commercial">מסחרי</option>
              <option value="land">קרקע</option>
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
      </div>

      {/* Location */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-gray-800 text-base">מיקום</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>עיר *</label>
            <input type="text" className={inputClass} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="כפר סבא" required />
          </div>
          <div>
            <label className={labelClass}>שכונה</label>
            <input type="text" className={inputClass} value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} placeholder="מרכז העיר" />
          </div>
          <div>
            <label className={labelClass}>רחוב</label>
            <input type="text" className={inputClass} value={form.street} onChange={(e) => set("street", e.target.value)} placeholder="רחוב רפפורט 3" />
          </div>
        </div>
      </div>

      {/* Details */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-gray-800 text-base">פרטים טכניים</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>חדרים</label>
            <input type="number" step="0.5" className={inputClass} value={form.rooms} onChange={(e) => set("rooms", e.target.value)} placeholder="4" />
          </div>
          <div>
            <label className={labelClass}>חדרי רחצה</label>
            <input type="number" className={inputClass} value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} placeholder="2" />
          </div>
          <div>
            <label className={labelClass}>שטח מ"ר</label>
            <input type="number" className={inputClass} value={form.area_sqm} onChange={(e) => set("area_sqm", e.target.value)} placeholder="110" />
          </div>
          <div>
            <label className={labelClass}>קומה</label>
            <input type="number" className={inputClass} value={form.floor} onChange={(e) => set("floor", e.target.value)} placeholder="3" />
          </div>
          <div>
            <label className={labelClass}>סה"כ קומות</label>
            <input type="number" className={inputClass} value={form.total_floors} onChange={(e) => set("total_floors", e.target.value)} placeholder="8" />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-gray-800 text-base">תיאור</h2>
        <textarea
          className={`${inputClass} min-h-[120px] resize-y`}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="תיאור שיווקי של הנכס..."
        />
      </div>

      {/* Features */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-gray-800 text-base">מאפיינים</h2>
        <div className="grid grid-cols-4 gap-3">
          {(Object.keys(FEATURE_LABELS) as Array<keyof PropertyFormData["features"]>).map((key) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.features[key]}
                onChange={(e) => setFeature(key, e.target.checked)}
                className="w-4 h-4 accent-[#F5A623] rounded"
              />
              <span className="text-sm text-gray-700">{FEATURE_LABELS[key]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Images */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-gray-800 text-base">תמונות</h2>
        <ImageUploader
          images={form.images}
          onChange={(imgs) => set("images", imgs)}
          propertySlug={form.slug}
        />
      </div>

      {/* SEO */}
      <div className={sectionClass}>
        <h2 className="font-semibold text-gray-800 text-base">SEO</h2>
        <div>
          <label className={labelClass}>Meta Title</label>
          <input
            type="text"
            className={inputClass}
            value={form.meta_title}
            onChange={(e) => set("meta_title", e.target.value)}
            placeholder="כותרת עד 60 תווים"
            maxLength={60}
            dir="auto"
          />
          <p className="text-xs text-gray-400 mt-1">{form.meta_title.length}/60</p>
        </div>
        <div>
          <label className={labelClass}>Meta Description</label>
          <textarea
            className={`${inputClass} h-20 resize-none`}
            value={form.meta_description}
            onChange={(e) => set("meta_description", e.target.value)}
            placeholder="תיאור עד 160 תווים"
            maxLength={160}
            dir="auto"
          />
          <p className="text-xs text-gray-400 mt-1">{form.meta_description.length}/160</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pb-8">
        <button
          type="submit"
          disabled={isPending}
          className="bg-[#F5A623] hover:bg-[#D4881A] disabled:opacity-60 text-white font-medium px-8 py-2.5 rounded-xl transition-colors"
        >
          {isPending ? "שומר..." : initialData?.id ? "עדכן נכס" : "פרסם נכס"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/properties")}
          className="text-gray-500 hover:text-gray-700 px-4 py-2.5 text-sm transition-colors"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}
