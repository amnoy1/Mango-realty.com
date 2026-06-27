"use client";

import { useRouter } from "next/navigation";
import AgentForm from "@/components/admin/AgentForm";

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  bio: string | null;
}

export default function AgentEditClient({ agent }: { agent: Agent }) {
  const router = useRouter();

  async function handleSubmit(data: { first_name: string; last_name: string; phone: string; email: string; photo_url: string; bio: string }) {
    const res = await fetch(`/api/admin/agents/${agent.id}`, {
      method: "PATCH",
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
          <h1 className="text-2xl font-black text-gray-900">
            עריכת {agent.first_name} {agent.last_name}
          </h1>
        </div>
        <AgentForm
          initialData={{
            id:         agent.id,
            first_name: agent.first_name,
            last_name:  agent.last_name,
            phone:      agent.phone      ?? "",
            email:      agent.email      ?? "",
            photo_url:  agent.photo_url  ?? "",
            bio:        agent.bio        ?? "",
          }}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
