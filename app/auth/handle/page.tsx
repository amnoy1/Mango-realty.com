"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useEffect } from "react";

export default function AuthHandlePage() {
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function handleAuth() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        // PKCE flow
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (data.session) {
          window.location.replace("/admin");
        } else {
          window.location.replace(`/admin/login?error=${encodeURIComponent(error?.message ?? "exchange_failed")}`);
        }
      } else {
        // Implicit flow fallback
        const { data, error } = await supabase.auth.getSession();
        if (data.session) {
          window.location.replace("/admin");
        } else {
          window.location.replace(`/admin/login?error=${encodeURIComponent(error?.message ?? "no_session")}`);
        }
      }
    }

    handleAuth();
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">מאמת...</p>
      </div>
    </div>
  );
}
