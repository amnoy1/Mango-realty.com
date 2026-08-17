"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { Home, Users, MapPin, Inbox, MessageCircle, Route } from "lucide-react";

const ALL_TABS = [
  { key: "properties",    label: "נכסים",   icon: Home           },
  { key: "agents",        label: "צוות",    icon: Users          },
  { key: "neighborhoods", label: "שכונות",  icon: MapPin         },
  { key: "leads",         label: "לידים",   icon: Inbox          },
  { key: "whatsapp",      label: "וואטסאפ", icon: MessageCircle  },
  { key: "street-map",    label: "רחובות",  icon: Route          },
];

const AGENT_TAB_KEYS = ["properties", "leads"];

export default function AdminNavBar({ isFullAdmin, counts = {} }: { isFullAdmin: boolean; counts?: Record<string, number> }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Determine active tab from URL
  let activeTab = searchParams.get("tab") ?? "properties";
  if (pathname.startsWith("/admin/agents"))     activeTab = "agents";
  if (pathname.startsWith("/admin/properties")) activeTab = "properties";

  const tabs = isFullAdmin
    ? ALL_TABS
    : ALL_TABS.filter(t => AGENT_TAB_KEYS.includes(t.key));

  return (
    <nav dir="rtl" className="bg-white border-b border-gray-100 px-6 sticky top-[53px] z-30 shadow-sm">
      <div className="flex max-w-5xl mx-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={`/admin?tab=${key}`}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === key
                ? "border-[#F5A623] text-[#F5A623]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Icon size={14} />
            {label}
            {(counts[key] ?? 0) > 0 && (
              <span className="text-[10px] font-bold bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 min-w-[1.1rem] text-center leading-tight">
                {counts[key]}
              </span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
