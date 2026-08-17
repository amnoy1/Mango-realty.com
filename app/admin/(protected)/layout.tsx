import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isAdmin, isFullAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import AdminNavBar from "./AdminNavBar";

export const metadata = { title: "Admin — Mango Realty" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!isAdmin(user?.email)) {
    redirect("/admin/login");
  }

  const fullAdmin = isFullAdmin(user?.email);

  // Fetch tab counts
  const adminSupabase = await createAdminClient();
  let counts: Record<string, number> = {};

  if (fullAdmin) {
    const [
      { count: propCount },
      { count: agentCount },
      { count: hoodCount },
      { count: leadsCount },
      { count: waCount },
      { count: streetCount },
    ] = await Promise.all([
      adminSupabase.from("properties").select("*", { count: "exact", head: true }),
      adminSupabase.from("agents").select("*", { count: "exact", head: true }),
      adminSupabase.from("neighborhoods").select("*", { count: "exact", head: true }),
      adminSupabase.from("seller_leads").select("*", { count: "exact", head: true }),
      adminSupabase.from("whatsapp_properties").select("*", { count: "exact", head: true }),
      adminSupabase.from("street_neighborhoods").select("*", { count: "exact", head: true }),
    ]);
    counts = {
      properties: propCount ?? 0,
      agents: agentCount ?? 0,
      neighborhoods: hoodCount ?? 0,
      leads: leadsCount ?? 0,
      whatsapp: waCount ?? 0,
      "street-map": streetCount ?? 0,
    };
  } else {
    const { data: agentRecord } = await adminSupabase
      .from("agents").select("id").eq("email", user?.email ?? "").maybeSingle();

    const [{ count: propCount }, { count: leadsCount }] = await Promise.all([
      agentRecord
        ? adminSupabase.from("properties").select("*", { count: "exact", head: true }).eq("agent_id", agentRecord.id)
        : Promise.resolve({ count: 0, data: null, error: null, status: 200, statusText: "" }),
      adminSupabase.from("seller_leads").select("*", { count: "exact", head: true }),
    ]);
    counts = { properties: propCount ?? 0, leads: leadsCount ?? 0 };
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden">
            <Image src="/logo.png" alt="Mango" fill className="object-cover" sizes="32px" />
          </div>
          <span className="font-black text-[#1C1C1E] text-base">
            Mango <span className="text-[#F5A623]">Admin</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
          >
            צפה באתר ↗
          </Link>
          <LogoutButton />
        </div>
      </header>

      <Suspense fallback={null}>
        <AdminNavBar isFullAdmin={fullAdmin} counts={counts} />
      </Suspense>

      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}

function LogoutButton() {
  return (
    <form action="/api/admin/logout" method="POST">
      <button
        type="submit"
        className="text-xs text-gray-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
      >
        יציאה
      </button>
    </form>
  );
}
