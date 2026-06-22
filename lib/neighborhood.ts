import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient, createClient } from "./supabase/server";

export interface NeighborhoodData {
  city: string;
  neighborhood: string;
  description: string | null;
  school_count: number;
  schools: { name: string; type: string }[];
  image_url: string | null;
  // CBS socio-economic cluster 1–10
  socio_economic_cluster: number | null;
  // Kept in interface for future use — null for now
  avg_price_sqm: number | null;
  transactions_count: number | null;
  transport_lines: { name: string; type: string }[] | null;
}

// ─── data.gov.il resources ────────────────────────────────────────────────────
// Schools dataset: institution names, types, city
const GOV_SCHOOLS_RESOURCE = "5548fd63-5868-4053-ad81-98caddc5e232";
// Coordinates dataset: institution code → UTM_X (lng) / UTM_Y (lat) WGS84
const GOV_COORDS_RESOURCE  = "5c5d6bb0-755d-470d-84b6-d7dd3135ba9c";
// CBS socio-economic cluster per locality (2019)
const GOV_SOCIOECO_RESOURCE = "7c860e04-9f8d-41c2-9f24-6249958d2081";

// ─── Haversine distance (km) ──────────────────────────────────────────────────
function distKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── data.gov.il — schools near property ─────────────────────────────────────
async function fetchSchools(
  city: string,
  lat: number | null,
  lng: number | null
): Promise<{ count: number; schools: { name: string; type: string }[] }> {
  const empty = { count: 0, schools: [] as { name: string; type: string }[] };
  try {
    // Step 1: Get schools in city with institution codes
    const f1 = encodeURIComponent(JSON.stringify({ "שם ישוב": city }));
    const q  = encodeURIComponent("בית ספר");
    const fields = encodeURIComponent("סמל מוסד,שם מוסד");
    const url1 = `https://data.gov.il/api/3/action/datastore_search?resource_id=${GOV_SCHOOLS_RESOURCE}&filters=${f1}&q=${q}&fields=${fields}&limit=100`;

    const res1 = await fetch(url1, {
      signal: AbortSignal.timeout(10000),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: { revalidate: 3600 } as any,
    });
    if (!res1.ok) return empty;

    const records1: Record<string, string>[] = (await res1.json()).result?.records ?? [];

    // De-duplicate by name, build code→name map
    const seen = new Set<string>();
    const codeToName = new Map<string, string>();
    for (const r of records1) {
      const name = r["שם מוסד"];
      const code = r["סמל מוסד"];
      if (name && code && !seen.has(name)) {
        seen.add(name);
        codeToName.set(code, name);
      }
    }

    if (codeToName.size === 0) return empty;

    // Fallback: no coordinates — return city-wide (first 8)
    if (!lat || !lng) {
      const schools = Array.from(codeToName.values())
        .slice(0, 8)
        .map(n => ({ name: n, type: "בית ספר" }));
      return { count: codeToName.size, schools };
    }

    // Step 2: Get coordinates for these specific schools via JOIN on SEMEL_MOSAD
    const codes = Array.from(codeToName.keys());
    const f2 = encodeURIComponent(JSON.stringify({ SEMEL_MOSAD: codes }));
    const coordFields = encodeURIComponent("SEMEL_MOSAD,UTM_X,UTM_Y");
    const url2 = `https://data.gov.il/api/3/action/datastore_search?resource_id=${GOV_COORDS_RESOURCE}&filters=${f2}&fields=${coordFields}&limit=200`;

    const res2 = await fetch(url2, {
      signal: AbortSignal.timeout(10000),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: { revalidate: 3600 } as any,
    });

    const coords: Record<string, string>[] = res2.ok
      ? (await res2.json()).result?.records ?? []
      : [];

    if (coords.length === 0) {
      // Fallback to city-wide
      const schools = Array.from(codeToName.values())
        .slice(0, 8)
        .map(n => ({ name: n, type: "בית ספר" }));
      return { count: codeToName.size, schools };
    }

    // Sort by distance from property, keep within 2.5 km
    const withDist = coords
      .map(r => ({
        name: codeToName.get(r["SEMEL_MOSAD"]) ?? "",
        dist: distKm(lat, lng, parseFloat(r["UTM_Y"]), parseFloat(r["UTM_X"])),
      }))
      .filter(s => s.name && s.dist < 2.5)
      .sort((a, b) => a.dist - b.dist);

    // De-duplicate by name
    const nearby = Array.from(new Map(withDist.map(s => [s.name, s])).values());

    return {
      count: nearby.length || codeToName.size,
      schools: nearby.slice(0, 8).map(s => ({ name: s.name, type: "בית ספר" })),
    };
  } catch {
    return empty;
  }
}

// ─── data.gov.il — CBS socio-economic cluster ─────────────────────────────────
async function fetchSocioEconomicCluster(city: string): Promise<number | null> {
  try {
    const f = encodeURIComponent(JSON.stringify({ "HEBREW NAME OF LOCALITY": city }));
    const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=${GOV_SOCIOECO_RESOURCE}&filters=${f}&fields=${encodeURIComponent("ESHKOL 2019")}&limit=1`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: { revalidate: 86400 } as any, // cache 24h
    });
    if (!res.ok) return null;

    const records: Record<string, unknown>[] = (await res.json()).result?.records ?? [];
    if (records.length === 0) return null;

    const cluster = records[0]["ESHKOL 2019"];
    const num = typeof cluster === "number" ? cluster : parseInt(String(cluster), 10);
    return isNaN(num) ? null : num;
  } catch {
    return null;
  }
}

// ─── Claude — AI description ──────────────────────────────────────────────────
async function generateDescription(city: string, neighborhood: string) {
  try {
    const client = new Anthropic();
    const location = neighborhood ? `"${neighborhood}" ב${city}` : city;
    const { content } = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 250,
      messages: [
        {
          role: "user",
          content: `כתוב תיאור קצר ואטרקטיבי של ${location} לרוכש פוטנציאלי של נכס.

חוקים דווקניים:
- עברית בלבד (ללא מילים באנגלית)
- 2-3 משפטים בלבד
- ללא כותרת, ללא סימני markdown (ללא # * - וכו'), ללא מספור
- פסקה אחת רציפה בלבד
- אל תציין מרחקים ספציפיים בדקות או בקילומטרים
- אל תציין שמות של קניונים, מרכזי קניות, או מסעדות ספציפיות
- אל תציין שמות רחובות ספציפיים
- אל תציין מחירים
- כתוב רק מה שאתה בטוח בו לגבי אופי האזור בישראל

התמקד: אווירה כללית, סוג קהילה (משפחתי/צעיר/מעורב), איכות חיים, קרבה כללית לתחבורה ולשירותים. שפה חיובית.`,
        },
      ],
    });
    return (content[0] as { text: string }).text.trim();
  } catch {
    return null;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function getNeighborhoodData(
  city: string,
  neighborhood: string,
  lat?: number | null,
  lng?: number | null
): Promise<NeighborhoodData | null> {
  if (!city) return null;

  const SIX_MONTHS = 180 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  // ── 1. Check Supabase cache ──
  let existing: Record<string, unknown> | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("neighborhoods")
      .select("*")
      .eq("city", city)
      .eq("neighborhood", neighborhood)
      .single();
    existing = data as Record<string, unknown> | null;
  } catch {
    // Table might not exist yet
  }

  const analysisAge = existing?.analysis_updated_at
    ? now - new Date(existing.analysis_updated_at as string).getTime()
    : Infinity;
  const needsAnalysis = analysisAge > SIX_MONTHS;

  // ── 2. Return from cache (socio-economic cluster always fetched fresh) ──
  // Fetch cluster in background regardless — it's fast and static
  const clusterPromise = fetchSocioEconomicCluster(city);

  if (existing && !needsAnalysis) {
    const cluster = await clusterPromise;
    return {
      city,
      neighborhood,
      description:             existing.description  as string | null,
      school_count:            (existing.school_count as number) ?? 0,
      schools:                 (existing.schools_data as { name: string; type: string }[]) ?? [],
      image_url:               existing.image_url    as string | null,
      socio_economic_cluster:  cluster,
      avg_price_sqm:           null,
      transactions_count:      null,
      transport_lines:         null,
    };
  }

  // ── 3. Fetch fresh data ──
  const [schoolsResult, description, cluster] = await Promise.all([
    fetchSchools(city, lat ?? null, lng ?? null),
    generateDescription(city, neighborhood),
    clusterPromise,
  ]);

  const updates: Record<string, unknown> = {
    updated_at:   new Date().toISOString(),
    school_count: schoolsResult.count,
    schools_data: schoolsResult.schools,
    description:  description ?? (existing?.description as string | null) ?? null,
    image_url:    (existing?.image_url as string | null) ?? null,
  };

  // Only lock cache when we have real school data
  if (schoolsResult.count > 0) {
    updates.analysis_updated_at = new Date().toISOString();
  }

  // ── 4. Persist to Supabase ──
  try {
    const supabaseAdmin = await createAdminClient();
    if (existing) {
      await supabaseAdmin
        .from("neighborhoods")
        .update(updates)
        .eq("city", city)
        .eq("neighborhood", neighborhood);
    } else {
      await supabaseAdmin
        .from("neighborhoods")
        .insert({ city, neighborhood, ...updates });
    }
  } catch {
    // Silently ignore
  }

  const merged = { ...(existing ?? {}), ...updates };
  return {
    city,
    neighborhood,
    description:            (merged.description  ?? null) as string | null,
    school_count:           (merged.school_count ?? 0)    as number,
    schools:                ((merged.schools_data ?? [])   as { name: string; type: string }[]),
    image_url:              (merged.image_url    ?? null) as string | null,
    socio_economic_cluster: cluster,
    avg_price_sqm:          null,
    transactions_count:     null,
    transport_lines:        null,
  };
}
