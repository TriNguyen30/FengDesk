import { useEffect, useState } from "react";
import { getWorkspaces } from "../api/workspace.api";
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

export default function ProfileWorkspace() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Không gian làm việc
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors cursor-pointer"
        >
          + Tạo mới
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      ) : workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-12 text-center">
          <div className="mb-4 rounded-full bg-gray-50 p-3 text-gray-400">
            <MapPinHouse size={24} />
          </div>
          <h3 className="text-sm font-medium text-gray-900">
            Chưa có không gian làm việc nào
          </h3>
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
                  <span className="text-lg font-semibold text-gray-900">
                    {workspace.name}
                  </span>
                  {workspace.isDefault && (
                    <span className="flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      <Star size={10} />
                      Mặc định
                    </span>
                  )}
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
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchWorkspaces}
      />
    </div>
  );
}