import { createClient } from "@/lib/supabase/server";
import NeighborhoodsGrid from "./NeighborhoodsGrid";
import type { NeighborhoodData } from "@/lib/neighborhood";

export default async function Neighborhoods() {
  const supabase = await createClient();

  // 1. All unique (city, neighborhood) pairs from active properties
  const { data: propRows } = await supabase
    .from("properties")
    .select("city, neighborhood, images")
    .eq("status", "active")
    .not("city", "is", null)
    .order("published_at", { ascending: false });

  if (!propRows?.length) return null;

  // Deduplicate — keep first occurrence per (city+neighborhood)
  const seen = new Set<string>();
  const unique: { city: string; neighborhood: string; images: string[] }[] = [];
  for (const p of propRows) {
    const key = `${p.city}||${p.neighborhood ?? ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({
        city:         p.city,
        neighborhood: p.neighborhood ?? p.city,
        images:       (p.images as string[]) ?? [],
      });
    }
  }

  // 2. Fetch cached analyses for these neighborhoods
  const { data: cached } = await supabase
    .from("neighborhoods")
    .select("city, neighborhood, description, transport, socioeconomic, commerce, schools, image_url")
    .in("city", [...new Set(unique.map(u => u.city))]);

  const cacheMap = new Map(
    (cached ?? []).map(c => [`${c.city}||${c.neighborhood}`, c])
  );

  // 3. Merge: property image as fallback when no image_url in cache
  const s = (v: unknown) => (typeof v === "string" ? v : null);
  const data: (NeighborhoodData & { id: string })[] = unique.slice(0, 6).map((u, i) => {
    const hit = cacheMap.get(`${u.city}||${u.neighborhood}`)
              ?? cacheMap.get(`${u.city}||${u.city}`);
    return {
      id:            `${u.city}-${u.neighborhood}-${i}`,
      city:          u.city,
      neighborhood:  u.neighborhood,
      description:   s(hit?.description),
      transport:     s(hit?.transport),
      socioeconomic: s(hit?.socioeconomic),
      commerce:      s(hit?.commerce),
      schools:       s(hit?.schools),
      image_url:     s(hit?.image_url) ?? u.images[0] ?? null,
    };
  });

  return <NeighborhoodsGrid neighborhoods={data} />;
}
