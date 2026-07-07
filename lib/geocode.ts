/**
 * Geocode an Israeli address.
 * Primary: Google Geocoding API (better Hebrew support, requires NEXT_PUBLIC_GOOGLE_MAPS_KEY).
 * Fallback: Nominatim (OpenStreetMap) — free, no key.
 */

async function geocodeWithGoogle(
  street: string,
  city: string,
  key: string,
): Promise<{ lat: number; lng: number } | null> {
  const address = [street, city, "Israel"].filter(Boolean).join(", ");
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=il&language=he&key=${key}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "OK" || !data.results?.[0]) return null;
    const loc = data.results[0].geometry.location;
    return { lat: loc.lat, lng: loc.lng };
  } catch {
    return null;
  }
}

async function geocodeWithNominatim(
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

export async function geocodeIsraeliAddress(
  street: string,
  city: string,
): Promise<{ lat: number; lng: number } | null> {
  // Try Google first — much better coverage for Israeli Hebrew streets
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  if (googleKey) {
    const result = await geocodeWithGoogle(street, city, googleKey);
    if (result) return result;
  }
  // Fallback: Nominatim (OpenStreetMap), free, no key required
  return geocodeWithNominatim(street, city);
}
