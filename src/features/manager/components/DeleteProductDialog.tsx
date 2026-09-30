import { useState } from "react";
import { AlertCircle, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useDeactivateProduct, useDeleteProduct } from "@/features/products/hooks/useProducts";

interface DeleteProductDialogProps {
  /** null = đóng. */
  product: { id: string; name: string } | null;
  onClose: () => void;
  /** Gọi sau khi xoá hoặc ngừng bán thành công — để trang tải lại danh sách. */
  onDone?: () => void;
  /** Manager: xoá VĨNH VIỄN (xoá cứng). Mặc định: người bán xoá mềm. */
  permanent?: boolean;
}

/** Lỗi axios mang message tiếng Việt của BE trong phong bì — lấy đúng lý do BE trả (vd 409 "đã có đơn hàng"). */
function apiError(error: unknown): { status?: number; message?: string } {
  const response = (error as { response?: { status?: number; data?: { message?: string } } })
    ?.response;
  return { status: response?.status, message: response?.data?.message };
}

/**
 * Xác nhận xoá sản phẩm. Người bán: xoá mềm. Manager (`permanent`): xoá vĩnh viễn. Đơn cũ và đánh giá luôn giữ đủ
 * nội dung (BE chụp lúc đặt). Còn đơn chưa đóng thì BE trả 409 — hộp thoại chuyển sang đề xuất "Ngừng bán".
 */
export function DeleteProductDialog({
  product,
  onClose,
  onDone,
  permanent = false,
}: DeleteProductDialogProps) {
  const deleteProduct = useDeleteProduct(permanent);
  const deactivate = useDeactivateProduct();
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const busy = deleteProduct.isPending || deactivate.isPending;

  const close = () => {
    if (busy) return;
    setBlockedReason(null);
    onClose();
  };

  const handleDelete = async () => {
    if (!product) return;
    try {
      const res = await deleteProduct.mutateAsync(product.id);
      if (!res.data.isSuccess) {
        toast.error(res.data.message || "Không xóa được sản phẩm");
        return;
      }
      toast.success(
        permanent ? `Đã xóa vĩnh viễn ${product.name}` : `Đã xóa sản phẩm ${product.name}`,
      );
      onDone?.();
      close();
    } catch (err) {
      const { status, message } = apiError(err);
      if (status === 409) setBlockedReason(message ?? "Sản phẩm đã có đơn hàng nên không thể xóa.");
      else toast.error(message || "Không xóa được sản phẩm");
    }
  };

  const handleDeactivate = async () => {
    if (!product) return;
    try {
      await deactivate.mutateAsync(product.id);
      toast.success(`Đã ngừng bán ${product.name}`);
      onDone?.();
      setBlockedReason(null);
      onClose();
    } catch (err) {
      toast.error(apiError(err).message || "Không ngừng bán được sản phẩm");
    }
  };

  return (
    <Modal
      open={product !== null}
      title={
        blockedReason
          ? "Chưa xóa được sản phẩm"
          : permanent
            ? "Xóa vĩnh viễn sản phẩm"
            : "Xóa sản phẩm"
      }
      onClose={close}
    >
      {product && (
        <div className="space-y-4" data-testid="delete-product-dialog">
          {blockedReason ? (
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3 text-amber-900">
              <AlertCircle size={20} className="mt-0.5 shrink-0 text-amber-500" />
              <p className="text-sm">{blockedReason}</p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3 text-red-800">
                <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
                <div>
                  <p className="text-sm font-semibold">
                    {permanent
                      ? "Xóa vĩnh viễn — không thể khôi phục"
                      : "Sản phẩm sẽ bị ẩn hoàn toàn"}
                  </p>
                  <p className="mt-0.5 text-xs text-red-700">
                    {permanent
                      ? "Xóa hẳn sản phẩm, biến thể, ảnh và gỡ khỏi giỏ hàng của khách. Đơn hàng cũ và đánh giá vẫn giữ đủ tên, ảnh, giá."
                      : "Sản phẩm và các biến thể biến mất khỏi cửa hàng và giỏ hàng của khách. Đơn hàng cũ vẫn giữ đủ thông tin."}{" "}
                    Sản phẩm còn đơn chưa hoàn tất thì chưa xóa được.
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Bạn có chắc muốn {permanent ? "xóa vĩnh viễn" : "xóa"} sản phẩm{" "}
                <span className="font-bold text-gray-900">{product.name}</span>?
              </p>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={close}
              disabled={busy}
              className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
            >
              {blockedReason ? "Đóng" : "Hủy"}
            </button>
            {blockedReason ? (
              <button
                onClick={handleDeactivate}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
              >
                {deactivate.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <EyeOff size={14} />
                )}
                Ngừng bán
              </button>
            ) : (
              <button
                onClick={handleDelete}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {deleteProduct.isPending && <Loader2 size={14} className="animate-spin" />}
                Xác nhận xóa
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
