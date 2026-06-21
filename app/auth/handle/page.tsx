"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthHandlePage() {
  const router = useRouter();
  const [status, setStatus] = useState("מאמת...");

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function handleAuth() {
      // Handle PKCE flow: ?code= in URL
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace(`/admin/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
        router.replace("/admin/properties");
        return;
      }

      // Handle implicit flow: #access_token= in hash
      // Supabase client auto-detects hash on getSession()
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/admin/properties");
        return;
      }

      // Check for error in URL
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const hashError = hashParams.get("error_description") || params.get("error_description") || params.get("error");
      router.replace(`/admin/login?error=${encodeURIComponent(hashError || "no_session")}`);
    }

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">{status}</p>
      </div>
    </div>
  );
}
