import { useEffect, useState } from "react";
import { getWorkspaces, deleteWorkspace, setDefaultWorkspace } from "../api/workspace.api";
import { Workspace } from "../types/workspace";
import { toast } from "sonner";
import WorkspaceModal from "../components/WorkspaceModal";
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
} from "lucide-react";

const fieldConfig = [
  { key: "locationType", label: "Vị trí", icon: MapPinHouse },
  { key: "styleCode", label: "Phong cách", icon: Sparkles },
  { key: "lighting", label: "Ánh sáng", icon: Sun },
  { key: "deskType", label: "Loại bàn", icon: Monitor },
  { key: "deskOrientation", label: "Hướng bàn", icon: Compass },
  { key: "roomFacingDirection", label: "Hướng phòng", icon: Compass },
  { key: "workPurpose", label: "Mục đích", icon: Briefcase },
  { key: "fengShuiElement", label: "Ngũ hành", icon: Wind },
  { key: "deskArea", label: "Diện tích bàn (m²)", icon: Maximize2 },
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
export default function ProfileWorkspace() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(null);

  const handleOpenCreate = () => {
    setEditingWorkspace(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingWorkspace) return;
    const idToDelete = deletingWorkspace.id;
    setDeletingWorkspace(null); // đóng dialog ngay
    try {
      setLoading(true);
      await deleteWorkspace(idToDelete);
      // Xóa khỏi state local thay vì dùng data trả về từ API
      setWorkspaces((prev) => prev.filter((w) => w.id !== idToDelete));
    } catch (error) {
      toast.error("Không thể xóa không gian làm việc");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (workspace: Workspace) => {
    if (workspace.isDefault) return; // đã là default rồi thì bỏ qua
    try {
      await setDefaultWorkspace(workspace.id);
      // Cập nhật state local: bật isDefault cho workspace được chọn, tắt các cái còn lại
      setWorkspaces((prev) => prev.map((w) => ({ ...w, isDefault: w.id === workspace.id })));
      toast.success("Đã đặt làm mặc định");
    } catch (error) {
      toast.error("Không thể đặt làm mặc định");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const data = await getWorkspaces();
      setWorkspaces(data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách không gian làm việc");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Không gian làm việc</h1>
        <button
          onClick={handleOpenCreate}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors cursor-pointer"
        >
          + Tạo mới
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : workspaces.length === 0 ? (
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
        <div className="space-y-4">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className="relative rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-900">{workspace.name}</span>
                  {workspace.isDefault && (
                    <span className="flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      <Star size={10} />
                      Mặc định
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(workspace)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors cursor-pointer"
                  >
                    <Pencil size={14} />
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => setDeletingWorkspace(workspace)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer"
                  >
                    <Trash size={14} />
                    Xóa
                  </button>
                  <button
                    onClick={() => handleSetDefault(workspace)}
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
                  const value = workspace[key as keyof Workspace];
                  if (value === null || value === undefined) return null;
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-primary shadow-sm">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                          {label}
                        </p>
                        <p className="truncate text-sm font-medium text-gray-800">
                          {String(value)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <WorkspaceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingWorkspace(null);
        }}
        onSuccess={fetchWorkspaces}
        workspace={editingWorkspace}
      />
    </div>
  );
}
