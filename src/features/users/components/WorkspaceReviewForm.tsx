import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createWorkspace, updateWorkspace } from "../api/workspace.api";
import { toCm2, fromCm2 } from "../utils/deskArea";
import {
  workspaceFormSchema,
  type WorkspaceFormValues,
  locationTypes,
  lightingTypes,
  deskTypes,
  compassDirections,
  workPurposes,
} from "../schemas/workspace-schema";
import type { Style, Workspace, WorkspaceProfileDraft, WorkspaceType } from "../types/workspace";

interface WorkspaceReviewFormProps {
  workspace?: Workspace | null; // truyền vào = edit mode
  draft?: WorkspaceProfileDraft | null; // draft AI intake (chỉ có ở create mode)
  workspaceTypes: WorkspaceType[];
  styles: Style[];
  onSuccess: () => void;
  onCancel: () => void;
}

function toFormValues(workspace?: Workspace | null, draft?: WorkspaceProfileDraft | null): WorkspaceFormValues {
  if (workspace) {
    return {
      name: workspace.name,
      workspaceTypeId: workspace.workspaceTypeId ?? "",
      styleCode: workspace.styleCode,
      locationType: isLocationType(workspace.locationType) ? workspace.locationType : "Home",
      workPurpose: isWorkPurpose(workspace.workPurpose) ? workspace.workPurpose : "Office",
      noDesk: !workspace.deskType,
      lighting: workspace.lighting ?? "",
      deskType: workspace.deskType ?? "",
      deskOrientation: workspace.deskOrientation ?? "",
      roomFacingDirection: workspace.roomFacingDirection ?? "",
      deskArea: workspace.deskArea != null ? String(fromCm2(workspace.deskArea)) : "",
      isDefault: workspace.isDefault,
    };
  }
  return {
    name: draft?.name ?? "",
    workspaceTypeId: draft?.workspaceTypeId ?? "",
    styleCode: draft?.styleCode ?? "",
    locationType: isLocationType(draft?.locationType) ? draft!.locationType! : "Home",
    workPurpose: isWorkPurpose(draft?.workPurpose) ? draft!.workPurpose! : "Office",
    noDesk: false,
    lighting: draft?.lighting ?? "",
    deskType: draft?.deskType ?? "",
    deskOrientation: draft?.deskOrientation ?? "",
    roomFacingDirection: draft?.roomFacingDirection ?? "",
    deskArea: draft?.deskArea != null ? String(fromCm2(draft.deskArea)) : "",
    isDefault: false,
  };
}

function isLocationType(v?: string | null): v is (typeof locationTypes)[number] {
  return !!v && (locationTypes as readonly string[]).includes(v);
}
function isWorkPurpose(v?: string | null): v is (typeof workPurposes)[number] {
  return !!v && (workPurposes as readonly string[]).includes(v);
}

/** Bước 2: form prefilled (từ draft AI hoặc từ workspace đang sửa) — user review/sửa rồi lưu qua create/update sẵn có. */
export default function WorkspaceReviewForm({
  workspace,
  draft,
  workspaceTypes,
  styles,
  onSuccess,
  onCancel,
}: WorkspaceReviewFormProps) {
  const isEditMode = !!workspace;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: toFormValues(workspace, draft),
  });

  // Đổi workspace/draft (vd mở lại modal) → nạp lại giá trị mặc định.
  useEffect(() => {
    reset(toFormValues(workspace, draft));
  }, [workspace, draft, reset]);

  const noDesk = watch("noDesk");

  const aiFilled = useMemo(() => {
    const keys = new Set<keyof WorkspaceFormValues>();
    if (!draft) return keys;
    if (draft.name) keys.add("name");
    if (draft.locationType) keys.add("locationType");
    if (draft.workspaceTypeId) keys.add("workspaceTypeId");
    if (draft.styleCode) keys.add("styleCode");
    if (draft.lighting) keys.add("lighting");
    if (draft.deskType) keys.add("deskType");
    if (draft.deskOrientation) keys.add("deskOrientation");
    if (draft.roomFacingDirection) keys.add("roomFacingDirection");
    if (draft.workPurpose) keys.add("workPurpose");
    if (draft.deskArea != null) keys.add("deskArea");
    return keys;
  }, [draft]);

  const onSubmit = handleSubmit(async (values) => {
    const areaM2 = values.deskArea.trim() === "" ? null : Number(values.deskArea);
    const payload = {
      name: values.name.trim(),
      locationType: values.locationType,
      workspaceTypeId: values.workspaceTypeId || undefined,
      styleCode: values.styleCode,
      workPurpose: values.workPurpose,
      lighting: values.lighting || undefined,
      deskType: values.noDesk ? undefined : values.deskType || undefined,
      deskOrientation: values.noDesk ? undefined : values.deskOrientation || undefined,
      roomFacingDirection: values.roomFacingDirection || undefined,
      deskArea: values.noDesk || areaM2 === null ? undefined : toCm2(areaM2),
      inputs: draft?.inputs,
    };

    try {
      if (isEditMode && workspace) {
        await updateWorkspace(workspace.id, payload);
        toast.success("Cập nhật không gian làm việc thành công");
      } else {
        await createWorkspace({ ...payload, isDefault: values.isDefault });
        toast.success("Tạo không gian làm việc thành công");
      }
      onSuccess();
    } catch (error) {
      toast.error(isEditMode ? "Lỗi khi cập nhật không gian làm việc" : "Lỗi khi tạo không gian làm việc");
      console.error(error);
    }
  });

  const selectClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400";
  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400";
  const aiClass = "border-primary/50 ring-1 ring-primary/30";

  const fieldClass = (key: keyof WorkspaceFormValues, base: string) =>
    aiFilled.has(key) ? `${base} ${aiClass}` : base;

  const label = (text: string, key: keyof WorkspaceFormValues) => (
    <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
      {text}
      {aiFilled.has(key) && (
        <span title="AI điền từ mô tả — hãy kiểm tra" className="text-primary">
          <Sparkles size={12} />
        </span>
      )}
    </label>
  );

  return (
    <form onSubmit={onSubmit} className="p-6">
      {draft && draft.confidence < 0.5 && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>AI chưa chắc chắn lắm với mô tả này, vui lòng kiểm tra kỹ các field bên dưới.</span>
        </div>
      )}
      {draft && draft.unrecognized.length > 0 && (
        <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
          <p className="font-medium">Chưa hiểu — bạn chọn giúp nhé:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {draft.unrecognized.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        <div>
          {label("Tên không gian làm việc", "name")}
          <input
            type="text"
            {...register("name")}
            className={fieldClass("name", inputClass)}
            placeholder="Nhập tên không gian làm việc"
          />
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
        </div>

        <div>
          {label("Loại không gian làm việc", "workspaceTypeId")}
          <select {...register("workspaceTypeId")} className={fieldClass("workspaceTypeId", selectClass)}>
            <option value="">Chọn loại không gian</option>
            {workspaceTypes.map((wt) => (
              <option key={wt.id} value={wt.id}>
                {wt.name}
              </option>
            ))}
          </select>
          {errors.workspaceTypeId && (
            <p className="mt-1 text-xs text-danger">{errors.workspaceTypeId.message}</p>
          )}
        </div>

        <div>
          {label("Phong cách", "styleCode")}
          <select {...register("styleCode")} className={fieldClass("styleCode", selectClass)}>
            <option value="">Chọn phong cách</option>
            {styles.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
          {errors.styleCode && <p className="mt-1 text-xs text-danger">{errors.styleCode.message}</p>}
        </div>

        <div>
          {label("Vị trí", "locationType")}
          <select {...register("locationType")} className={fieldClass("locationType", selectClass)}>
            {locationTypes.map((lt) => (
              <option key={lt} value={lt}>
                {lt}
              </option>
            ))}
          </select>
        </div>

        <div>
          {label("Mục đích", "workPurpose")}
          <select {...register("workPurpose")} className={fieldClass("workPurpose", selectClass)}>
            {workPurposes.map((wp) => (
              <option key={wp} value={wp}>
                {wp}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 border-t border-gray-100 pt-4">
        <p className="mb-3 text-sm font-medium text-gray-700">
          Thông tin bổ sung <span className="font-normal text-gray-400">(không bắt buộc)</span>
        </p>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="noDesk"
            {...register("noDesk")}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
          />
          <label htmlFor="noDesk" className="text-sm text-gray-700 cursor-pointer">
            Không gian này không có bàn làm việc
          </label>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            {label("Ánh sáng", "lighting")}
            <select {...register("lighting")} className={fieldClass("lighting", selectClass)}>
              <option value="">-- Chưa rõ --</option>
              {lightingTypes.map((lt) => (
                <option key={lt} value={lt}>
                  {lt}
                </option>
              ))}
            </select>
          </div>

          <div>
            {label("Loại bàn", "deskType")}
            <select
              {...register("deskType")}
              disabled={noDesk}
              className={fieldClass("deskType", selectClass)}
            >
              <option value="">-- Chưa rõ --</option>
              {deskTypes.map((dt) => (
                <option key={dt} value={dt}>
                  {dt}
                </option>
              ))}
            </select>
          </div>

          <div>
            {label("Diện tích bàn (m²)", "deskArea")}
            <input
              type="number"
              min={0}
              step={0.1}
              {...register("deskArea")}
              disabled={noDesk}
              className={fieldClass("deskArea", inputClass)}
              placeholder="Chưa rõ"
            />
            {errors.deskArea && <p className="mt-1 text-xs text-danger">{errors.deskArea.message}</p>}
          </div>

          <div>
            {label("Hướng bàn", "deskOrientation")}
            <select
              {...register("deskOrientation")}
              disabled={noDesk}
              className={fieldClass("deskOrientation", selectClass)}
            >
              <option value="">-- Chưa rõ --</option>
              {compassDirections.map((cd) => (
                <option key={cd} value={cd}>
                  {cd}
                </option>
              ))}
            </select>
          </div>

          <div>
            {label("Hướng phòng", "roomFacingDirection")}
            <select
              {...register("roomFacingDirection")}
              className={fieldClass("roomFacingDirection", selectClass)}
            >
              <option value="">-- Chưa rõ --</option>
              {compassDirections.map((cd) => (
                <option key={cd} value={cd}>
                  {cd}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Mở la bàn trên điện thoại, đứng quay mặt theo hướng nhìn của bàn/cửa để xác định hướng
          bàn/hướng phòng.
        </p>
      </div>

      {!isEditMode && (
        <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
          <input
            type="checkbox"
            id="isDefaultWorkspace"
            {...register("isDefault")}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
          />
          <label htmlFor="isDefaultWorkspace" className="text-sm font-medium text-gray-700 cursor-pointer">
            Đặt làm không gian mặc định
          </label>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {isSubmitting
            ? isEditMode
              ? "Đang cập nhật..."
              : "Đang tạo..."
            : isEditMode
              ? "Cập nhật"
              : "Tạo không gian"}
        </button>
      </div>
    </form>
  );
}
