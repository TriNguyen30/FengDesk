import React from "react";
import Modal from "@/components/ui/Modal";
import { RefreshCw } from "lucide-react";
import type { Shop } from "@shop/types/shop";

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
}

export function StoreModal({
  open,
  editingStore,
  onClose,
  storeForm,
  onFormChange,
  onSubmit,
  submitting,
}: StoreModalProps) {
  return (
    <Modal
      open={open}
      title={editingStore ? "Chỉnh sửa thông tin cửa hàng" : "Thêm cửa hàng mới"}
      onClose={onClose}
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
            <input
              type="text"
              value={storeForm.openingHours}
              onChange={(e) => onFormChange({ ...storeForm, openingHours: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="08:00 - 21:00 hàng ngày"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Địa chỉ hiển thị</label>
          <input
            type="text"
            value={storeForm.address}
            onChange={(e) => onFormChange({ ...storeForm, address: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Số 12, Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. HCM"
          />
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
            {submitting && <RefreshCw size={14} className="animate-spin" />}
            {editingStore ? "Lưu thay đổi" : "Tạo mới"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
