import React from "react";
import Modal from "@/components/ui/Modal";
import { Loader2, RefreshCw } from "lucide-react";
import LocationPickerMap from "@/features/users/components/LocationPickerMap";
import type { Provinces, District, Ward } from "@/features/users/types/location";
import type { StoreAddress } from "@shop/types/shop";

interface AddressFormState {
  wardId: string;
  streetAddress: string;
  recipientName: string;
  recipientPhone: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  label: string;
}

interface StoreAddressModalProps {
  open: boolean;
  editingAddress: StoreAddress | null;
  onClose: () => void;
  addressForm: AddressFormState;
  onFormChange: (form: AddressFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  provinces: Provinces[];
  districts: District[];
  wards: Ward[];
  selectedProvinceId: string;
  onProvinceChange: (id: string) => void;
  selectedDistrictId: string;
  onDistrictChange: (id: string) => void;
  selectedWardId: string;
  onWardChange: (id: string) => void;
  zoomToLocation?: { lat: number; lng: number; zoom: number } | null;
  onMapLocationChange?: (lat: number, lng: number) => void;
  isReverseGeocoding?: boolean;
}

export function StoreAddressModal({
  open,
  editingAddress,
  onClose,
  addressForm,
  onFormChange,
  onSubmit,
  submitting,
  provinces,
  districts,
  wards,
  selectedProvinceId,
  onProvinceChange,
  selectedDistrictId,
  onDistrictChange,
  selectedWardId,
  onWardChange,
  zoomToLocation,
  onMapLocationChange,
  isReverseGeocoding,
}: StoreAddressModalProps) {
  const handleMapChange = (lat: number, lng: number) => {
    if (onMapLocationChange) {
      onMapLocationChange(lat, lng);
    } else {
      onFormChange({ ...addressForm, latitude: lat, longitude: lng });
    }
  };

  return (
    <Modal
      open={open}
      title={editingAddress ? "Chỉnh sửa địa chỉ chi tiết" : "Thiết lập địa chỉ chi tiết"}
      onClose={onClose}
      size="max-w-2xl"
    >
      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tên người liên hệ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={addressForm.recipientName}
              onChange={(e) => onFormChange({ ...addressForm, recipientName: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Họ tên người nhận hàng tại kho..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Số điện thoại liên hệ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={addressForm.recipientPhone}
              onChange={(e) => onFormChange({ ...addressForm, recipientPhone: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Số điện thoại nhận hàng..."
            />
          </div>
        </div>

        <div className="space-y-3 rounded-lg bg-gray-50 p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Khu vực địa lý
            </h4>
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
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="">Chọn Tỉnh/Thành</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={selectedDistrictId}
            onChange={(e) => onDistrictChange(e.target.value)}
            disabled={!selectedProvinceId}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100 disabled:opacity-75 cursor-pointer"
          >
            <option value="">Chọn Quận/Huyện</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedWardId}
            onChange={(e) => onWardChange(e.target.value)}
            disabled={!selectedDistrictId}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100 disabled:opacity-75 cursor-pointer"
          >
            <option value="">Chọn Phường/Xã</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Số nhà, tên đường cụ thể <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={addressForm.streetAddress}
            onChange={(e) => onFormChange({ ...addressForm, streetAddress: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Ví dụ: Số 123 Lê Lợi..."
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-semibold text-gray-700">Tọa độ trên bản đồ</label>
          <LocationPickerMap
            latitude={addressForm.latitude}
            longitude={addressForm.longitude}
            onChange={handleMapChange}
            zoomToLocation={zoomToLocation}
          />
          <p className="text-[10px] text-gray-400 mt-1">
            Chạm/Click lên bản đồ để di chuyển ghim định vị đến vị trí chính xác của cửa hàng.
          </p>
        </div>

        <div className="flex gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {submitting && <RefreshCw size={14} className="animate-spin" />}
            Lưu địa chỉ
          </button>
        </div>
      </form>
    </Modal>
  );
}
