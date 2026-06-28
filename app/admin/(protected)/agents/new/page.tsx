"use client";

import { useRouter } from "next/navigation";
import AgentForm from "@/components/admin/AgentForm";

export default function NewAgentPage() {
  const router = useRouter();

  async function handleSubmit(data: { first_name: string; last_name: string; phone: string; email: string; photo_url: string; bio: string }) {
    const res = await fetch("/api/admin/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.error) return { error: json.error };
    router.push("/admin");
    router.refresh();
    return {};
  }

  return (
    <div dir="rtl">
      <div className="mb-8">
        <a href="/admin" className="text-xs text-gray-400 hover:text-[#F5A623] transition-colors mb-1 block">
          ← חזרה לצוות
        </a>
        <h1 className="text-2xl font-bold text-gray-900">הוספת סוכן חדש</h1>
      </div>
      <AgentForm onSubmit={handleSubmit} />
    </div>
  );
}
