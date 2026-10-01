import { Link, useMatch } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowRightLeft,
  Eye,
  Loader2,
  PackageCheck,
  PackagePlus,
  PackageX,
  Truck,
} from "lucide-react";
import { getPurchasedItems, placeProduct, removePlacement } from "../api/workspace.api";
import type { PurchasedItem } from "../types/workspace";
import { useWorkspaceElementAnalysis, useWorkspaces } from "../hooks/useWorkspace";
import { resolveSelectedWorkspace } from "../utils/selectWorkspace";
import { useProductHoverIntent } from "../context/WorkspaceHoverContext";

/**
 * Panel "Đã mua" ở SIDEBAR hồ sơ (dưới card "Hồ sơ", chỉ khi đang ở tab workspace): đặt/gỡ/chuyển
 * sản phẩm đã mua vào phòng. "Đề xuất" đã chuyển sang nội dung chính (WorkspaceRecommendationPicker)
 * vì cần chỗ cho chọn nhiều món + số lượng. Tự suy ra phòng đang xem từ URL bằng đúng quy tắc của
 * trang chính. Hover một món CHƯA nằm trong phòng → context → radar bên
 * nội dung vẽ lớp xem trước (previewCurrent từ `GET /recommendations/fit`). Món đã ở trong phòng thì
 * không xem trước — nó đã nằm trong "Hiện tại". Món đang ở phòng khác có nút "Chuyển" (PUT placements
 * tự gỡ khỏi phòng cũ). Đặt/gỡ/chuyển → invalidate ["workspace"] → radar + đề xuất tự tính lại.
 */
export default function WorkspaceProductPanel() {
  const { workspaces } = useWorkspaces();
  const match = useMatch("/profile/workspace/:workspaceId");
  const selected = resolveSelectedWorkspace(workspaces, match?.params.workspaceId);
  if (!selected) return null;
  return <ProductPanelBody workspaceId={selected.id} />;
}

/**
 * Tách thân ra để tránh hook có điều kiện. KHÔNG `key={workspaceId}`: đổi phòng chỉ đổi prop, panel
 * giữ nguyên DOM/scroll — remount là thứ gây "giật" mỗi lần bấm phòng khác trên sidebar.
 */
function ProductPanelBody({ workspaceId }: { workspaceId: string }) {
  const reduceMotion = useReducedMotion();
  const { hovered, beginHover, endHover } = useProductHoverIntent();
  // Chỉ để dọn vật phẩm "mồ côi" (xem `orphans` bên dưới) — trạng thái đặt/chưa đặt của các dòng
  // chính đọc từ danh sách đã mua, không chờ query này.
  const { analysis } = useWorkspaceElementAnalysis(workspaceId);
  const queryClient = useQueryClient();

  const { data: purchased = [], isLoading: purchasedLoading } = useQuery({
    queryKey: ["purchased-items"],
    queryFn: getPurchasedItems,
  });

  const invalidate = () => {
    // Radar của MỌI workspace có thể đổi (chuyển phòng ảnh hưởng cả phòng cũ lẫn mới).
    queryClient.invalidateQueries({ queryKey: ["workspace"] });
    queryClient.invalidateQueries({ queryKey: ["purchased-items"] });
  };

  // PUT placements đặt HOẶC chuyển từ phòng khác — cùng một endpoint, chỉ khác lời báo.
  const placeMutation = useMutation({
    mutationFn: ({ orderItemId }: { orderItemId: string; moving: boolean }) =>
      placeProduct(workspaceId, orderItemId),
    onSuccess: (res, { moving }) => {
      const okText = moving
        ? "Đã chuyển sản phẩm sang phòng này"
        : "Đã đặt sản phẩm vào không gian";
      const failText = moving ? "Không chuyển được sản phẩm" : "Không đặt được sản phẩm";
      if (res.isSuccess) toast.success(res.message || okText);
      else toast.error(res.message || failText);
      endHover();
      invalidate();
    },
    onError: (_, { moving }) =>
      toast.error(moving ? "Không chuyển được sản phẩm" : "Không đặt được sản phẩm"),
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

  const busy = placeMutation.isPending || removeMutation.isPending;

  // Vật phẩm đang nằm trong phòng nhưng KHÔNG còn trong danh sách đặt phòng — điển hình là đồ Carry
  // đặt từ trước khi backend lọc theo `ProductPlacement`. Không hiện thì chúng vẫn kéo radar mà user
  // không có cách nào gỡ.
  const purchasedIds = new Set(purchased.map((i) => i.orderItemId));
  const orphans = (analysis?.placedProducts ?? []).filter((p) => !purchasedIds.has(p.orderItemId));

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-gray-100/90 bg-white/95 shadow-sm backdrop-blur-sm transition-all duration-300 ease-out hover:shadow-md hover:border-gray-200"
    >
      <div className="flex items-center gap-1.5 border-b border-gray-100 px-4 py-2.5 text-xs font-semibold text-gray-800">
        <PackageCheck size={13} className="text-primary" />
        Đã mua
        <Count value={purchased.length} />
      </div>

      <div className="custom-scrollbar max-h-72 scroll-fade overflow-y-auto p-2">
        {purchasedLoading ? (
          <ListSkeleton />
        ) : purchased.length === 0 && orphans.length === 0 ? (
          <EmptyRow>Bạn chưa mua sản phẩm nào đặt được vào phòng.</EmptyRow>
        ) : (
          <ul className="space-y-1">
            {purchased.map((item) => {
              // Vị trí đọc từ chính danh sách đã mua (không chờ element-analysis của phòng mới tải
              // xong) — nhờ vậy đổi phòng không có khung hình nào mọi món "chưa đặt" rồi mới đúng lại.
              const inThisRoom = item.placedWorkspaceProfileId === workspaceId;
              const elsewhere = !inThisRoom && !!item.placedWorkspaceProfileId;
              // Món ở phòng khác vẫn xem trước được: chuyển sang đây thì phòng này nhận thêm nó.
              const canPreview = !inThisRoom;
              return (
                <ProductRow
                  key={item.orderItemId}
                  image={item.productImage}
                  name={item.productName}
                  productId={item.productId}
                  active={hovered?.productId === item.productId}
                  previewable={canPreview}
                  onEnter={
                    canPreview
                      ? () => beginHover({ productId: item.productId, label: item.productName })
                      : undefined
                  }
                  onLeave={endHover}
                  status={<PurchasedStatus item={item} inThisRoom={inThisRoom} />}
                  action={
                    inThisRoom ? (
                      <RowButton
                        tone="ghost"
                        icon={PackageX}
                        busy={busy}
                        onClick={() => removeMutation.mutate(item.orderItemId)}
                        title="Gỡ khỏi phòng này"
                      >
                        Gỡ ra
                      </RowButton>
                    ) : elsewhere ? (
                      <RowButton
                        tone="move"
                        icon={ArrowRightLeft}
                        busy={busy}
                        onClick={() =>
                          placeMutation.mutate({ orderItemId: item.orderItemId, moving: true })
                        }
                        title={`Chuyển từ "${item.placedWorkspaceName ?? "phòng khác"}" sang phòng này`}
                      >
                        Chuyển
                      </RowButton>
                    ) : (
                      <RowButton
                        tone="primary"
                        icon={PackagePlus}
                        busy={busy}
                        onClick={() =>
                          placeMutation.mutate({ orderItemId: item.orderItemId, moving: false })
                        }
                        title="Đặt vào phòng này"
                      >
                        Đặt vào
                      </RowButton>
                    )
                  }
                />
              );
            })}
            {orphans.map((p) => (
              <ProductRow
                key={p.placementId}
                image={p.productImage}
                name={p.productName}
                productId={p.productId}
                active={false}
                previewable={false}
                onLeave={endHover}
                status={
                  <span className="truncate text-[11px] text-amber-600">
                    Không còn đặt được vào phòng
                  </span>
                }
                action={
                  <RowButton
                    tone="ghost"
                    icon={PackageX}
                    busy={busy}
                    onClick={() => removeMutation.mutate(p.orderItemId)}
                    title="Gỡ khỏi phòng này"
                  >
                    Gỡ ra
                  </RowButton>
                }
              />
            ))}
          </ul>
        )}
      </div>
      <p className="flex items-center gap-1 border-t border-gray-100 px-3 py-2 text-[10px] text-gray-400">
        <Eye size={11} />
        Di chuột vào sản phẩm để xem trước trên radar
      </p>
    </motion.div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function Count({ value }: { value: number }) {
  return (
    <span className="rounded-full bg-gray-100 px-1.5 text-[10px] font-bold tabular-nums text-gray-600">
      {value}
    </span>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-16 items-center justify-center rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-400">
      {children}
    </div>
  );
}

function ListSkeleton() {
  return (
    <ul className="space-y-1">
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-11 animate-pulse rounded-lg bg-gray-50" />
      ))}
    </ul>
  );
}

const ROW_BUTTON_TONE = {
  primary: "bg-primary text-white hover:bg-primary-dark border-transparent",
  move: "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100",
  ghost: "border-gray-200 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-500",
} as const;

/** Nút hành động của một dòng — nằm ở dòng thứ hai nên đủ chỗ cho nhãn chữ, không cần icon trần. */
function RowButton({
  tone,
  icon: Icon,
  busy,
  onClick,
  title,
  children,
}: {
  tone: keyof typeof ROW_BUTTON_TONE;
  icon: typeof PackagePlus;
  busy: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={busy}
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors disabled:opacity-50 cursor-pointer ${ROW_BUTTON_TONE[tone]}`}
    >
      {busy ? <Loader2 size={11} className="animate-spin" /> : <Icon size={11} />}
      {children}
    </button>
  );
}

interface ProductRowProps {
  image?: string | null;
  name: string;
  productId: string;
  /** Dòng phụ bên TRÁI hàng thứ hai (trạng thái / giá) — co lại khi hẹp, nút giữ nguyên. */
  status?: React.ReactNode;
  /** Nút hoặc badge bên PHẢI hàng thứ hai. */
  action?: React.ReactNode;
  active: boolean;
  /** false = món này không xem trước được (đã nằm trong phòng) — không đổi nền khi hover. */
  previewable: boolean;
  onEnter?: () => void;
  onLeave: () => void;
}

/**
 * Một dòng sản phẩm, xếp hai hàng: tên chiếm trọn chiều ngang (tối đa 2 dòng), trạng thái và nút
 * xuống hàng dưới. Panel nằm ở sidebar hẹp (~256px) nên để tên cạnh nút thì tên chỉ còn ~90px và luôn
 * bị cắt kiểu "Đèn muối H…"; tách hàng đổi lại chiều cao lấy chỗ đọc tên.
 */
function ProductRow({
  image,
  name,
  productId,
  status,
  action,
  active,
  previewable,
  onEnter,
  onLeave,
}: ProductRowProps) {
  return (
    <li
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      className={`flex gap-2.5 rounded-lg px-2 py-2 transition-colors ${
        active
          ? "bg-primary/10 ring-1 ring-primary/30"
          : previewable
            ? "hover:bg-gray-50"
            : "opacity-80"
      }`}
    >
      {image ? (
        <img src={image} alt={name} className="mt-0.5 h-10 w-10 shrink-0 rounded-md object-cover" />
      ) : (
        <div className="mt-0.5 h-10 w-10 shrink-0 rounded-md bg-gray-100" />
      )}
      <div className="min-w-0 flex-1">
        <Link
          to={`/products/${productId}`}
          className="line-clamp-2 text-[13px] font-medium leading-snug text-gray-800 hover:text-primary"
          title={name}
        >
          {name}
        </Link>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">{status}</div>
          {action}
        </div>
      </div>
    </li>
  );
}

/** Một dòng trạng thái duy nhất, luôn truncate — hàng thứ hai phải chừa chỗ cho nút. */
function PurchasedStatus({ item, inThisRoom }: { item: PurchasedItem; inThisRoom: boolean }) {
  const shipping = !item.isDelivered && (
    <span className="flex shrink-0 items-center gap-0.5 text-amber-600" title="Hàng đang giao">
      <Truck size={11} />
      đang giao
    </span>
  );

  if (inThisRoom) {
    return (
      <p className="flex items-center gap-1.5 truncate text-[11px] font-medium text-primary">
        <PackageCheck size={11} className="shrink-0" />
        <span className="truncate">Trong phòng này</span>
        {shipping}
      </p>
    );
  }
  if (item.placedWorkspaceProfileId) {
    return (
      <p
        className="truncate text-[11px] text-gray-400"
        title={`Đang ở: ${item.placedWorkspaceName ?? "phòng khác"}`}
      >
        Ở{" "}
        <span className="font-medium text-gray-500">
          {item.placedWorkspaceName ?? "phòng khác"}
        </span>
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1.5 truncate text-[11px] text-gray-400">
      {item.quantity > 1 && <span className="shrink-0">×{item.quantity}</span>}
      {shipping}
      {item.isDelivered && item.quantity <= 1 && (
        <span className="truncate">Chưa đặt vào phòng</span>
      )}
    </p>
  );
}
