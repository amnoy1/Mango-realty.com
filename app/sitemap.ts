import { createAdminClient } from "@/lib/supabase/server";
import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mango-realty-com.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createAdminClient();

  const [{ data: properties }, { data: agents }, { data: neighborhoods }] = await Promise.all([
    supabase.from("properties").select("slug, updated_at").eq("status", "active"),
    supabase.from("agents").select("slug, updated_at"),
    supabase.from("neighborhoods").select("id, updated_at"),
  ]);

  const propertyUrls: MetadataRoute.Sitemap = (properties || []).map((p) => ({
    url:             `${SITE_URL}/properties/${p.slug}`,
    lastModified:    new Date(p.updated_at),
    changeFrequency: "weekly",
    priority:        0.8,
  }));

  const agentUrls: MetadataRoute.Sitemap = (agents || []).map((a) => ({
    url:             `${SITE_URL}/team/${a.slug}`,
    lastModified:    new Date(a.updated_at),
    changeFrequency: "monthly",
    priority:        0.6,
  }));

  const neighborhoodUrls: MetadataRoute.Sitemap = (neighborhoods || []).map((n) => ({
    url:             `${SITE_URL}/neighborhoods/${n.id}`,
    lastModified:    new Date(n.updated_at),
    changeFrequency: "monthly",
    priority:        0.6,
  }));

  return [
    { url: SITE_URL,                    lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${SITE_URL}/properties`,    lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${SITE_URL}/neighborhoods`, lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
    { url: `${SITE_URL}/team`,          lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    ...propertyUrls,
    ...agentUrls,
    ...neighborhoodUrls,
  ];
}
