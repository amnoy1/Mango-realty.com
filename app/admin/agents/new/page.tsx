"use client";

import { useRouter } from "next/navigation";
import AgentForm from "@/components/admin/AgentForm";

export default function NewAgentPage() {
  const router = useRouter();

  async function handleSubmit(data: Parameters<typeof AgentForm>[0]["onSubmit"] extends (d: infer D) => unknown ? D : never) {
    const res = await fetch("/api/admin/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.error) return { error: json.error };
    router.push("/admin/agents");
    router.refresh();
    return {};
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-4 pb-12" dir="rtl">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <a href="/admin/agents" className="text-xs text-gray-400 hover:text-[#F5A623] transition-colors mb-1 block">
            ← חזרה לצוות
          </a>
          <h1 className="text-2xl font-black text-gray-900">הוספת סוכן חדש</h1>
        </div>
        <AgentForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
