// ---------------------------------------------------------------------------
// Geocoding utilities – OpenStreetMap Nominatim provider
//
// The public API (geocodeLocation, reverseGeocode, etc.) is provider-agnostic.
// To swap providers, replace the `NominatimProvider` implementation and update
// the thin delegation inside each exported function.
// ---------------------------------------------------------------------------

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

const NOMINATIM_HEADERS: HeadersInit = {
  "Accept-Language": "vi",
  "User-Agent": "FengDeskAI/1.0",
};

// ── Vietnamese text helpers ─────────────────────────────────────────────────

const ADMINISTRATIVE_PREFIXES = [
  "Tỉnh ",
  "Thành phố ",
  "Quận ",
  "Huyện ",
  "Phường ",
  "Xã ",
  "Thị trấn ",
  "Thị xã ",
];

/**
 * Normalize Vietnamese text for fuzzy matching.
 * Remove diacritics, lowercase, trim.
 */
export function normalizeVietnamese(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function stripPrefixes(value: string): string {
  for (const prefix of ADMINISTRATIVE_PREFIXES) {
    if (value.startsWith(prefix)) {
      return value.slice(prefix.length);
    }
  }
  return value;
}

// ── Provider abstraction ────────────────────────────────────────────────────

interface GeocodingProvider {
  geocode(query: string): Promise<{ lat: number; lng: number } | null>;
  reverse(lat: number, lng: number): Promise<ReverseGeocodeResult | null>;
}

// ── Nominatim provider implementation ───────────────────────────────────────

interface NominatimSearchResult {
  lat: string;
  lon: string;
}

interface NominatimAddress {
  state?: string;
  province?: string;
  city?: string;
  city_district?: string;
  county?: string;
  town?: string;
  suburb?: string;
  village?: string;
  quarter?: string;
  neighbourhood?: string;
}

interface NominatimReverseResult {
  display_name?: string;
  address?: NominatimAddress & {
    "ISO3166-2-lvl4"?: string;
  };
}

const ISO_PROVINCE_MAP: Record<string, string> = {
  "VN-SG": "Thành phố Hồ Chí Minh",
  "VN-HN": "Hà Nội",
  "VN-DN": "Thành phố Đà Nẵng",
  "VN-HP": "Thành phố Hải Phòng",
  "VN-CT": "Thành phố Cần Thơ",
};

const NominatimProvider: GeocodingProvider = {
  async geocode(query: string) {
    const url = `${NOMINATIM_BASE}/search?format=json&countrycodes=vn&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: NOMINATIM_HEADERS });

    if (!res.ok) return null;

    const data: NominatimSearchResult[] = await res.json();
    if (!data.length) return null;

    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  },

  async reverse(lat: number, lng: number) {
    const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, { headers: NOMINATIM_HEADERS });

    if (!res.ok) return null;

    const data: NominatimReverseResult = await res.json();
    const addr = data.address;
    if (!addr) return null;

    let province = addr["ISO3166-2-lvl4"] ? ISO_PROVINCE_MAP[addr["ISO3166-2-lvl4"]] : "";
    if (!province) province = addr.state || addr.province || "";
    if (!province && addr.city) province = addr.city;

    let district = addr.city_district || addr.county || addr.town || "";
    // Special handling for cities like TP Thủ Đức inside TP HCM
    if (!district && addr.city && addr.city !== province) {
      district = addr.city;
    }

    let ward = addr.suburb || addr.village || addr.quarter || addr.neighbourhood || "";

    // Fallback to display_name parsing if some components are missing
    if (data.display_name && (!province || !district || !ward)) {
      const parts = data.display_name.split(",").map(p => p.trim());
      const addressParts = parts.filter(p => p !== "Việt Nam" && !/^\d+$/.test(p));
      
      if (!province && addressParts.length >= 1) {
        province = addressParts[addressParts.length - 1];
      }
      if (!district && addressParts.length >= 2) {
        if (addressParts[addressParts.length - 1] === province) {
          district = addressParts[addressParts.length - 2];
        }
      }
      if (!ward && addressParts.length >= 3) {
        if (addressParts[addressParts.length - 1] === province && addressParts[addressParts.length - 2] === district) {
          ward = addressParts[addressParts.length - 3];
        }
      }
    }

    if (!province && !district && !ward) return null;

    return { province, district, ward };
  },
};

// ── Public API ──────────────────────────────────────────────────────────────

export interface ReverseGeocodeResult {
  province: string;
  district: string;
  ward: string;
}

/**
 * Geocode a location name to coordinates.
 * Uses Nominatim API. Restricts to Vietnam (countrycodes=vn).
 * Returns null if not found.
 */
export async function geocodeLocation(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  return NominatimProvider.geocode(query);
}

/**
 * Reverse geocode coordinates to address components.
 * Uses Nominatim Reverse API.
 * Returns province, district, ward names (Vietnamese) or null if not found.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult | null> {
  return NominatimProvider.reverse(lat, lng);
}

/**
 * Find the best matching item from a list by comparing normalized names.
 * Uses normalizeVietnamese for comparison.
 * Returns the matched item's id or empty string if not found.
 */
export function findBestMatch<T extends { id: string; name: string }>(
  items: T[],
  target: string,
): string {
  if (!target || !items.length) return "";

  const normalizedTarget = normalizeVietnamese(target);

  // 1. Exact normalized match
  const exact = items.find(
    (item) => normalizeVietnamese(item.name) === normalizedTarget,
  );
  if (exact) return exact.id;

  // 2. Includes match
  const included = items.find((item) => {
    const normalizedName = normalizeVietnamese(item.name);
    return (
      normalizedName.includes(normalizedTarget) ||
      normalizedTarget.includes(normalizedName)
    );
  });
  if (included) return included.id;

  // 3. Match with common administrative prefixes removed
  const strippedTarget = normalizeVietnamese(stripPrefixes(target));

  const stripped = items.find((item) => {
    const strippedName = normalizeVietnamese(stripPrefixes(item.name));
    return (
      strippedName === strippedTarget ||
      strippedName.includes(strippedTarget) ||
      strippedTarget.includes(strippedName)
    );
  });
  if (stripped) return stripped.id;

  return "";
}
