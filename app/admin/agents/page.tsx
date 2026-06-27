import { createAdminClient, createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Trash2, Phone, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAgentsPage() {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user || user.email !== "amir@mango-realty.com") redirect("/admin/login");

  const supabase = await createAdminClient();
  const { data: agents } = await supabase
    .from("agents")
    .select("*")
    .order("first_name");

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-4 pb-12" dir="rtl">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin/properties" className="text-xs text-gray-400 hover:text-[#F5A623] transition-colors mb-1 block">
              ← חזרה לנכסים
            </Link>
            <h1 className="text-2xl font-black text-gray-900">ניהול צוות סוכנים</h1>
          </div>
          <Link
            href="/admin/agents/new"
            className="flex items-center gap-2 bg-[#F5A623] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#D4881A] transition-colors"
          >
            <Plus size={16} /> סוכן חדש
          </Link>
        </div>

        {/* List */}
        <div className="space-y-3">
          {agents?.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
              <p className="text-lg font-bold mb-2">אין סוכנים עדיין</p>
              <p className="text-sm">לחץ על "סוכן חדש" להוספת הסוכן הראשון</p>
            </div>
          )}
          {agents?.map((agent) => (
            <div key={agent.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-5">
              {/* Photo */}
              <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-[#F5A623]/20 bg-gray-100">
                {agent.photo_url ? (
                  <Image src={agent.photo_url} alt={agent.first_name} fill className="object-cover" sizes="56px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 font-black text-lg">
                    {agent.first_name?.[0]}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-black text-gray-900">{agent.first_name} {agent.last_name}</div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                  {agent.phone && (
                    <span className="flex items-center gap-1"><Phone size={10} /> {agent.phone}</span>
                  )}
                  {agent.email && (
                    <span className="flex items-center gap-1"><Mail size={10} /> {agent.email}</span>
                  )}
                </div>
                {agent.bio && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{agent.bio}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/admin/agents/${agent.id}/edit`}
                  className="flex items-center gap-1.5 border border-gray-200 text-gray-600 hover:border-[#F5A623] hover:text-[#F5A623] px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                >
                  <Pencil size={13} /> עריכה
                </Link>
                <form action={`/api/admin/agents/${agent.id}`} method="DELETE">
                  <button
                    type="submit"
                    onClick={async (e) => {
                      e.preventDefault();
                      if (!confirm(`למחוק את ${agent.first_name}?`)) return;
                      await fetch(`/api/admin/agents/${agent.id}`, { method: "DELETE" });
                      window.location.reload();
                    }}
                    className="flex items-center gap-1.5 border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Trash2 size={13} /> מחיקה
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
