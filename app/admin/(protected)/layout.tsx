import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Admin — Mango Realty" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user?.email !== "amir@mango-realty.com") {
    redirect("/admin/login");
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
