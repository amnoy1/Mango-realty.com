"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus, Pencil, Trash2, ExternalLink,
  Home, Users, ChevronLeft, Star,
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

const TABS = [
  { key: "properties", label: "נכסים",  icon: Home  },
  { key: "agents",     label: "צוות",   icon: Users },
] as const;
type Tab = typeof TABS[number]["key"];

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active:  { label: "פעיל",    color: "bg-green-100 text-green-700"  },
  draft:   { label: "טיוטה",   color: "bg-gray-100 text-gray-500"    },
  sold:    { label: "נמכר",    color: "bg-blue-100 text-blue-700"    },
  rented:  { label: "הושכר",   color: "bg-purple-100 text-purple-700"},
};

const FALLBACK = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=100&q=60";
const AGENT_FALLBACK = "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=60";

export default function AdminDashboard({
  properties, agents,
}: { properties: Property[]; agents: Agent[] }) {
  const [tab, setTab] = useState<Tab>("properties");

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

  return (
    <div dir="rtl">

      {/* Tabs + action button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {TABS.map(({ key, label, icon: Icon }) => (
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
                {key === "properties" ? properties.length : agents.length}
              </span>
            </button>
          ))}
        </div>

        <Link
          href={tab === "properties" ? "/admin/properties/new" : "/admin/agents/new"}
          className="flex items-center gap-2 bg-[#F5A623] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#D4881A] transition-colors"
        >
          <Plus size={16} />
          {tab === "properties" ? "נכס חדש" : "סוכן חדש"}
        </Link>
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
                          <Image
                            src={p.images?.[0] || FALLBACK}
                            alt={p.title}
                            fill className="object-cover" sizes="48px"
                          />
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
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${st.color}`}>
                          {st.label}
                        </span>
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
                          <Link
                            href={`/admin/properties/${p.id}/edit`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#F5A623] hover:bg-[#F5A623]/8 transition-colors"
                            title="עריכה"
                          >
                            <Pencil size={14} />
                          </Link>
                          <Link
                            href={`/properties/${p.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                            title="צפייה באתר"
                          >
                            <ExternalLink size={14} />
                          </Link>
                          <button
                            onClick={() => deleteProperty(p.id, p.title)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="מחיקה"
                          >
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
                        <Image
                          src={a.photo_url || AGENT_FALLBACK}
                          alt={a.first_name}
                          fill className="object-cover" sizes="40px"
                        />
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
                        <Link
                          href={`/admin/agents/${a.id}/edit`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#F5A623] hover:bg-[#F5A623]/8 transition-colors"
                          title="עריכה"
                        >
                          <Pencil size={14} />
                        </Link>
                        <Link
                          href={`/team/${a.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                          title="צפייה באתר"
                        >
                          <ExternalLink size={14} />
                        </Link>
                        <button
                          onClick={() => deleteAgent(a.id, `${a.first_name} ${a.last_name}`)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="מחיקה"
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

      {/* back hint for sub-pages */}
      <div className="mt-6 text-center">
        <ChevronLeft size={0} className="hidden" />
      </div>
    </div>
  );
}
