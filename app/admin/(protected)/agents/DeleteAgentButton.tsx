"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteAgentButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`למחוק את ${name}?`)) return;
    await fetch(`/api/admin/agents/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="flex items-center gap-1.5 border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
    >
      <Trash2 size={13} /> מחיקה
    </button>
  );
}
