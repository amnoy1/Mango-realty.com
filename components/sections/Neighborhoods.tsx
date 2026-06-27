import { createClient } from "@/lib/supabase/server";
import NeighborhoodsGrid from "./NeighborhoodsGrid";
import type { NeighborhoodData } from "@/lib/neighborhood";

export default async function Neighborhoods() {
  const supabase = await createClient();

  // Fetch analyzed neighborhoods (have description = were AI-processed)
  const { data: rawNhoods } = await supabase
    .from("neighborhoods")
    .select("id, city, neighborhood, description, transport, socioeconomic, commerce, schools, image_url, analysis_updated_at")
    .not("description", "is", null)
    .order("updated_at", { ascending: false })
    .limit(6);

  if (!rawNhoods?.length) return null;

  // Enrich: for each neighborhood without image_url, grab first active property image
  const neighborhoods = await Promise.all(
    rawNhoods.map(async (n) => {
      if (n.image_url) return n;
      const { data: prop } = await supabase
        .from("properties")
        .select("images")
        .eq("city", n.city)
        .eq("status", "active")
        .not("images", "is", null)
        .maybeSingle();
      const img = (prop?.images as string[] | null)?.[0] ?? null;
      return { ...n, image_url: img };
    })
  );

  // Map to NeighborhoodData type
  const s = (v: unknown) => (typeof v === "string" ? v : null);
  const data: (NeighborhoodData & { id: string; image_url: string | null })[] = neighborhoods.map((n) => ({
    id:            n.id as string,
    city:          n.city as string,
    neighborhood:  (n.neighborhood as string) || (n.city as string),
    description:   s(n.description),
    transport:     s(n.transport),
    socioeconomic: s(n.socioeconomic),
    commerce:      s(n.commerce),
    schools:       s(n.schools),
    image_url:     s(n.image_url),
  }));

  return <NeighborhoodsGrid neighborhoods={data} />;
}
