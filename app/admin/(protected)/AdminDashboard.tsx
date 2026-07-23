"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus, Pencil, Trash2, ExternalLink,
  Home, Users, ChevronLeft, Star, MapPin, Upload, ImageOff, Inbox, MessageCircle, Download, RefreshCw,
} from "lucide-react";

interface Property {
  id: string; slug: string; title: string;
  price: number; city: string; status: string; images: string[];
  features: Record<string, unknown> | null;
}
interface Agent {
  id: string; slug: string; first_name: string; last_name: string;
  phone: string | null; email: string | null; photo_url: string | null;
}
interface Neighborhood {
  id: string; city: string; neighborhood: string;
  description: string | null; transport: string | null;
  socioeconomic: string | null; commerce: string | null;
  schools: string | null; image_url: string | null;
  analysis_updated_at: string | null;
}
interface SellerLead {
  id: string; name: string; phone: string;
  city: string | null; property_type: string | null;
  notes: string | null; created_at: string;
}
interface WhatsAppProperty {
  id: string;
  property_type: string | null;
  address: string | null;
  area_sqm: number | null;
  balcony_sqm: number | null;
  rooms: number | null;
  floor: number | null;
  price: number | null;
  previous_price: number | null;
  mamad: boolean | null;
  parking: boolean | null;
  storage: boolean | null;
  elevator: boolean | null;
  broker_name: string | null;
  broker_phone: string | null;
  first_seen_date: string | null;
  last_seen_date: string | null;
  updated_at: string | null;
}

const TABS = [
  { key: "properties",   label: "נכסים",   icon: Home           },
  { key: "agents",       label: "צוות",    icon: Users          },
  { key: "neighborhoods",label: "שכונות",  icon: MapPin         },
  { key: "leads",        label: "לידים",   icon: Inbox          },
  { key: "whatsapp",     label: "וואטסאפ", icon: MessageCircle  },
] as const;
type Tab = typeof TABS[number]["key"];

const EXCEL_URL = "https://sgrphwunigmsdtbmilgd.supabase.co/storage/v1/object/public/reports/latest.xlsx";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active:  { label: "פעיל",    color: "bg-green-100 text-green-700"  },
  draft:   { label: "טיוטה",   color: "bg-gray-100 text-gray-500"    },
  sold:    { label: "נמכר",    color: "bg-blue-100 text-blue-700"    },
  rented:  { label: "הושכר",   color: "bg-purple-100 text-purple-700"},
};

const FALLBACK = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=100&q=60";
const AGENT_FALLBACK = "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=60";

export default function AdminDashboard({
  properties, agents, neighborhoods, sellerLeads, whatsAppProperties, isFullAdmin,
}: {
  properties: Property[];
  agents: Agent[];
  neighborhoods: Neighborhood[];
  sellerLeads: SellerLead[];
  whatsAppProperties: WhatsAppProperty[];
  isFullAdmin: boolean;
}) {
  const [tab, setTab] = useState<Tab>("properties");
  const [uploading, setUploading] = useState<string | null>(null);
  const [editNeighborhood, setEditNeighborhood] = useState<Neighborhood | null>(null);
  const [editForm, setEditForm] = useState({ description: "", transport: "", socioeconomic: "", commerce: "", schools: "" });
  const [savingNeighborhood, setSavingNeighborhood] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUpload = useRef<{ id: string; city: string; neighborhood: string } | null>(null);

  // WhatsApp table column widths (resizable)
  const [wpColWidths, setWpColWidths] = useState<number[]>(
    [110, 300, 65, 70, 65, 60, 120, 150, 55, 55, 55, 60, 130, 130, 110, 110]
  );

  // WhatsApp table sort
  const [wpSort, setWpSort] = useState<{ col: number; dir: "asc" | "desc" } | null>(null);

  const WP_SORT_KEYS: (keyof WhatsAppProperty)[] = [
    "property_type", "address", "area_sqm", "balcony_sqm", "rooms", "floor",
    "price", "previous_price", "mamad", "parking", "storage", "elevator",
    "broker_name", "broker_phone", "first_seen_date", "last_seen_date",
  ];

  const sortedWpProperties = wpSort === null ? whatsAppProperties : [...whatsAppProperties].sort((a, b) => {
    const key = WP_SORT_KEYS[wpSort.col];
    const aVal = a[key]; const bVal = b[key];
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    let cmp = 0;
    if (typeof aVal === "number" && typeof bVal === "number") cmp = aVal - bVal;
    else if (typeof aVal === "boolean" && typeof bVal === "boolean") cmp = (aVal ? 1 : 0) - (bVal ? 1 : 0);
    else cmp = String(aVal).localeCompare(String(bVal), "he");
    return wpSort.dir === "asc" ? cmp : -cmp;
  });

  function toggleWpSort(idx: number) {
    setWpSort(prev =>
      prev?.col === idx
        ? { col: idx, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { col: idx, dir: "asc" }
    );
  }

  function startWpColResize(e: React.MouseEvent<HTMLDivElement>, idx: number) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = wpColWidths[idx];
    const onMove = (ev: MouseEvent) => {
      // RTL: drag left → wider, drag right → narrower
      const delta = startX - ev.clientX;
      setWpColWidths(prev => {
        const next = [...prev];
        next[idx] = Math.max(40, startW + delta);
        return next;
      });
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  async function toggleHero(id: string, current: boolean) {
    await fetch(`/api/admin/properties/${id}/hero`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hero: !current }),
    });
    window.location.reload();
  }

  async function deleteProperty(id: string, title: string) {
    if (!confirm(`למחוק את "${title}"?`)) return;
    await fetch(`/api/admin/properties/${id}`, { method: "DELETE" });
    window.location.reload();
  }

  async function deleteAgent(id: string, name: string) {
    if (!confirm(`למחוק את ${name}?`)) return;
    await fetch(`/api/admin/agents/${id}`, { method: "DELETE" });
    window.location.reload();
  }

  async function deleteNeighborhood(id: string, name: string) {
    if (!confirm(`למחוק לצמיתות את שכונת "${name}"?\nהיא תוסר מהאתר ומהדאטהבייס.`)) return;
    await fetch(`/api/admin/neighborhoods/${id}`, { method: "DELETE" });
    window.location.reload();
  }

  function openEdit(n: Neighborhood) {
    setEditNeighborhood(n);
    setEditForm({
      description:   n.description   ?? "",
      transport:     n.transport     ?? "",
      socioeconomic: n.socioeconomic ?? "",
      commerce:      n.commerce      ?? "",
      schools:       n.schools       ?? "",
    });
  }

  async function saveNeighborhood() {
    if (!editNeighborhood) return;
    setSavingNeighborhood(true);
    try {
      await fetch(`/api/admin/neighborhoods/${editNeighborhood.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, analysis_updated_at: new Date().toISOString() }),
      });
      setEditNeighborhood(null);
      window.location.reload();
    } finally {
      setSavingNeighborhood(false);
    }
  }

  function triggerImageUpload(n: Neighborhood) {
    pendingUpload.current = { id: n.id, city: n.city, neighborhood: n.neighborhood };
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const meta = pendingUpload.current;
    if (!file || !meta) return;
    e.target.value = "";

    setUploading(meta.id);
    try {
      // 1. Get signed URL
      const res = await fetch("/api/admin/neighborhoods/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: meta.city, neighborhood: meta.neighborhood, fileType: file.type }),
      });
      const { signedUrl, publicUrl, error } = await res.json();
      if (error) throw new Error(error);

      // 2. Upload directly to Supabase
      const putRes = await fetch(signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!putRes.ok) throw new Error("Upload failed");

      // 3. Save public URL to DB
      await fetch(`/api/admin/neighborhoods/${meta.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: publicUrl }),
      });

      window.location.reload();
    } catch (err) {
      alert("שגיאה בהעלאת התמונה");
      console.error(err);
    } finally {
      setUploading(null);
    }
  }

  const tabCount = (key: Tab) => {
    if (key === "properties")    return properties.length;
    if (key === "agents")        return agents.length;
    if (key === "neighborhoods") return neighborhoods.length;
    if (key === "leads")         return sellerLeads.length;
    if (key === "whatsapp")      return whatsAppProperties.length;
    return 0;
  };

  async function deleteLead(id: string, name: string) {
    if (!confirm(`למחוק את הפנייה של "${name}"?`)) return;
    await fetch(`/api/admin/seller-leads/${id}`, { method: "DELETE" });
    window.location.reload();
  }

  return (
    <div dir="rtl">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Tabs + action button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {TABS.filter(t => isFullAdmin || t.key !== "agents").map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === key
                  ? "bg-white shadow-sm text-[#F5A623]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={15} />
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab === key ? "bg-[#F5A623]/15 text-[#F5A623]" : "bg-gray-200 text-gray-500"
              }`}>
                {tabCount(key)}
              </span>
            </button>
          ))}
        </div>

        {tab === "properties" && (
          <Link
            href="/admin/properties/new"
            className="flex items-center gap-2 bg-[#F5A623] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#D4881A] transition-colors"
          >
            <Plus size={16} />
            נכס חדש
          </Link>
        )}
        {tab === "agents" && isFullAdmin && (
          <Link
            href="/admin/agents/new"
            className="flex items-center gap-2 bg-[#F5A623] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#D4881A] transition-colors"
          >
            <Plus size={16} />
            סוכן חדש
          </Link>
        )}
        {tab === "whatsapp" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={14} />
              רענון
            </button>
            <a
              href={EXCEL_URL}
              download="whatsapp_properties.xlsx"
              className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-green-700 transition-colors"
            >
              <Download size={16} />
              הורד Excel
            </a>
          </div>
        )}
      </div>

      {/* ── Properties tab ── */}
      {tab === "properties" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {properties.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <Home size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">אין נכסים עדיין</p>
              <p className="text-sm mt-1">לחץ על "נכס חדש" להוספת הנכס הראשון</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-xs">
                  <th className="text-right font-medium px-5 py-3">תמונה</th>
                  <th className="text-right font-medium px-4 py-3">נכס</th>
                  <th className="text-right font-medium px-4 py-3">מחיר</th>
                  <th className="text-right font-medium px-4 py-3">עיר</th>
                  <th className="text-right font-medium px-4 py-3">סטטוס</th>
                  <th className="text-center font-medium px-4 py-3">הירו</th>
                  <th className="text-right font-medium px-4 py-3">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {properties.map((p) => {
                  const st = STATUS_LABEL[p.status] ?? { label: p.status, color: "bg-gray-100 text-gray-500" };
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <div className="relative w-12 h-9 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          <Image src={p.images?.[0] || FALLBACK} alt={p.title} fill className="object-cover" sizes="48px" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 leading-tight">{p.title}</div>
                        <div className="text-gray-400 text-xs font-mono mt-0.5">{p.slug}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">
                        {p.price ? `₪${p.price.toLocaleString("he-IL")}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.city || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleHero(p.id, !!p.features?.hero)}
                          title={p.features?.hero ? "הסר מהירו" : "הצג בהירו"}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: p.features?.hero ? "#F5A623" : "#d1d5db" }}
                        >
                          <Star size={15} fill={p.features?.hero ? "#F5A623" : "none"} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/properties/${p.id}/edit`} className="p-1.5 rounded-lg text-gray-400 hover:text-[#F5A623] hover:bg-[#F5A623]/8 transition-colors" title="עריכה">
                            <Pencil size={14} />
                          </Link>
                          <Link href={`/properties/${p.slug}`} target="_blank" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="צפייה באתר">
                            <ExternalLink size={14} />
                          </Link>
                          <button onClick={() => deleteProperty(p.id, p.title)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="מחיקה">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Agents tab ── */}
      {tab === "agents" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {agents.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <Users size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">אין סוכנים עדיין</p>
              <p className="text-sm mt-1">לחץ על "סוכן חדש" להוספת הסוכן הראשון</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-xs">
                  <th className="text-right font-medium px-5 py-3">תמונה</th>
                  <th className="text-right font-medium px-4 py-3">שם</th>
                  <th className="text-right font-medium px-4 py-3">טלפון</th>
                  <th className="text-right font-medium px-4 py-3">מייל</th>
                  <th className="text-right font-medium px-4 py-3">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {agents.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0 border-2 border-[#F5A623]/20">
                        <Image src={a.photo_url || AGENT_FALLBACK} alt={a.first_name} fill className="object-cover" sizes="40px" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{a.first_name} {a.last_name}</div>
                      <div className="text-gray-400 text-xs font-mono mt-0.5">{a.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{a.phone || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{a.email || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/agents/${a.id}/edit`} className="p-1.5 rounded-lg text-gray-400 hover:text-[#F5A623] hover:bg-[#F5A623]/8 transition-colors" title="עריכה">
                          <Pencil size={14} />
                        </Link>
                        <Link href={`/team/${a.slug}`} target="_blank" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="צפייה באתר">
                          <ExternalLink size={14} />
                        </Link>
                        <button onClick={() => deleteAgent(a.id, `${a.first_name} ${a.last_name}`)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="מחיקה">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Neighborhoods tab ── */}
      {tab === "neighborhoods" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {neighborhoods.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <MapPin size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">אין שכונות עדיין</p>
              <p className="text-sm mt-1">שכונות נוצרות אוטומטית כשמוסיפים נכסים</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-xs">
                  <th className="text-right font-medium px-5 py-3">תמונה</th>
                  <th className="text-right font-medium px-4 py-3">עיר</th>
                  <th className="text-right font-medium px-4 py-3">שכונה</th>
                  <th className="text-right font-medium px-4 py-3">תיאור AI</th>
                  <th className="text-right font-medium px-4 py-3">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {neighborhoods.map((n) => (
                  <tr key={n.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="relative w-14 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {n.image_url ? (
                          <Image src={n.image_url} alt={n.neighborhood} fill className="object-cover" sizes="56px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageOff size={16} className="text-gray-300" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{n.city}</td>
                    <td className="px-4 py-3 text-gray-700">{n.neighborhood || "—"}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-xs">
                      {n.description
                        ? <span className="line-clamp-2">{n.description}</span>
                        : <span className="italic">ממתין לניתוח AI</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => triggerImageUpload(n)}
                          disabled={uploading === n.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:border-[#F5A623] hover:text-[#F5A623] transition-colors disabled:opacity-50"
                        >
                          <Upload size={12} />
                          {uploading === n.id ? "מעלה..." : n.image_url ? "החלף" : "תמונה"}
                        </button>
                        <button
                          onClick={() => openEdit(n)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#F5A623] hover:bg-amber-50 transition-colors"
                          title="עריכה"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => deleteNeighborhood(n.id, n.neighborhood || n.city)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="מחיקה לצמיתות"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Leads tab ── */}
      {tab === "leads" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {sellerLeads.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <Inbox size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">אין פניות מוכרים עדיין</p>
              <p className="text-sm mt-1">פניות מטופס "מוכרים נכס?" יופיעו כאן</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-xs">
                  <th className="text-right font-medium px-5 py-3">שם</th>
                  <th className="text-right font-medium px-4 py-3">טלפון</th>
                  <th className="text-right font-medium px-4 py-3">עיר</th>
                  <th className="text-right font-medium px-4 py-3">סוג נכס</th>
                  <th className="text-right font-medium px-4 py-3">הערות</th>
                  <th className="text-right font-medium px-4 py-3">תאריך</th>
                  <th className="text-right font-medium px-4 py-3">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sellerLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3 font-semibold text-gray-900">{lead.name}</td>
                    <td className="px-4 py-3">
                      <a href={`tel:${lead.phone}`} className="text-[#F5A623] hover:underline font-medium">
                        {lead.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lead.city || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.property_type || "—"}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[180px]">
                      {lead.notes
                        ? <span className="line-clamp-2">{lead.notes}</span>
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteLead(lead.id, lead.name)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="מחיקה"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── WhatsApp Properties tab ── */}
      {tab === "whatsapp" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {whatsAppProperties.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <MessageCircle size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">אין נכסים מוואטסאפ עדיין</p>
              <p className="text-sm mt-1">נכסים שנשלפו מקבוצות וואטסאפ יופיעו כאן</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="text-sm" style={{ tableLayout: "fixed", width: "max-content", minWidth: "100%" }}>
                <colgroup>
                  {wpColWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60 text-gray-400 text-xs">
                    {([
                      { label: "סוג נכס",       align: "right"  },
                      { label: "כתובת",          align: "right"  },
                      { label: 'מ"ר',            align: "center" },
                      { label: "מרפסת",          align: "center" },
                      { label: "חדרים",          align: "center" },
                      { label: "קומה",           align: "center" },
                      { label: "מחיר",           align: "right"  },
                      { label: "מחיר קודם",      align: "right"  },
                      { label: 'ממ"ד',           align: "center" },
                      { label: "חניה",           align: "center" },
                      { label: "מחסן",           align: "center" },
                      { label: "מעלית",          align: "center" },
                      { label: "מתווך",          align: "right"  },
                      { label: "טלפון",          align: "right"  },
                      { label: "נצפה לראשונה",  align: "right"  },
                      { label: "עדכון אחרון",   align: "right"  },
                    ] as { label: string; align: string }[]).map(({ label, align }, idx) => (
                      <th
                        key={label}
                        onClick={() => toggleWpSort(idx)}
                        style={{ textAlign: align as "right" | "center" | "left", position: "relative", userSelect: "none", cursor: "pointer" }}
                        className="font-medium px-4 py-3 whitespace-nowrap border-l border-gray-100 hover:bg-gray-100/60 transition-colors"
                      >
                        <span className="inline-flex items-center gap-1">
                          {label}
                          {wpSort?.col === idx
                            ? <span className="text-[#F5A623]">{wpSort.dir === "asc" ? "↑" : "↓"}</span>
                            : <span className="opacity-0 group-hover:opacity-30">↕</span>}
                        </span>
                        {/* Drag handle on left edge (RTL) — stops click from bubbling to sort */}
                        <div
                          onMouseDown={(e) => { e.stopPropagation(); startWpColResize(e, idx); }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, cursor: "col-resize", zIndex: 1 }}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedWpProperties.map((p) => {
                    const priceChanged = p.previous_price != null;
                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors ${priceChanged ? "bg-amber-50 hover:bg-amber-100/60" : "hover:bg-gray-50/60"}`}
                      >
                        <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">{p.property_type || "—"}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{p.address || "—"}</td>
                        <td className="px-4 py-2.5 text-gray-600 text-center">{p.area_sqm ?? "—"}</td>
                        <td className="px-4 py-2.5 text-gray-600 text-center">{p.balcony_sqm ?? "—"}</td>
                        <td className="px-4 py-2.5 text-gray-600 text-center">{p.rooms ?? "—"}</td>
                        <td className="px-4 py-2.5 text-gray-600 text-center">{p.floor ?? "—"}</td>
                        <td className="px-4 py-2.5 font-semibold text-gray-900 whitespace-nowrap">
                          {p.price ? `₪${p.price.toLocaleString("he-IL")}` : "—"}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {p.previous_price ? (
                            <span className="text-amber-600 font-medium flex items-center gap-1">
                              ₪{p.previous_price.toLocaleString("he-IL")}
                              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">↓ עודכן</span>
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-center">{p.mamad ? "✓" : "—"}</td>
                        <td className="px-3 py-2.5 text-center">{p.parking ? "✓" : "—"}</td>
                        <td className="px-3 py-2.5 text-center">{p.storage ? "✓" : "—"}</td>
                        <td className="px-3 py-2.5 text-center">{p.elevator ? "✓" : "—"}</td>
                        <td className="px-4 py-2.5 text-gray-700">{p.broker_name || "—"}</td>
                        <td className="px-4 py-2.5">
                          {p.broker_phone ? (
                            <a href={`tel:${p.broker_phone}`} className="text-[#F5A623] hover:underline font-medium whitespace-nowrap">
                              {p.broker_phone}
                            </a>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                          {p.first_seen_date ? new Date(p.first_seen_date).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                          {p.last_seen_date ? new Date(p.last_seen_date).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 text-center">
        <ChevronLeft size={0} className="hidden" />
      </div>

      {/* ── Edit Neighborhood Modal ── */}
      {editNeighborhood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setEditNeighborhood(null); }}>
          <div dir="rtl" className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-black text-lg text-gray-900">עריכת שכונה</h2>
              <div className="text-sm text-gray-400 font-medium">{editNeighborhood.neighborhood || editNeighborhood.city}, {editNeighborhood.city}</div>
            </div>
            <div className="p-6 space-y-4">
              {([
                { key: "description",   label: "סיכום כללי" },
                { key: "transport",     label: "תחבורה" },
                { key: "socioeconomic", label: "חתך סוציו-אקונומי" },
                { key: "commerce",      label: "מסחר ובידור" },
                { key: "schools",       label: "חינוך" },
              ] as { key: keyof typeof editForm; label: string }[]).map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-gray-500 mb-1">{label}</label>
                  <textarea
                    value={editForm[key]}
                    onChange={(e) => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#F5A623]"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setEditNeighborhood(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={saveNeighborhood}
                disabled={savingNeighborhood}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-[#F5A623] text-white hover:bg-[#D4881A] transition-colors disabled:opacity-60"
              >
                {savingNeighborhood ? "שומר..." : "שמור שינויים"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
