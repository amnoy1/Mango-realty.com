import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
    // Re-visiting the same dynamic route (e.g. clicking back to an admin tab
    // you were just on) reuses the client-side Router Cache for 30s instead of
    // re-running the server component every time.
    staleTimes: { dynamic: 30 },
  },
};

export default nextConfig;
