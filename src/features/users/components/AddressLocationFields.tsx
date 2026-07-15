import { Loader2 } from "lucide-react";
import LocationPickerMap from "./LocationPickerMap";
import type { District, Provinces, Ward } from "../types/location";

interface AddressLocationFieldsProps {
  streetAddress: string;
  wardId: string;
  latitude: number;
  longitude: number;
  provinces: Provinces[];
  districts: District[];
  wards: Ward[];
  selectedProvinceId: string;
  selectedDistrictId: string;
  selectedWardId: string;
  onProvinceChange: (id: string) => void;
  onDistrictChange: (id: string) => void;
  onWardChange: (id: string) => void;
  onStreetAddressChange: (value: string) => void;
  zoomToLocation?: { lat: number; lng: number; zoom: number } | null;
  onMapLocationChange?: (lat: number, lng: number) => void;
  isReverseGeocoding?: boolean;
  areaTitle?: string;
  streetLabel?: string;
  streetPlaceholder?: string;
  mapLabel?: string;
  mapNote?: string;
}

export default function AddressLocationFields({
  streetAddress,
  latitude,
  longitude,
  provinces,
  districts,
  wards,
  selectedProvinceId,
  selectedDistrictId,
  selectedWardId,
  onProvinceChange,
  onDistrictChange,
  onWardChange,
  onStreetAddressChange,
  zoomToLocation,
  onMapLocationChange,
  isReverseGeocoding,
  areaTitle = "Khu vực",
  streetLabel = "Địa chỉ cụ thể",
  streetPlaceholder = "Số nhà, tên đường...",
  mapLabel = "Vị trí trên bản đồ",
  mapNote = "Chạm/Click lên bản đồ để di chuyển ghim định vị đến vị trí chính xác.",
}: AddressLocationFieldsProps) {
  const handleMapChange = (lat: number, lng: number) => {
    onMapLocationChange?.(lat, lng);
  };

  return (
    <>
      <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{areaTitle}</h3>
          {isReverseGeocoding && (
            <span className="flex items-center gap-1.5 text-xs text-primary">
              <Loader2 size={12} className="animate-spin" />
              Đang xác định địa chỉ...
            </span>
          )}
        </div>

        <select
          value={selectedProvinceId}
          onChange={(e) => onProvinceChange(e.target.value)}
          className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Chọn Tỉnh/Thành</option>
          {provinces.map((province) => (
            <option key={province.id} value={province.id}>
              {province.name}
            </option>
          ))}
        </select>

        <select
          value={selectedDistrictId}
          onChange={(e) => onDistrictChange(e.target.value)}
          disabled={!selectedProvinceId}
          className="w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100 disabled:opacity-70"
        >
          <option value="">Chọn Quận/Huyện</option>
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </select>

        <select
          value={selectedWardId}
          onChange={(e) => onWardChange(e.target.value)}
          disabled={!selectedDistrictId}
          className="w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100 disabled:opacity-70"
        >
          <option value="">Chọn Phường/Xã</option>
          {wards.map((ward) => (
            <option key={ward.id} value={ward.id}>
              {ward.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">{streetLabel}</label>
        <input
          type="text"
          required
          value={streetAddress}
          onChange={(e) => onStreetAddressChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder={streetPlaceholder}
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-semibold text-gray-700">{mapLabel}</label>
        <LocationPickerMap
          latitude={latitude}
          longitude={longitude}
          onChange={handleMapChange}
          zoomToLocation={zoomToLocation}
        />
        <p className="mt-1 text-[10px] text-gray-400">{mapNote}</p>
      </div>
    </>
  );
}
