import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { Loader2 } from "lucide-react";
import type { Shop } from "@/features/shop/types/shop";
import { joinOpeningHours, splitOpeningHours } from "@/features/shop/utils/opening-hours";
import AddressLocationFields from "@/features/users/components/AddressLocationFields";
import type { Provinces, District, Ward } from "@/features/users/types/location";

interface StoreFormState {
  ownerUserId: string;
  name: string;
  description: string;
  hotline: string;
  openingHours: string;
  isActive: boolean;
  address: string;
}

interface StoreModalProps {
  open: boolean;
  editingStore: Shop | null;
  onClose: () => void;
  storeForm: StoreFormState;
  onFormChange: (form: StoreFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  addressForm: StoreAddressFormState;
  onAddressFormChange: (form: StoreAddressFormState) => void;
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

interface StoreAddressFormState {
  wardId: string;
  streetAddress: string;
  latitude: number;
  longitude: number;
}

export function StoreModal({
  open,
  editingStore,
  onClose,
  storeForm,
  onFormChange,
  onSubmit,
  submitting,
  addressForm,
  onAddressFormChange,
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
}: StoreModalProps) {
  const initialHours = splitOpeningHours(storeForm.openingHours);
  const [openTime, setOpenTime] = useState(initialHours.open);
  const [closeTime, setCloseTime] = useState(initialHours.close);

  useEffect(() => {
    const nextHours = splitOpeningHours(storeForm.openingHours);
    setOpenTime(nextHours.open);
    setCloseTime(nextHours.close);
  }, [storeForm.openingHours, open]);

  const handleTimeChange = (nextOpen: string, nextClose: string) => {
    const nextOpeningHours = joinOpeningHours(nextOpen, nextClose);
    onFormChange({ ...storeForm, openingHours: nextOpeningHours });
  };

  return (
    <Modal
      open={open}
      title={editingStore ? "Chỉnh sửa thông tin cửa hàng" : "Thêm cửa hàng mới"}
      onClose={onClose}
      size="max-w-2xl"
    >
      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Tên cửa hàng <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={storeForm.name}
            onChange={(e) => onFormChange({ ...storeForm, name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="FengShui Garden - Cơ sở Quận 1"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Mã quản trị chủ cửa hàng (Owner User ID)
          </label>
          <input
            type="text"
            value={storeForm.ownerUserId}
            onChange={(e) => onFormChange({ ...storeForm, ownerUserId: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Nhập GUID tài khoản quản lý..."
          />
        </div>

        <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Địa chỉ cửa hàng</p>
            <p className="text-xs text-gray-500">
              Tỉnh/Thành, Quận/Huyện, Phường/Xã và bản đồ sẽ liên kết hai chiều.
            </p>
          </div>
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
            onStreetAddressChange={(value) =>
              onAddressFormChange({ ...addressForm, streetAddress: value })
            }
            zoomToLocation={zoomToLocation}
            onMapLocationChange={onMapLocationChange}
            isReverseGeocoding={isReverseGeocoding}
            areaTitle="Khu vực"
            streetLabel="Địa chỉ cụ thể"
            streetPlaceholder="Số nhà, tên đường..."
            mapLabel="Vị trí trên bản đồ"
            mapNote="Chạm vào bản đồ để chọn vị trí chính xác của cửa hàng."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Hotline <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={storeForm.hotline}
              onChange={(e) => onFormChange({ ...storeForm, hotline: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="1900 xxxx hoặc 09xx..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Giờ mở cửa</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="time"
                value={openTime}
                onChange={(e) => {
                  setOpenTime(e.target.value);
                  handleTimeChange(e.target.value, closeTime);
                }}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="time"
                value={closeTime}
                onChange={(e) => {
                  setCloseTime(e.target.value);
                  handleTimeChange(openTime, e.target.value);
                }}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-400">Nhập riêng giờ mở và giờ đóng cửa.</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả cửa hàng</label>
          <textarea
            rows={3}
            value={storeForm.description}
            onChange={(e) => onFormChange({ ...storeForm, description: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Nhập mô tả về chi nhánh, diện tích, các loại cây cảnh có sẵn..."
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="isActive"
            checked={storeForm.isActive}
            onChange={(e) => onFormChange({ ...storeForm, isActive: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
          />
          <label htmlFor="isActive" className="text-sm font-semibold text-gray-700 cursor-pointer">
            Cho phép chi nhánh hoạt động ngay lập tức
          </label>
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
            {editingStore ? "Lưu thay đổi" : "Tạo mới"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
