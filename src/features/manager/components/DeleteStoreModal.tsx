import Modal from "@/components/ui/Modal";
import { AlertCircle, RefreshCw } from "lucide-react";

interface DeleteStoreModalProps {
  open: boolean;
  storeName: string;
  isHardDelete: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}

export function DeleteStoreModal({
  open,
  storeName,
  isHardDelete,
  onClose,
  onConfirm,
  deleting,
}: DeleteStoreModalProps) {
  return (
    <Modal open={open} title="Xóa cửa hàng" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3 text-red-800">
          <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-500" />
          <div>
            <p className="text-sm font-semibold">
              {isHardDelete
                ? "Cảnh báo: Hành động xóa vĩnh viễn"
                : "Cảnh báo: Tạm ngừng hoạt động chi nhánh"}
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              {isHardDelete
                ? "Xóa vĩnh viễn sẽ xóa hoàn toàn cửa hàng khỏi hệ thống bao gồm cả các liên kết nhân viên và kho hàng. Hành động này KHÔNG THỂ PHỤC HỒI."
                : "Hành động này sẽ tạm dừng mọi hoạt động giao dịch hoặc bán hàng liên quan đến cửa hàng này."}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Bạn có chắc chắn muốn {isHardDelete ? "xóa vĩnh viễn" : "ngừng hoạt động"} cửa hàng{" "}
          <span className="font-bold text-gray-900">{storeName}</span> không?
        </p>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {deleting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Xác nhận"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
