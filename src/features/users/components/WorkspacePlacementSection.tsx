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
 * Đặt/gỡ/chuyển phòng → invalidate ["workspace"] → radar (element-analysis) tự tính lại và morph.
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

  // Ứng viên để đặt: mọi món đã mua CHƯA nằm trong phòng này (nằm phòng khác → chọn = chuyển phòng).
  const candidates = purchased.filter((i) => i.placedWorkspaceProfileId !== workspaceId);
  const busy = placeMutation.isPending || removeMutation.isPending;

  return (
    <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <PackagePlus size={13} />
        Vật phẩm trong phòng ({placedProducts.length})
      </p>

      {placedProducts.length > 0 && (
        <ul className="mb-3 space-y-2">
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
                    Đang giao — hiển thị dạng xem trước
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
      )}

      <div className="flex gap-2">
        <select
          value={selecting}
          onChange={(e) => setSelecting(e.target.value)}
          disabled={busy || isLoading}
          className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-primary focus:outline-none"
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
              {!i.isDelivered ? " (đang giao)" : ""}
              {i.placedWorkspaceName ? ` — đang ở "${i.placedWorkspaceName}"` : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!selecting || busy}
          onClick={() => placeMutation.mutate(selecting)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <PackagePlus size={13} />}
          Đặt vào
        </button>
      </div>
      <p className="mt-2 text-[11px] text-gray-400">
        Đặt sản phẩm đã mua vào phòng để radar ngũ hành phản ánh không gian thực tế. Chọn món đang ở
        phòng khác sẽ chuyển nó sang phòng này.
      </p>
    </div>
  );
}
