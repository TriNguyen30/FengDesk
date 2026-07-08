import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Workspace, WorkspaceType, Style } from "../types/workspace";
import {
  createWorkspace,
  updateWorkspace,
  getWorkspaceTypes,
  getStyles,
} from "../api/workspace.api";
import { toast } from "sonner";
import { toCm2, fromCm2 } from "../utils/deskArea";

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  workspace?: Workspace | null; // If passed, it's edit mode
}

const locationTypes = ["Home", "Office", "Cafe", "Studio", "Other"];
const lightingTypes = ["Natural", "Artificial", "Mixed", "Dim"];
const deskTypes = ["Sitting", "Standing", "StandingSitting", "LShape", "Corner", "Other"];
const compassDirections = [
  "North",
  "Northeast",
  "East",
  "Southeast",
  "South",
  "Southwest",
  "West",
  "Northwest",
];
const workPurposes = ["Office", "Study", "Creative", "Reading", "Gaming", "Mixed", "Other"];
const fengShuiElements = ["Kim", "Moc", "Thuy", "Hoa", "Tho"];

const defaultFormData = {
  name: "",
  locationType: "Home",
  workspaceTypeId: "",
  styleCode: "",
  lighting: "Natural",
  deskType: "Sitting",
  deskOrientation: "North",
  roomFacingDirection: "North",
  workPurpose: "Office",
  fengShuiElement: "Kim",
  deskArea: 1,
  isDefault: false,
};

export default function WorkspaceModal({
  isOpen,
  onClose,
  onSuccess,
  workspace,
}: WorkspaceModalProps) {
  const [formData, setFormData] = useState(defaultFormData);

  const [isLoading, setIsLoading] = useState(false);
  const [workspaceTypes, setWorkspaceTypes] = useState<WorkspaceType[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const isEditMode = !!workspace;

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
      if (workspace) {
        // Populate form with existing workspace data
        setFormData({
          name: workspace.name,
          locationType: workspace.locationType,
          workspaceTypeId: workspace.workspaceTypeId,
          styleCode: workspace.styleCode,
          lighting: workspace.lighting,
          deskType: workspace.deskType,
          deskOrientation: workspace.deskOrientation,
          roomFacingDirection: workspace.roomFacingDirection,
          workPurpose: workspace.workPurpose,
          fengShuiElement: workspace.fengShuiElement,
          deskArea: fromCm2(workspace.deskArea),
          isDefault: workspace.isDefault,
        });
      } else {
        // Reset form for new workspace
        setFormData(defaultFormData);
      }
    }
  }, [isOpen, workspace]);

  const fetchOptions = async () => {
    setLoadingOptions(true);
    try {
      const [typesData, stylesData] = await Promise.all([getWorkspaceTypes(), getStyles()]);
      setWorkspaceTypes(typesData || []);
      setStyles(stylesData || []);
    } catch (error) {
      console.error("Error fetching options", error);
      toast.error("Không thể tải danh sách tùy chọn");
    } finally {
      setLoadingOptions(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name === "deskArea" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên không gian làm việc");
      return;
    }
    if (!formData.workspaceTypeId) {
      toast.error("Vui lòng chọn loại không gian làm việc");
      return;
    }
    if (!formData.styleCode) {
      toast.error("Vui lòng chọn phong cách");
      return;
    }

    setIsLoading(true);
    try {
      if (isEditMode) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { isDefault, ...updateData } = formData;
        await updateWorkspace(workspace.id, { ...updateData, deskArea: toCm2(updateData.deskArea) });
        toast.success("Cập nhật không gian làm việc thành công");
      } else {
        await createWorkspace({ ...formData, deskArea: toCm2(formData.deskArea) });
        toast.success("Tạo không gian làm việc thành công");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(
        isEditMode ? "Lỗi khi cập nhật không gian làm việc" : "Lỗi khi tạo không gian làm việc",
      );
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer";
  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditMode ? "Chỉnh sửa không gian làm việc" : "Tạo không gian làm việc mới"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {loadingOptions ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className={labelClass}>Tên không gian làm việc</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Nhập tên không gian làm việc"
                />
              </div>

              {/* Workspace Type - from API */}
              <div>
                <label className={labelClass}>Loại không gian làm việc</label>
                <select
                  name="workspaceTypeId"
                  value={formData.workspaceTypeId}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="">Chọn loại không gian</option>
                  {workspaceTypes.map((wt) => (
                    <option key={wt.id} value={wt.id}>
                      {wt.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Style Code - from API */}
              <div>
                <label className={labelClass}>Phong cách</label>
                <select
                  name="styleCode"
                  value={formData.styleCode}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="">Chọn phong cách</option>
                  {styles.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Type */}
              <div>
                <label className={labelClass}>Vị trí</label>
                <select
                  name="locationType"
                  value={formData.locationType}
                  onChange={handleChange}
                  className={selectClass}
                >
                  {locationTypes.map((lt) => (
                    <option key={lt} value={lt}>
                      {lt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Two-column grid for smaller fields */}
              <div className="grid grid-cols-2 gap-4">
                {/* Lighting */}
                <div>
                  <label className={labelClass}>Ánh sáng</label>
                  <select
                    name="lighting"
                    value={formData.lighting}
                    onChange={handleChange}
                    className={selectClass}
                  >
                    {lightingTypes.map((lt) => (
                      <option key={lt} value={lt}>
                        {lt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Desk Type */}
                <div>
                  <label className={labelClass}>Loại bàn</label>
                  <select
                    name="deskType"
                    value={formData.deskType}
                    onChange={handleChange}
                    className={selectClass}
                  >
                    {deskTypes.map((dt) => (
                      <option key={dt} value={dt}>
                        {dt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Desk Orientation */}
                <div>
                  <label className={labelClass}>Hướng bàn</label>
                  <select
                    name="deskOrientation"
                    value={formData.deskOrientation}
                    onChange={handleChange}
                    className={selectClass}
                  >
                    {compassDirections.map((cd) => (
                      <option key={cd} value={cd}>
                        {cd}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room Facing Direction */}
                <div>
                  <label className={labelClass}>Hướng phòng</label>
                  <select
                    name="roomFacingDirection"
                    value={formData.roomFacingDirection}
                    onChange={handleChange}
                    className={selectClass}
                  >
                    {compassDirections.map((cd) => (
                      <option key={cd} value={cd}>
                        {cd}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Work Purpose */}
                <div>
                  <label className={labelClass}>Mục đích</label>
                  <select
                    name="workPurpose"
                    value={formData.workPurpose}
                    onChange={handleChange}
                    className={selectClass}
                  >
                    {workPurposes.map((wp) => (
                      <option key={wp} value={wp}>
                        {wp}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Feng Shui Element */}
                <div>
                  <label className={labelClass}>Ngũ hành</label>
                  <select
                    name="fengShuiElement"
                    value={formData.fengShuiElement}
                    onChange={handleChange}
                    className={selectClass}
                  >
                    {fengShuiElements.map((fe) => (
                      <option key={fe} value={fe}>
                        {fe}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Desk Area */}
              <div>
                <label className={labelClass}>Diện tích bàn (m²)</label>
                <input
                  type="number"
                  name="deskArea"
                  min={0}
                  step={0.1}
                  value={formData.deskArea}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Nhập diện tích bàn"
                />
              </div>

              {/* Is Default - only show for create mode */}
              {!isEditMode && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isDefaultWorkspace"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <label
                    htmlFor="isDefaultWorkspace"
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Đặt làm không gian mặc định
                  </label>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isLoading
                  ? isEditMode
                    ? "Đang cập nhật..."
                    : "Đang tạo..."
                  : isEditMode
                    ? "Cập nhật"
                    : "Tạo không gian"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
