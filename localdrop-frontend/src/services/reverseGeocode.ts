export type ReverseGeocodeResult = {
  city?: string;
  state?: string;
  address?: string;
  displayName?: string;
};

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "LocalDrop/1.0 (settings-geolocation; contact@localdrop.app)",
    },
  });

  if (!response.ok) {
    throw new Error("Reverse geocoding failed.");
  }

  const data = await response.json() as {
    display_name?: string;
    address?: {
      city?: string;
      town?: string;
      village?: string;
      state?: string;
      state_district?: string;
      road?: string;
      suburb?: string;
      postcode?: string;
    };
  };

  const addr = data.address || {};
  const city = addr.city || addr.town || addr.village || addr.suburb || undefined;
  const state = addr.state || addr.state_district || undefined;
  const parts = [addr.road, addr.suburb, city, addr.postcode].filter(Boolean);

  return {
    city,
    state,
    address: parts.length > 0 ? parts.join(", ") : data.display_name,
    displayName: data.display_name,
  };
}
