// ---------------------------------------------------------------------------
// Geocoding utilities – VietMap provider (https://maps.vietmap.vn)
//
// The public API (geocodeLocation, reverseGeocode, etc.) is provider-agnostic.
// To swap providers, replace the `VietMapProvider` implementation and update
// the thin delegation inside each exported function.
// ---------------------------------------------------------------------------

import { VIETMAP_API_KEY } from "@/config/env";

const VIETMAP_BASE = "https://maps.vietmap.vn/api";

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

// ── VietMap API types ───────────────────────────────────────────────────────

/** boundaries[].type: 0 = province/city, 1 = district, 2 = ward */
interface VietMapBoundary {
  type: 0 | 1 | 2;
  id: number;
  name: string;
  prefix: string;
  full_name: string;
}

export interface VietMapSearchResult {
  ref_id: string;
  address: string;
  name: string;
  display: string;
  boundaries: VietMapBoundary[];
}

interface VietMapPlaceResult {
  lat: number;
  lng: number;
  display: string;
  name: string;
  hs_num: string;
  street: string;
  city: string;
  district: string;
  ward: string;
}

function boundaryByType(boundaries: VietMapBoundary[], type: 0 | 1 | 2): string {
  return boundaries.find((b) => b.type === type)?.full_name ?? "";
}

// ── Provider abstraction ────────────────────────────────────────────────────

interface GeocodingProvider {
  geocode(query: string): Promise<{ lat: number; lng: number } | null>;
  reverse(lat: number, lng: number): Promise<ReverseGeocodeResult | null>;
}

// ── VietMap provider implementation ─────────────────────────────────────────

const VietMapProvider: GeocodingProvider = {
  async geocode(query: string) {
    // VietMap search/v3 returns ref_id only; place/v3 resolves coordinates.
    const results = await vietmapSearch(query);
    if (!results.length) return null;

    const place = await vietmapPlace(results[0].ref_id);
    if (!place) return null;

    return { lat: place.lat, lng: place.lng };
  },

  async reverse(lat: number, lng: number) {
    const url = `${VIETMAP_BASE}/reverse/v3?apikey=${VIETMAP_API_KEY}&lat=${lat}&lng=${lng}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data: VietMapSearchResult[] = await res.json();
    if (!data.length) return null;

    const first = data[0];
    const province = boundaryByType(first.boundaries, 0);
    const district = boundaryByType(first.boundaries, 1);
    const ward = boundaryByType(first.boundaries, 2);

    if (!province && !district && !ward) return null;

    // `name` holds house number + street (e.g. "948 Trường Chinh")
    return { province, district, ward, street: first.name || "" };
  },
};

// ── Public API ──────────────────────────────────────────────────────────────

export interface ReverseGeocodeResult {
  province: string;
  district: string;
  ward: string;
  /** House number + street name, e.g. "948 Trường Chinh". May be empty. */
  street?: string;
}

/**
 * Search places (VietMap search/v3). Returns candidates without coordinates;
 * resolve coordinates via getPlaceCoordinates(ref_id).
 */
export async function vietmapSearch(
  query: string,
  focus?: { lat: number; lng: number },
): Promise<VietMapSearchResult[]> {
  let url = `${VIETMAP_BASE}/search/v3?apikey=${VIETMAP_API_KEY}&text=${encodeURIComponent(query)}`;
  if (focus) url += `&focus=${focus.lat},${focus.lng}`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data: VietMapSearchResult[] = await res.json();
  return Array.isArray(data) ? data : [];
}

/** Autocomplete variant (VietMap autocomplete/v3) – same shape as search. */
export async function vietmapAutocomplete(
  query: string,
  focus?: { lat: number; lng: number },
): Promise<VietMapSearchResult[]> {
  let url = `${VIETMAP_BASE}/autocomplete/v3?apikey=${VIETMAP_API_KEY}&text=${encodeURIComponent(query)}`;
  if (focus) url += `&focus=${focus.lat},${focus.lng}`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data: VietMapSearchResult[] = await res.json();
  return Array.isArray(data) ? data : [];
}

/** Resolve a search/autocomplete ref_id to coordinates (VietMap place/v3). */
export async function getPlaceCoordinates(
  refId: string,
): Promise<{ lat: number; lng: number } | null> {
  const place = await vietmapPlace(refId);
  return place ? { lat: place.lat, lng: place.lng } : null;
}

async function vietmapPlace(refId: string): Promise<VietMapPlaceResult | null> {
  const url = `${VIETMAP_BASE}/place/v3?apikey=${VIETMAP_API_KEY}&refid=${encodeURIComponent(refId)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

/**
 * Geocode a location name to coordinates.
 * Returns null if not found.
 */
export async function geocodeLocation(query: string): Promise<{ lat: number; lng: number } | null> {
  return VietMapProvider.geocode(query);
}

/**
 * Reverse geocode coordinates to address components.
 * Returns province, district, ward names (Vietnamese) + street, or null.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult | null> {
  return VietMapProvider.reverse(lat, lng);
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
  const exact = items.find((item) => normalizeVietnamese(item.name) === normalizedTarget);
  if (exact) return exact.id;

  // 2. Includes match
  const included = items.find((item) => {
    const normalizedName = normalizeVietnamese(item.name);
    return normalizedName.includes(normalizedTarget) || normalizedTarget.includes(normalizedName);
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
