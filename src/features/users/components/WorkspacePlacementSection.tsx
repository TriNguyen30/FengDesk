import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, PackagePlus, PackageX, Truck } from "lucide-react";
import { getPurchasedItems, placeProduct, removePlacement } from "../api/workspace.api";
import type { PlacedProduct } from "../types/workspace";

interface Props {
  workspaceId: string;
  /** Từ element-analysis (đã fetch ở card) — tránh gọi thêm API. */
  placedProducts: PlacedProduct[];
}

/**
 * "Vật phẩm trong phòng": sản phẩm đã mua đặt vào workspace này + dropdown đặt thêm từ lịch sử mua.
 * Dropdown chỉ hiện món CHƯA đặt phòng nào (mỗi order item nằm tối đa 1 phòng — unique bên BE).
 * Đặt/gỡ → invalidate ["workspace"] → radar (element-analysis) tự tính lại và morph.
 * Hàng chưa giao hiện badge "Đang giao — xem trước" (nằm ở lớp radar nét đứt).
 */
export default function WorkspacePlacementSection({ workspaceId, placedProducts }: Props) {
  const queryClient = useQueryClient();
  const [selecting, setSelecting] = useState("");

  const { data: purchased = [], isLoading } = useQuery({
    queryKey: ["purchased-items"],
    queryFn: getPurchasedItems,
  });

  const invalidate = () => {
    // Radar của MỌI workspace có thể đổi (chuyển phòng ảnh hưởng cả phòng cũ lẫn mới).
    queryClient.invalidateQueries({ queryKey: ["workspace"] });
    queryClient.invalidateQueries({ queryKey: ["purchased-items"] });
  };

  const placeMutation = useMutation({
    mutationFn: (orderItemId: string) => placeProduct(workspaceId, orderItemId),
    onSuccess: (res) => {
      if (res.isSuccess) toast.success(res.message || "Đã đặt sản phẩm vào không gian");
      else toast.error(res.message || "Không đặt được sản phẩm");
      setSelecting("");
      invalidate();
    },
    onError: () => toast.error("Không đặt được sản phẩm"),
  });

  const removeMutation = useMutation({
    mutationFn: (orderItemId: string) => removePlacement(workspaceId, orderItemId),
    onSuccess: (res) => {
      if (res.isSuccess) toast.success(res.message || "Đã gỡ sản phẩm");
      else toast.error(res.message || "Không gỡ được sản phẩm");
      invalidate();
    },
    onError: () => toast.error("Không gỡ được sản phẩm"),
  });

  // Ứng viên để đặt: chỉ những món CHƯA đặt ở bất kỳ phòng nào.
  // Món đang nằm phòng khác không hiện — muốn chuyển phòng thì gỡ ở phòng cũ trước.
  const candidates = purchased.filter((i) => !i.placedWorkspaceProfileId);
  const busy = placeMutation.isPending || removeMutation.isPending;

  return (
    <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <PackagePlus size={13} />
        Sản phẩm đã đặt ({placedProducts.length})
      </p>

      <div className="flex flex-col gap-3 md:flex-row">
        {/* Trái (1/3): chọn sản phẩm đã mua để đặt thêm */}
        <div className="flex shrink-0 flex-col gap-2 md:w-1/3">
          <select
            value={selecting}
            onChange={(e) => setSelecting(e.target.value)}
            disabled={busy || isLoading}
            className="w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-primary focus:outline-none"
          >
            <option value="">
              {isLoading
                ? "Đang tải sản phẩm đã mua..."
                : candidates.length === 0
                  ? "Không có sản phẩm đã mua để đặt"
                  : "— Chọn sản phẩm đã mua để đặt vào phòng —"}
            </option>
            {candidates.map((i) => (
              <option key={i.orderItemId} value={i.orderItemId}>
                {i.productName}
                {i.quantity > 1 ? ` ×${i.quantity}` : ""}
                {!i.isDelivered ? " (đang giao)" : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selecting || busy}
            onClick={() => placeMutation.mutate(selecting)}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <PackagePlus size={13} />}
            Đặt vào
          </button>
          <p className="text-[11px] text-gray-400">
            Đặt sản phẩm đã mua vào phòng để radar ngũ hành phản ánh không gian thực tế. Mỗi món chỉ
            nằm ở một phòng — muốn chuyển phòng, hãy gỡ khỏi phòng cũ trước.
          </p>
        </div>

        {/* Phải (2/3): danh sách vật phẩm đã đặt — cuộn khi dài */}
        <div className="custom-scrollbar max-h-48 min-w-0 flex-1 overflow-y-auto md:w-2/3">
          {placedProducts.length > 0 ? (
        <ul className="space-y-2">
          {placedProducts.map((p) => (
            <li
              key={p.placementId}
              className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 shadow-sm"
            >
              {p.productImage ? (
                <img
                  src={p.productImage}
                  alt={p.productName}
                  className="h-8 w-8 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="h-8 w-8 shrink-0 rounded-md bg-gray-100" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">{p.productName}</p>
                {!p.isDelivered && (
                  <p className="flex items-center gap-1 text-[11px] font-medium text-amber-600">
                    <Truck size={11} />
                    Đang giao - hiển thị dạng xem trước
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => removeMutation.mutate(p.orderItemId)}
                className="shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 cursor-pointer"
                title="Gỡ khỏi phòng"
              >
                <PackageX size={15} />
              </button>
            </li>
          ))}
        </ul>
          ) : (
            <div className="flex h-full min-h-16 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white/60 px-3 py-4 text-xs text-gray-400">
              Chưa có vật phẩm nào trong phòng
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
