import React from "react";
import Modal from "@/components/ui/Modal";
import { RefreshCw } from "lucide-react";
import AddressLocationFields from "@/features/users/components/AddressLocationFields";
import type { Provinces, District, Ward } from "@/features/users/types/location";
import type { StoreAddress } from "@/features/shop/types/shop";

interface AddressFormState {
  wardId: string;
  streetAddress: string;
  latitude: number;
  longitude: number;
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
        <AddressLocationFields
          streetAddress={addressForm.streetAddress}
          wardId={addressForm.wardId}
          latitude={addressForm.latitude}
          longitude={addressForm.longitude}
          provinces={provinces}
          districts={districts}
          wards={wards}
          selectedProvinceId={selectedProvinceId}
          selectedDistrictId={selectedDistrictId}
          selectedWardId={selectedWardId}
          onProvinceChange={onProvinceChange}
          onDistrictChange={onDistrictChange}
          onWardChange={onWardChange}
          onStreetAddressChange={(value) => onFormChange({ ...addressForm, streetAddress: value })}
          zoomToLocation={zoomToLocation}
          onMapLocationChange={handleMapChange}
          isReverseGeocoding={isReverseGeocoding}
          areaTitle="Khu vực địa lý"
          streetLabel="Số nhà, tên đường cụ thể"
          streetPlaceholder="Ví dụ: Số 123 Lê Lợi..."
          mapLabel="Tọa độ trên bản đồ"
          mapNote="Chạm/Click lên bản đồ để di chuyển ghim định vị đến vị trí chính xác của cửa hàng."
        />

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
