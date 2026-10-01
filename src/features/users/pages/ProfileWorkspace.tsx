import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteWorkspace, setDefaultWorkspace } from "../api/workspace.api";
import type { ElementAnalysisRow, Workspace } from "../types/workspace";
import { toast } from "sonner";
import WorkspaceModal from "../components/WorkspaceModal";
import { useWorkspaceIntakeRunning } from "../hooks/useWorkspaceIntakeDraft";
import {
  useStyles,
  useWorkspaceElementAnalysis,
  useWorkspaces,
  useWorkspaceTypes,
} from "../hooks/useWorkspace";
import { fromCm2 } from "../utils/deskArea";
import { resolveSelectedWorkspace, workspacePath } from "../utils/selectWorkspace";
import ElementVectorFit, {
  type ProductPreviewLayer,
} from "@/features/recommendation/components/element-vector/ElementVectorFit";
import { useBundlePreview, useProductFit } from "@/features/recommendation/hooks/useProductFit";
import { elementVi } from "@/features/recommendation/components/element-vector/constants";
import { useWorkspaceHover } from "../context/WorkspaceHoverContext";
import {
  useRecommendationSelection,
  type RecommendationSelection,
} from "../hooks/useRecommendationSelection";
import { useWorkspaceRecommendations } from "../hooks/useWorkspaceRecommendations";
import WorkspaceRecommendationPicker, {
  RecommendationEmptyNotice,
  RecommendationSelectionSummary,
} from "../components/WorkspaceRecommendationPicker";
import WorkspaceCoverControls from "../components/WorkspaceCoverControls";
import WorkspaceCoverBackdrop from "../components/WorkspaceCoverBackdrop";
import { useSlideshow } from "../hooks/useSlideshow";
import {
  deskTypeLabel,
  directionLabel,
  lightingLabel,
  locationTypeLabel,
  workPurposeLabel,
  workspaceTypeLabel,
} from "../utils/workspaceLabels";
import {
  MapPinHouse,
  Briefcase,
  Sun,
  Compass,
  Monitor,
  Wind,
  Sparkles,
  Maximize2,
  Star,
  Pencil,
  Trash,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  LayoutGrid,
} from "lucide-react";

// ── Vòng tròn % tương thích ngũ hành (nguồn: element-analysis.compatibilityPercent) ──
function CompatibilityRing({ percent, loading }: { percent: number | null; loading: boolean }) {
  const size = 36;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = percent ?? 0;
  const offset = circumference * (1 - pct / 100);
  const toneClass = pct < 40 ? "stroke-red-500" : pct < 70 ? "stroke-amber-500" : "stroke-primary";

  return (
    <div
      className="relative flex h-9 w-9 shrink-0 items-center justify-center"
      title={loading ? "Đang tính tương thích ngũ hành…" : `Tương thích ngũ hành ${pct}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          className="stroke-gray-100"
        />
        {!loading && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={toneClass}
          />
        )}
      </svg>
      <span className="absolute text-[9px] font-semibold text-gray-600">
        {loading ? "…" : `${pct}%`}
      </span>
    </div>
  );
}

// ── Ngũ hành không gian + đề xuất (hover / chọn sản phẩm → radar xem trước) ──
function WorkspaceElementSection({
  workspace,
  onImage,
}: {
  workspace: Workspace;
  /** Ảnh nền của thẻ chạy ra phía sau khối này → nền kính mờ. */
  onImage: boolean;
}) {
  const { analysis, status } = useWorkspaceElementAnalysis(workspace.id);
  // Sống theo WorkspaceCard (key = id phòng) → đổi phòng là bỏ chọn hết.
  const selection = useRecommendationSelection();
  const recommendations = useWorkspaceRecommendations(workspace.id);
  const { productPreview, committedRows } = useRadarPreview(workspace.id, selection.lines);

  if (status === "pending") {
    return (
      <div className="mt-4 h-40 animate-pulse rounded-2xl border border-gray-100 bg-gray-50" />
    );
  }
  if (status === "error" || !analysis) return null;

  // Phân tích bên trái, radar bên phải; hàng đề xuất (hoặc dải "chưa có đề xuất") nằm full-width bên dưới.
  const footer =
    recommendations.state === "empty" ? (
      <RecommendationEmptyNotice error={recommendations.error} />
    ) : (
      <div className="flex flex-col gap-3">
        <WorkspaceRecommendationPicker recommendations={recommendations} selection={selection} />
        <RecommendationSelectionSummary selection={selection} />
      </div>
    );

  return (
    <div className="mt-4">
      <ElementVectorFit
        analysis={analysis}
        variant="full"
        productPreview={productPreview}
        committedPreviewRows={committedRows}
        footer={footer}
        glass={onImage}
      />
    </div>
  );
}

/**
 * Lớp nét đứt trên radar:
 * - Đã chọn món → xem trước GỘP cả nhóm (kèm số lượng); đang hover một món khác thì cộng thêm món đó
 *   (1 cái) để thấy "nhóm này + món kia" trước khi bấm chọn.
 * - Chưa chọn gì → chỉ món đang hover (lưới đề xuất hoặc panel "Đã mua" ở sidebar, qua context).
 */
function useRadarPreview(
  workspaceId: string,
  lines: RecommendationSelection["lines"],
): { productPreview: ProductPreviewLayer | null; committedRows: ElementAnalysisRow[] | null } {
  const { hovered } = useWorkspaceHover();
  const hoveredOutsideSelection =
    hovered && !lines.some((l) => l.item.productId === hovered.productId) ? hovered : null;

  const bundleItems = lines.length
    ? [
        ...lines.map((l) => ({ productId: l.item.productId, quantity: l.quantity })),
        ...(hoveredOutsideSelection
          ? [{ productId: hoveredOutsideSelection.productId, quantity: 1 }]
          : []),
      ]
    : [];
  const { preview: bundle } = useBundlePreview(workspaceId, bundleItems);
  // Riêng các món đã chốt (không có món đang hover) — hiệu ứng nhảy số chỉ bám vào lớp này, nên hover
  // không làm chip nhảy. Không hover thì trùng key với `bundle` ở trên → react-query dùng chung cache.
  const { preview: committed } = useBundlePreview(
    workspaceId,
    lines.map((l) => ({ productId: l.item.productId, quantity: l.quantity })),
  );
  const { fit } = useProductFit(lines.length ? undefined : hovered?.productId, workspaceId);
  const committedRows = lines.length ? (committed?.gap ?? null) : null;

  if (lines.length) {
    if (!bundle) return { productPreview: null, committedRows };
    const totalQuantity = lines.reduce((sum, l) => sum + l.quantity, 0);
    const base = `${totalQuantity} món đã chọn`;
    return {
      productPreview: {
        label: hoveredOutsideSelection ? `${base} + ${hoveredOutsideSelection.label}` : base,
        rows: bundle.gap,
      },
      committedRows,
    };
  }
  if (hovered && fit && fit.productId === hovered.productId) {
    return { productPreview: { label: hovered.label, rows: fit.gap }, committedRows };
  }
  return { productPreview: null, committedRows };
}

interface WorkspaceCardProps {
  workspace: Workspace;
  onEdit: (workspace: Workspace) => void;
  onDelete: (workspace: Workspace) => void;
  onSetDefault: (workspace: Workspace) => void;
}

/** Giá trị hiển thị của từng ô thông tin phòng — mã enum BE đổi sang nhãn tiếng Việt. */
function formatField(key: (typeof fieldConfig)[number]["key"], raw: unknown, styleName?: string) {
  const code = String(raw);
  switch (key) {
    case "deskArea":
      return `${fromCm2(Number(raw)).toFixed(2)} m²`;
    case "locationType":
      return locationTypeLabel(code);
    case "styleCode":
      return styleName ?? code;
    case "lighting":
      return lightingLabel(code);
    case "deskType":
      return deskTypeLabel(code);
    case "deskOrientation":
    case "roomFacingDirection":
      return directionLabel(code);
    case "workPurpose":
      return workPurposeLabel(code);
    case "fengShuiElement":
      return elementVi(code);
  }
}

/**
 * Thông tin phòng dạng 1 dòng chip (nhãn ở title) + "Chi tiết" để xổ lưới đầy đủ — lưới 9 ô cũ chiếm
 * ~200px mà ít được đọc lại, nhường chỗ cho lưới đề xuất. Gợi ý bổ sung gộp thành 1 dòng xổ được.
 */
function WorkspaceInfoSummary({ workspace, onImage }: { workspace: Workspace; onImage: boolean }) {
  const [expanded, setExpanded] = useState(false);
  // Nằm trên ảnh → kính mờ (blur + hơi trong); không ảnh → mảng xám như cũ (kính mờ trên nền trắng sẽ chìm).
  const tileClass = onImage ? "fd-glass" : "bg-gray-50";
  const { workspaceTypes } = useWorkspaceTypes();
  const { styles } = useStyles();
  const workspaceType = workspaceTypes.find((t) => t.id === workspace.workspaceTypeId);
  const styleName = styles.find((s) => s.code === workspace.styleCode)?.name;

  const fields = [
    ...(workspaceType
      ? [
          {
            key: "workspaceType",
            label: "Loại không gian",
            icon: LayoutGrid,
            value: workspaceTypeLabel(workspaceType),
          },
        ]
      : []),
    ...fieldConfig.flatMap(({ key, label, icon }) => {
      const raw = workspace[key as keyof Workspace];
      if (raw === null || raw === undefined) return [];
      return [{ key, label, icon, value: formatField(key, raw, styleName) }];
    }),
  ];
  const hints = workspace.missingFieldHints;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {!expanded &&
          fields.map(({ key, label, icon: Icon, value }) => (
            <span
              key={key}
              title={label}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-gray-700 ${tileClass}`}
            >
              <Icon size={12} className="shrink-0 text-primary" />
              {value}
            </span>
          ))}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-primary cursor-pointer"
        >
          {expanded ? "Thu gọn" : "Chi tiết"}
          <ChevronDown
            size={13}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map(({ key, label, icon: Icon, value }) => (
            <div
              key={key}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${tileClass}`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-primary shadow-sm">
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  {label}
                </p>
                <p className="truncate text-sm font-medium text-gray-800">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {hints.length > 0 && (
        <details
          className={`group rounded-lg px-3 py-2 text-xs text-amber-700 ${onImage ? "fd-glass-warn" : "bg-amber-50"}`}
        >
          <summary className="flex cursor-pointer list-none items-center gap-1.5 font-medium">
            <Lightbulb size={13} />
            Bổ sung {hints.length} thông tin để tư vấn chính xác hơn
            <ChevronDown size={13} className="ml-auto transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {hints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function WorkspaceCard({ workspace, onEdit, onDelete, onSetDefault }: WorkspaceCardProps) {
  // Cùng queryKey với WorkspaceElementSection bên dưới → react-query dedupe, không tốn thêm request.
  const { analysis, status } = useWorkspaceElementAnalysis(workspace.id);

  const onImage = workspace.images.length > 0;
  // Nút nằm đè lên ảnh → kính mờ như chip; không ảnh → viền + nền trắng như cũ.
  const actionSurface = onImage ? "fd-glass" : "border border-gray-200 bg-white";
  const slideshow = useSlideshow(workspace.images.length);

  return (
    <div className="relative rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Ảnh là lớp NỀN cao cố định, không nằm trong luồng: thêm/gỡ ảnh hay Chi tiết/Thu gọn không đổi
          vị trí nội dung. Mờ dần từ chân lên nên chạy ra sau cả khối "Ngũ hành"; nhiều ảnh thì tự chuyển. */}
      <WorkspaceCoverBackdrop images={workspace.images} index={slideshow.index} />

      <div className="relative px-5 pt-5 pb-4">
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CompatibilityRing
                percent={analysis?.compatibilityPercent ?? null}
                loading={status === "pending"}
              />
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">{workspace.name}</span>
                {workspace.isDefault && (
                  <span className="flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    <Star size={10} />
                    Mặc định
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <WorkspaceCoverControls
                workspace={workspace}
                index={slideshow.index}
                onSelect={slideshow.setIndex}
                onPauseChange={slideshow.setPaused}
              />
              <button
                onClick={() => onEdit(workspace)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-primary transition-colors cursor-pointer ${actionSurface}`}
              >
                <Pencil size={14} />
                Chỉnh sửa
              </button>
              <button
                onClick={() => onDelete(workspace)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-red-500 transition-colors cursor-pointer ${actionSurface}`}
              >
                <Trash size={14} />
                Xóa
              </button>
              <button
                onClick={() => onSetDefault(workspace)}
                disabled={workspace.isDefault}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer
                ${
                  workspace.isDefault
                    ? "border border-primary/20 bg-primary/5 text-primary cursor-default"
                    : `text-gray-600 hover:text-primary ${actionSurface}`
                }`}
              >
                <Star size={14} />
                {workspace.isDefault ? "Mặc định" : "Đặt mặc định"}
              </button>
            </div>
          </div>

          <WorkspaceInfoSummary workspace={workspace} onImage={onImage} />
        </div>
      </div>

      <div className="relative px-5 pb-5">
        <WorkspaceElementSection workspace={workspace} onImage={onImage} />
      </div>
    </div>
  );
}

const fieldConfig = [
  { key: "locationType", label: "Vị trí", icon: MapPinHouse },
  { key: "styleCode", label: "Phong cách", icon: Sparkles },
  { key: "lighting", label: "Ánh sáng", icon: Sun },
  { key: "deskType", label: "Loại bàn", icon: Monitor },
  { key: "deskOrientation", label: "Hướng bàn", icon: Compass },
  { key: "roomFacingDirection", label: "Hướng phòng", icon: Compass },
  { key: "workPurpose", label: "Mục đích", icon: Briefcase },
  { key: "fengShuiElement", label: "Ngũ hành", icon: Wind },
  { key: "deskArea", label: "Diện tích bàn", icon: Maximize2 },
] as const;

// ── Confirm Dialog ──────────────────────────────────────────
interface ConfirmDeleteDialogProps {
  workspaceName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDeleteDialog({ workspaceName, onConfirm, onCancel }: ConfirmDeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      {/* Dialog */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle size={22} className="text-red-500" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">Xóa không gian làm việc?</h2>
        <p className="mt-1.5 text-sm text-gray-500">
          Bạn có chắc muốn xóa <span className="font-medium text-gray-700">"{workspaceName}"</span>?
          Hành động này không thể hoàn tác.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors cursor-pointer"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────
/**
 * Trang hiện MỘT phòng tại một thời điểm: phòng chọn trên sidebar (`/profile/workspace/:workspaceId`),
 * không có id thì phòng mặc định. Danh sách phòng ở react-query (["workspaces"]) để dùng chung với
 * WorkspaceNavList — sửa/xóa/đặt mặc định ở đây, sidebar tự cập nhật.
 */
export default function ProfileWorkspace() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { workspaces, status } = useWorkspaces();
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Có lượt "AI điền giúp" đang chạy nền (user đã đóng modal) → chip nhỏ cạnh nút Tạo mới.
  const intakeRunning = useWorkspaceIntakeRunning();
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null);

  const selected = resolveSelectedWorkspace(workspaces, workspaceId);

  // URL trỏ tới phòng không còn (đã xóa / link cũ) → về đường dẫn gốc, để mặc định tự chọn.
  useEffect(() => {
    if (status === "success" && workspaceId && selected && selected.id !== workspaceId) {
      navigate(workspacePath(), { replace: true });
    }
  }, [status, workspaceId, selected, navigate]);

  const invalidateWorkspaces = () => {
    queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    // Radar/ngũ hành nằm ở key ["workspace", id, "element-analysis"] — refetch danh sách KHÔNG đụng
    // tới cache này. Phải invalidate để radar tính lại sau khi sửa.
    queryClient.invalidateQueries({ queryKey: ["workspace"] });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWorkspace(id),
    onSuccess: (_, id) => {
      toast.success("Đã xóa không gian làm việc");
      invalidateWorkspaces();
      if (id === workspaceId) navigate(workspacePath(), { replace: true });
    },
    onError: (error) => {
      toast.error("Không thể xóa không gian làm việc");
      console.error(error);
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => setDefaultWorkspace(id),
    onSuccess: () => {
      toast.success("Đã đặt làm mặc định");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
    onError: (error) => {
      toast.error("Không thể đặt làm mặc định");
      console.error(error);
    },
  });

  const handleOpenCreate = () => {
    setEditingWorkspace(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingWorkspace) return;
    const idToDelete = deletingWorkspace.id;
    setDeletingWorkspace(null); // đóng dialog ngay
    deleteMutation.mutate(idToDelete);
  };

  const handleSetDefault = (workspace: Workspace) => {
    if (workspace.isDefault) return; // đã là default rồi thì bỏ qua
    setDefaultMutation.mutate(workspace.id);
  };

  const loading = status === "pending" || deleteMutation.isPending;

  return (
    <div>
      {/* Confirm Delete Dialog */}
      {deletingWorkspace && (
        <ConfirmDeleteDialog
          workspaceName={deletingWorkspace.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingWorkspace(null)}
        />
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Không gian làm việc</h1>
          <p className="mt-0.5 text-sm text-gray-500">Quản lý các không gian làm việc của bạn.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Dấu hiệu nhỏ: AI vẫn đang phân tích mô tả user gửi lúc nãy — mở "Tạo mới" là thấy tiến trình,
              xong thì form đã được điền sẵn. Không có nút hủy: job nền cứ chạy, không cần cancel. */}
          {intakeRunning && !isModalOpen && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 cursor-pointer"
              title="AI đang phân tích mô tả không gian bạn đã gửi - bấm để xem tiến trình"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              AI đang phân tích không gian…
            </button>
          )}
          <button
            onClick={handleOpenCreate}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors cursor-pointer"
          >
            + Tạo mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : !selected ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-12 text-center">
          <div className="mb-4 rounded-full bg-gray-50 p-3 text-gray-400">
            <MapPinHouse size={24} />
          </div>
          <h3 className="text-sm font-medium text-gray-900">Chưa có không gian làm việc nào</h3>
          <p className="mt-1 text-sm text-gray-500">
            Hãy tạo không gian làm việc để được tư vấn phong thủy
          </p>
        </div>
      ) : (
        <WorkspaceCard
          key={selected.id}
          workspace={selected}
          onEdit={handleOpenEdit}
          onDelete={setDeletingWorkspace}
          onSetDefault={handleSetDefault}
        />
      )}

      <WorkspaceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingWorkspace(null);
        }}
        onSuccess={invalidateWorkspaces}
        workspace={editingWorkspace}
      />
    </div>
  );
}
