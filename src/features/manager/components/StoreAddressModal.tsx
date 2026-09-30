import React from "react";
import Modal from "@/components/ui/Modal";
import { Loader2 } from "lucide-react";
import AddressLocationFields from "@/features/users/components/AddressLocationFields";
import type { Provinces, District, Ward } from "@/features/users/types/location";
import type { StoreAddress } from "@/features/shop/types/shop";

interface AddressFormState {
  wardId: string;
  streetAddress: string;
  latitude: number;
  longitude: number;
  /** Tên người gửi cho nhà vận chuyển. Bỏ trống → BE dùng tên cửa hàng. */
  senderName: string;
  /** SĐT người gửi. Bắt buộc khi hotline cửa hàng không phải di động (1900/số cố định). */
  senderPhone: string;
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

        {/* Người gửi cho nhà vận chuyển — GHN không nhận hotline 1900/số cố định, thiếu SĐT di động
            ở đây thì cửa hàng không được cấp mã shop và không tạo được vận đơn. */}
        <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
          <p className="text-sm font-semibold text-gray-700">Người gửi cho nhà vận chuyển</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Tên người gửi</label>
              <input
                type="text"
                value={addressForm.senderName}
                onChange={(e) => onFormChange({ ...addressForm, senderName: e.target.value })}
                placeholder="Bỏ trống để dùng tên cửa hàng"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">
                SĐT người gửi <span className="text-gray-400">(di động 10 số)</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                value={addressForm.senderPhone}
                onChange={(e) => onFormChange({ ...addressForm, senderPhone: e.target.value })}
                placeholder="Ví dụ: 0912345678"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Nhà vận chuyển chỉ nhận số di động. Nếu hotline cửa hàng là đầu số 1900 hoặc số cố định
            thì bắt buộc nhập SĐT ở đây, nếu không cửa hàng sẽ không tạo được vận đơn.
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
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Lưu địa chỉ
          </button>
        </div>
      </form>
    </Modal>
  );
}
