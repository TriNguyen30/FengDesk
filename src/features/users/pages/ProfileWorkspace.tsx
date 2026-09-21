import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteWorkspace, setDefaultWorkspace } from "../api/workspace.api";
import { Workspace } from "../types/workspace";
import { toast } from "sonner";
import WorkspaceModal from "../components/WorkspaceModal";
import { useWorkspaceIntakeRunning } from "../hooks/useWorkspaceIntakeDraft";
import { useWorkspaceElementAnalysis, useWorkspaces } from "../hooks/useWorkspace";
import { fromCm2 } from "../utils/deskArea";
import { resolveSelectedWorkspace, workspacePath } from "../utils/selectWorkspace";
import ElementVectorFit, {
  type ProductPreviewLayer,
} from "@/features/recommendation/components/element-vector/ElementVectorFit";
import { useProductFit } from "@/features/recommendation/hooks/useProductFit";
import { useWorkspaceHover } from "../context/WorkspaceHoverContext";
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

// ── Ngũ hành không gian (hover sản phẩm ở sidebar → radar xem trước) ──
function WorkspaceElementSection({ workspace }: { workspace: Workspace }) {
  const { analysis, status } = useWorkspaceElementAnalysis(workspace.id);

  // Món đang hover trong panel sản phẩm (sidebar, qua context) → fit của món đó với phòng này → lớp
  // nét đứt trên radar. react-query cache theo (productId, workspaceId) nên hover lại không tốn request.
  const { hovered } = useWorkspaceHover();
  const { fit } = useProductFit(hovered?.productId, workspace.id);
  const productPreview: ProductPreviewLayer | null =
    hovered && fit && fit.productId === hovered.productId
      ? { label: hovered.label, rows: fit.gap }
      : null;

  if (status === "pending") {
    return (
      <div className="mt-4 h-40 animate-pulse rounded-2xl border border-gray-100 bg-gray-50" />
    );
  }
  if (status === "error" || !analysis) return null;

  return (
    <div className="mt-4">
      <ElementVectorFit analysis={analysis} variant="full" productPreview={productPreview} />
    </div>
  );
}

interface WorkspaceCardProps {
  workspace: Workspace;
  onEdit: (workspace: Workspace) => void;
  onDelete: (workspace: Workspace) => void;
  onSetDefault: (workspace: Workspace) => void;
}

function WorkspaceCard({ workspace, onEdit, onDelete, onSetDefault }: WorkspaceCardProps) {
  // Cùng queryKey với WorkspaceElementSection bên dưới → react-query dedupe, không tốn thêm request.
  const { analysis, status } = useWorkspaceElementAnalysis(workspace.id);

  return (
    <div className="relative rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(workspace)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors cursor-pointer"
          >
            <Pencil size={14} />
            Chỉnh sửa
          </button>
          <button
            onClick={() => onDelete(workspace)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer"
          >
            <Trash size={14} />
            Xóa
          </button>
          <button
            onClick={() => onSetDefault(workspace)}
            disabled={workspace.isDefault}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer
            ${
              workspace.isDefault
                ? "border-primary/20 bg-primary/5 text-primary cursor-default"
                : "border-gray-200 text-gray-600 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
            }`}
          >
            <Star size={14} />
            {workspace.isDefault ? "Mặc định" : "Đặt mặc định"}
          </button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fieldConfig.map(({ key, label, icon: Icon }) => {
          const raw = workspace[key as keyof Workspace];
          if (raw === null || raw === undefined) return null;
          const value = key === "deskArea" ? `${fromCm2(Number(raw)).toFixed(2)} m²` : String(raw);
          return (
            <div key={key} className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
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
          );
        })}
      </div>

      {workspace.missingFieldHints.length > 0 && (
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
          <p className="flex items-center gap-1.5 font-medium">
            <Lightbulb size={13} />
            Gợi ý bổ sung để tư vấn chính xác hơn
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {workspace.missingFieldHints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
        </div>
      )}

      <WorkspaceElementSection workspace={workspace} />
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
          <p className="mt-0.5 text-sm text-gray-500">
            Quản lý các không gian làm việc của bạn.
          </p>
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
