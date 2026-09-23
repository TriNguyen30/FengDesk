import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Loader2, UserPlus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useShopStaff } from "@/features/shop/hooks/useShopStaff";
import { ordersApi } from "@/features/orders/api/orders.api";

interface AssignStaffModalProps {
  open: boolean;
  onClose: () => void;
  storeId: string;
  deliveryIds: string[];
}

export function AssignStaffModal({ open, onClose, storeId, deliveryIds }: AssignStaffModalProps) {
  const { staff, isLoading: isStaffLoading } = useShopStaff(storeId);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const queryClient = useQueryClient();

  const { mutate: assignStaff, isPending } = useMutation({
    mutationFn: async (staffId: string) => {
      if (!deliveryIds || deliveryIds.length === 0) {
        throw new Error("Không có đơn hàng nào được chọn");
      }
      const results = await Promise.allSettled(
        deliveryIds.map((id) => ordersApi.assignDeliveryStaff(id, { staffId }))
      );
      const successes = results.filter(
        (r) => r.status === "fulfilled" && (r.value.data.isSuccess || r.value.status === 200)
      );
      if (successes.length === 0) {
        throw new Error("Không thể giao việc cho đơn nào");
      }
      return { successCount: successes.length, total: deliveryIds.length };
    },
    onSuccess: ({ successCount, total }) => {
      if (total === 1) {
        toast.success("Giao việc thành công");
      } else {
        toast.success(`Giao việc thành công ${successCount}/${total} đơn`);
      }
      queryClient.invalidateQueries({ queryKey: ["store-deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      onClose();
      setSelectedStaffId(""); // reset
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Có lỗi xảy ra khi giao việc");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) {
      toast.error("Vui lòng chọn một nhân viên");
      return;
    }
    assignStaff(selectedStaffId);
  };

  return (
    <Modal open={open} onClose={onClose} title="Giao cho nhân viên" size="max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isStaffLoading ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : staff?.length === 0 ? (
          <p className="text-sm text-gray-500">Cửa hàng chưa có nhân viên nào.</p>
        ) : (
          <div>
            <label htmlFor="staff" className="mb-1 block text-sm font-medium text-gray-700">
              Chọn nhân viên
            </label>
            <select
              id="staff"
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            >
              <option value="" disabled>-- Chọn nhân viên --</option>
              {staff?.map((s) => (
                <option key={s.id} value={s.staffId}>
                  {s.staffName} ({s.staffEmail})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isPending || !selectedStaffId || staff?.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Xác nhận
          </button>
        </div>
      </form>
    </Modal>
  );
}
