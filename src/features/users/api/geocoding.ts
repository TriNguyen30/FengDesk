// ---------------------------------------------------------------------------
// Geocoding utilities – VietMap provider (https://maps.vietmap.vn)
//
// The public API (geocodeLocation, reverseGeocode, etc.) is provider-agnostic.
// To swap providers, replace the `VietMapProvider` implementation and update
// the thin delegation inside each exported function.
// ---------------------------------------------------------------------------

import { VIETMAP_API_KEY } from "@/config/env";

const VIETMAP_BASE = "https://maps.vietmap.vn/api";

// ── Cache (giảm số call VietMap — quota theo ngày) ──────────────────────────
// Geocode theo tên tỉnh/quận/phường và reverse theo tọa độ lặp lại rất nhiều
// trong 1 phiên; cache in-memory + sessionStorage để không đốt quota vô ích.

const CACHE_PREFIX = "vm-cache:";
const memoryCache = new Map<string, unknown>();

function cacheGet<T>(key: string): T | undefined {
  if (memoryCache.has(key)) return memoryCache.get(key) as T;
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (raw !== null) {
      const val = JSON.parse(raw) as T;
      memoryCache.set(key, val);
      return val;
    }
  } catch {
    /* sessionStorage không khả dụng — chỉ dùng memory */
  }
  return undefined;
}

function cacheSet(key: string, value: unknown): void {
  memoryCache.set(key, value);
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    /* đầy quota storage — bỏ qua */
  }
}

// ── Vietnamese text helpers ─────────────────────────────────────────────────

// So khớp trên dạng đã normalize (bỏ dấu + lowercase) nên viết hoa kiểu gì cũng
// khớp — VietMap trả "Thành Phố Hồ Chí Minh" còn DB lưu "Thành phố Hồ Chí Minh".
const ADMINISTRATIVE_PREFIXES = [
  "tinh ",
  "thanh pho ",
  "tp ",
  "quan ",
  "huyen ",
  "phuong ",
  "xa ",
  "thi tran ",
  "thi xa ",
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
    .replace(/\./g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalize rồi bỏ tiền tố hành chính: "Thành Phố Hồ Chí Minh" → "ho chi minh". */
function normalizeWithoutPrefix(value: string): string {
  const normalized = normalizeVietnamese(value);
  for (const prefix of ADMINISTRATIVE_PREFIXES) {
    if (normalized.startsWith(prefix)) {
      return normalized.slice(prefix.length).trim();
    }
  }
  return normalized;
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

function boundaryByType(boundaries: VietMapBoundary[] | undefined, type: 0 | 1 | 2): string {
  const boundary = boundaries?.find((b) => b.type === type);
  if (!boundary) return "";
  return boundary.full_name || `${boundary.prefix ?? ""} ${boundary.name ?? ""}`.trim();
}

/**
 * Lấy 1 cấp hành chính từ danh sách kết quả reverse.
 *
 * Kết quả đầu tiên (gần điểm click nhất) đôi khi thiếu boundary phường hoặc
 * thiếu số nhà. Khi đó lấy từ kết quả kế tiếp, nhưng chỉ chấp nhận kết quả có
 * các cấp cao hơn trùng khớp — tránh nhặt nhầm phường của quận bên cạnh.
 */
function pickBoundary(
  results: VietMapSearchResult[],
  type: 0 | 1 | 2,
  higherLevels: { type: 0 | 1; value: string }[],
): string {
  for (const result of results) {
    const value = boundaryByType(result.boundaries, type);
    if (!value) continue;

    const consistent = higherLevels.every(
      (level) =>
        !level.value ||
        normalizeVietnamese(boundaryByType(result.boundaries, level.type)) ===
          normalizeVietnamese(level.value),
    );
    if (consistent) return value;
  }
  return "";
}

// ── Provider abstraction ────────────────────────────────────────────────────

interface GeocodingProvider {
  geocode(query: string): Promise<{ lat: number; lng: number } | null>;
  reverse(lat: number, lng: number): Promise<ReverseGeocodeResult | null>;
}

// ── VietMap provider implementation ─────────────────────────────────────────

const VietMapProvider: GeocodingProvider = {
  async geocode(query: string) {
    const cacheKey = `geo:${query}`;
    const cached = cacheGet<{ lat: number; lng: number } | null>(cacheKey);
    if (cached !== undefined) return cached;

    // VietMap search/v3 returns ref_id only; place/v3 resolves coordinates.
    const results = await vietmapSearch(query);
    if (!results.length) return null; // không cache lỗi/quota — thử lại lần sau

    const place = await vietmapPlace(results[0].ref_id);
    if (!place) return null;

    const coords = { lat: place.lat, lng: place.lng };
    cacheSet(cacheKey, coords);
    return coords;
  },

  async reverse(lat: number, lng: number) {
    // Làm tròn ~1m để tăng cache hit khi click quanh cùng 1 điểm
    const cacheKey = `rev:${lat.toFixed(5)},${lng.toFixed(5)}`;
    const cached = cacheGet<ReverseGeocodeResult>(cacheKey);
    if (cached !== undefined) return cached;

    const url = `${VIETMAP_BASE}/reverse/v3?apikey=${VIETMAP_API_KEY}&lat=${lat}&lng=${lng}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 429) console.warn("[VietMap] Hết quota ngày (429) — reverse geocode tạm không khả dụng.");
      return null;
    }

    const data: VietMapSearchResult[] = await res.json();
    if (!Array.isArray(data) || !data.length) return null;

    const province = pickBoundary(data, 0, []);
    const district = pickBoundary(data, 1, [{ type: 0, value: province }]);
    const ward = pickBoundary(data, 2, [
      { type: 0, value: province },
      { type: 1, value: district },
    ]);

    if (!province && !district && !ward) return null;

    // `name` giữ số nhà + tên đường (vd. "948 Trường Chinh"); kết quả gần nhất
    // có thể chỉ là một boundary không tên → lấy kết quả đầu tiên có `name`.
    const street = data.find((r) => r.name?.trim())?.name?.trim() ?? "";

    const result = { province, district, ward, street };
    cacheSet(cacheKey, result);
    return result;
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
  const cacheKey = `place:${refId}`;
  const cached = cacheGet<VietMapPlaceResult>(cacheKey);
  if (cached !== undefined) return cached;

  const url = `${VIETMAP_BASE}/place/v3?apikey=${VIETMAP_API_KEY}&refid=${encodeURIComponent(refId)}`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 429) console.warn("[VietMap] Hết quota ngày (429) — place lookup tạm không khả dụng.");
    return null;
  }
  const data: VietMapPlaceResult = await res.json();
  cacheSet(cacheKey, data);
  return data;
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

  // 1. Trùng khít sau khi normalize
  const exact = items.find((item) => normalizeVietnamese(item.name) === normalizedTarget);
  if (exact) return exact.id;

  // 2. Trùng khít sau khi bỏ tiền tố hành chính ("Quận 1" ↔ "1", "TP HCM" ↔ "Hồ Chí Minh")
  const strippedTarget = normalizeWithoutPrefix(target);
  const stripped = items.find((item) => normalizeWithoutPrefix(item.name) === strippedTarget);
  if (stripped) return stripped.id;

  // 3. Khớp một phần — chỉ khi cả hai vế đều KHÔNG thuần số. Với đơn vị hành
  //    chính đánh số ("Phường 1" vs "Phường 12", "Quận 3" vs "Quận 3B") thì
  //    substring luôn khớp sai, thà bỏ trống cho user tự chọn còn hơn điền bậy.
  const isNumeric = (value: string) => /^\d+$/.test(value);
  if (isNumeric(strippedTarget)) return "";

  const included = items.find((item) => {
    const strippedName = normalizeWithoutPrefix(item.name);
    if (!strippedName || isNumeric(strippedName)) return false;
    return strippedName.includes(strippedTarget) || strippedTarget.includes(strippedName);
  });
  if (included) return included.id;

  return "";
}
