import { useRef } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { IMAGE_UPLOAD_ACCEPT } from "@/utils/imageResize";
import { MAX_WORKSPACE_IMAGES, useWorkspaceImages } from "../hooks/useWorkspace";
import type { Workspace } from "../types/workspace";

/** Nút nhỏ trên nền ảnh — kính mờ trộn từ màu bề mặt nên đọc được trên mọi ảnh, cả theme tối. */
const BUTTON_CLASS =
  "fd-glass flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:text-primary disabled:opacity-50 cursor-pointer";

interface WorkspaceCoverControlsProps {
  workspace: Workspace;
  /** Ảnh đang hiện trong trình chiếu — "Gỡ ảnh này" gỡ đúng ảnh đó. */
  index: number;
  onSelect: (index: number) => void;
  /** Rê chuột vào cụm điều khiển thì dừng trình chiếu, để không gỡ nhầm ảnh vừa đổi. */
  onPauseChange: (paused: boolean) => void;
}

/** Chấm chọn ảnh + thêm ảnh (nhiều ảnh một lần) + gỡ ảnh đang hiện — ngay trên thẻ tổng quan. */
export default function WorkspaceCoverControls({
  workspace,
  index,
  onSelect,
  onPauseChange,
}: WorkspaceCoverControlsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { add, remove, busy } = useWorkspaceImages(workspace.id);
  const images = workspace.images;
  const current = images[index];
  const room = MAX_WORKSPACE_IMAGES - images.length;

  const onPick = (list: FileList | null) => {
    const files = Array.from(list ?? []).slice(0, room);
    if (files.length === 0) return;
    add.mutate(files, {
      onSuccess: () => toast.success(`Đã thêm ${files.length} ảnh không gian`),
      onError: () => toast.error("Không tải được ảnh lên"),
    });
  };

  const onRemove = () => {
    if (!current) return;
    remove.mutate(current.id, {
      onSuccess: () => toast.success("Đã gỡ ảnh không gian"),
      onError: () => toast.error("Không gỡ được ảnh"),
    });
  };

  return (
    <div
      className="flex items-center gap-1.5"
      onMouseEnter={() => onPauseChange(true)}
      onMouseLeave={() => onPauseChange(false)}
    >
      {images.length > 1 && (
        <div className="fd-glass mr-1 flex items-center gap-1 rounded-full px-2 py-1.5">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => onSelect(i)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === index ? "w-4 bg-primary" : "w-1.5 bg-gray-400/70 hover:bg-gray-500"
              }`}
              title={`Ảnh ${i + 1}/${images.length}`}
            />
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={IMAGE_UPLOAD_ACCEPT}
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files);
          // Cho phép chọn lại đúng file vừa chọn (onChange không bắn nếu value không đổi).
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={busy || room <= 0}
        onClick={() => inputRef.current?.click()}
        className={BUTTON_CLASS}
        title={room > 0 ? "Thêm ảnh chụp không gian" : `Tối đa ${MAX_WORKSPACE_IMAGES} ảnh`}
      >
        {add.isPending ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
        Thêm ảnh
      </button>
      {current && (
        <button
          type="button"
          disabled={busy}
          onClick={onRemove}
          className={`${BUTTON_CLASS} hover:!text-red-500`}
          title={images.length > 1 ? "Gỡ ảnh đang hiện" : "Gỡ ảnh nền"}
        >
          {remove.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      )}
    </div>
  );
}
