"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, X } from "lucide-react";

interface AgentFormData {
  first_name: string;
  last_name:  string;
  phone:      string;
  email:      string;
  photo_url:  string;
  bio:        string;
}

interface Props {
  initialData?: Partial<AgentFormData> & { id?: string };
  onSubmit: (data: AgentFormData) => Promise<{ error?: string }>;
}

const empty: AgentFormData = {
  first_name: "", last_name: "", phone: "", email: "", photo_url: "", bio: "",
};

export default function AgentForm({ initialData, onSubmit }: Props) {
  const router    = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm]   = useState<AgentFormData>({ ...empty, ...initialData });
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40 focus:border-[#F5A623] transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  function set(key: keyof AgentFormData, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handlePhotoUpload(file: File) {
    setUploading(true);
    try {
      const slug = `agent-${form.first_name || "photo"}-${Date.now()}`;
      const res = await fetch("/api/admin/upload-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filenames: [file.name], slug }),
      });
      const { uploads } = await res.json();
      if (!uploads?.[0]) throw new Error("Upload failed");
      const { signedUrl, publicUrl } = uploads[0];
      await fetch(signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      set("photo_url", publicUrl);
    } catch (e) {
      setError(`שגיאת העלאה: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await onSubmit(form);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/admin/agents");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      {/* Photo */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 text-base mb-4">תמונת פרופיל</h2>
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 shrink-0 bg-gray-100">
            {form.photo_url ? (
              <>
                <Image src={form.photo_url} alt="תמונת סוכן" fill className="object-cover" sizes="80px" />
                <button
                  type="button"
                  onClick={() => set("photo_url", "")}
                  className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <X size={10} className="text-white" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl font-black">
                {form.first_name?.[0] || "?"}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePhotoUpload(f);
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 hover:border-[#F5A623] hover:text-[#F5A623] transition-colors disabled:opacity-50"
            >
              <Upload size={14} />
              {uploading ? "מעלה..." : "העלה תמונה"}
            </button>
            <p className="text-xs text-gray-400">JPG / PNG / WebP עד 5 MB</p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 text-base">פרטי הסוכן</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>שם *</label>
            <input type="text" className={inputClass} value={form.first_name} required
              onChange={(e) => set("first_name", e.target.value)} placeholder="אמיר" />
          </div>
          <div>
            <label className={labelClass}>משפחה *</label>
            <input type="text" className={inputClass} value={form.last_name} required
              onChange={(e) => set("last_name", e.target.value)} placeholder="כהן" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>טלפון</label>
            <input type="tel" className={inputClass} value={form.phone} dir="ltr"
              onChange={(e) => set("phone", e.target.value)} placeholder="050-0000000" />
          </div>
          <div>
            <label className={labelClass}>מייל</label>
            <input type="email" className={inputClass} value={form.email} dir="ltr"
              onChange={(e) => set("email", e.target.value)} placeholder="agent@mango-realty.com" />
          </div>
        </div>

        <div>
          <label className={labelClass}>אודות הסוכן</label>
          <textarea
            className={`${inputClass} min-h-[100px] resize-y`}
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="מומחה נדל&quot;ן באזורי הביקוש עם ניסיון של 10 שנים..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pb-8">
        <button
          type="submit"
          disabled={isPending || uploading}
          className="bg-[#F5A623] hover:bg-[#D4881A] disabled:opacity-60 text-white font-medium px-8 py-2.5 rounded-xl transition-colors"
        >
          {isPending ? "שומר..." : initialData?.id ? "עדכן סוכן" : "הוסף סוכן"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/agents")}
          className="text-gray-500 hover:text-gray-700 px-4 py-2.5 text-sm transition-colors"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}
