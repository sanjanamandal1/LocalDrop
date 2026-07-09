export type GeocodeResult = {
  lat: string;
  lng: string;
};

export async function geocodeCityState(city: string, state?: string): Promise<GeocodeResult | null> {
  try {
    const query = `${city}${state ? `, ${state}` : ""}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "LocalDrop/1.0 (settings-geolocation; contact@localdrop.app)",
      },
    });
    if (!response.ok) return null;
    const data = await response.json() as { lat: string; lon: string }[];
    if (data && data.length > 0) {
      return {
        lat: data[0].lat,
        lng: data[0].lon,
      };
    }
  } catch (e) {
    console.error("Geocoding lookup failed:", e);
  }
  return null;
}
