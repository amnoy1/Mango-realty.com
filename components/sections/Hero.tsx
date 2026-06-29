import { createClient } from "@/lib/supabase/server";
import HeroSlider from "./HeroSlider";

export default async function Hero() {
  const supabase = await createClient();

  // First try hero-flagged properties, then fall back to all active
  const { data: all } = await supabase
    .from("properties")
    .select("slug, title, images, features")
    .eq("status", "active")
    .not("images", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);

  const rows = all ?? [];

  const heroFlagged = rows.filter(p => p.features?.hero === true);
  const pool = heroFlagged.length > 0 ? heroFlagged : rows;

  const slides = pool
    .filter(p => p.images?.[0])
    .slice(0, 8)
    .map(p => ({
      image: p.images[0] as string,
      title: p.title as string,
      slug:  p.slug  as string,
    }));

  return <HeroSlider slides={slides} />;
}
