/**
 * Geocode an Israeli address using Nominatim (OpenStreetMap).
 * Free, no API key required. Policy: max 1 req/sec, include User-Agent.
 * Returns { lat, lng } or null if not found / on error.
 */
export async function geocodeIsraeliAddress(
  street: string,
  city: string,
): Promise<{ lat: number; lng: number } | null> {
  const query = [street, city, "Israel"].filter(Boolean).join(", ");
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=il&format=json&limit=1`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "mango-realty.com/1.0 (admin geocoder)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
