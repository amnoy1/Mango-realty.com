"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthHandlePage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { flowType: "implicit" },
        cookies: {
          get: (name: string) => {
            const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
            return match ? decodeURIComponent(match[1]) : undefined;
          },
          set: (name: string, value: string, options: { maxAge?: number }) => {
            let c = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
            if (options?.maxAge) c += `; max-age=${options.maxAge}`;
            document.cookie = c;
          },
          remove: (name: string) => {
            document.cookie = `${name}=; path=/; max-age=0`;
          },
        },
      }
    );

    async function handleAuth() {
      // Implicit flow: Supabase detects #access_token= from hash automatically
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        router.replace("/admin");
      } else {
        const msg = error?.message || "no_session";
        router.replace(`/admin/login?error=${encodeURIComponent(msg)}`);
      }
    }

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">מאמת...</p>
      </div>
    </div>
  );
}
