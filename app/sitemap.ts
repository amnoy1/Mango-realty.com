import { createAdminClient } from "@/lib/supabase/server";
import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mango-realty-com.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("properties")
    .select("slug, updated_at")
    .eq("status", "active");

  const propertyUrls: MetadataRoute.Sitemap = (data || []).map((p) => ({
    url:          `${SITE_URL}/properties/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: SITE_URL,               lastModified: new Date(), changeFrequency: "daily",  priority: 1.0 },
    { url: `${SITE_URL}/properties`, lastModified: new Date(), changeFrequency: "daily",  priority: 0.9 },
    ...propertyUrls,
  ];
}
