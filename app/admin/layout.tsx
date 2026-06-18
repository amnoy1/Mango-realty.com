import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin — Mango Realty" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== "amir@mango-realty.com") {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-[#F5A623] font-[Heebo]">Mango</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600 text-sm">פאנל ניהול</span>
        </div>
        <nav className="flex items-center gap-4">
          <a href="/admin/properties" className="text-sm text-gray-600 hover:text-[#F5A623] transition-colors">
            נכסים
          </a>
          <a href="/" target="_blank" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            צפה באתר ↗
          </a>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
