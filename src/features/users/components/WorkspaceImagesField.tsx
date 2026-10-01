import { useEffect, useMemo, useRef } from "react";
import { ImagePlus, Sparkles, X } from "lucide-react";
import { IMAGE_UPLOAD_ACCEPT } from "@/utils/imageResize";
import { MAX_WORKSPACE_IMAGES } from "../hooks/useWorkspace";
import type { WorkspaceImage } from "../types/workspace";

/** Thay đổi ảnh đang soạn trong form — form áp dụng SAU khi lưu phòng (lúc đó mới có id phòng). */
export interface WorkspaceImagesValue {
  /** Ảnh đã lưu mà user gỡ ra. */
  removedIds: string[];
  /** Ảnh đã nằm trên storage cần thêm — hiện là ảnh user gửi cho AI intake. */
  urls: string[];
  /** File mới chọn từ máy. */
  files: File[];
}

interface WorkspaceImagesFieldProps {
  /** Ảnh đã lưu của phòng (edit mode). */
  existing: WorkspaceImage[];
  value: WorkspaceImagesValue;
  onChange: (value: WorkspaceImagesValue) => void;
}

/** Ô "Ảnh không gian" trong form tạo/sửa phòng — nhiều ảnh, gỡ từng ảnh, tối đa MAX_WORKSPACE_IMAGES. */
export default function WorkspaceImagesField({
  existing,
  value,
  onChange,
}: WorkspaceImagesFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Object URL của file vừa chọn — thu hồi khi danh sách đổi / unmount để không rò bộ nhớ.
  const fileUrls = useMemo(() => value.files.map((f) => URL.createObjectURL(f)), [value.files]);
  useEffect(() => () => fileUrls.forEach((u) => URL.revokeObjectURL(u)), [fileUrls]);

  const kept = existing.filter((img) => !value.removedIds.includes(img.id));
  const total = kept.length + value.urls.length + value.files.length;
  const room = MAX_WORKSPACE_IMAGES - total;

  const tiles = [
    ...kept.map((img) => ({
      key: img.id,
      src: img.url,
      fromAi: false,
      remove: () => onChange({ ...value, removedIds: [...value.removedIds, img.id] }),
    })),
    ...value.urls.map((url) => ({
      key: url,
      src: url,
      fromAi: true,
      remove: () => onChange({ ...value, urls: value.urls.filter((u) => u !== url) }),
    })),
    ...value.files.map((file, i) => ({
      key: `${file.name}-${i}`,
      src: fileUrls[i],
      fromAi: false,
      remove: () => onChange({ ...value, files: value.files.filter((_, j) => j !== i) }),
    })),
  ];

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-700">
        Ảnh không gian{" "}
        <span className="font-normal text-gray-400">
          (tuỳ chọn {total}/{MAX_WORKSPACE_IMAGES})
        </span>
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={IMAGE_UPLOAD_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? []).slice(0, room);
          if (picked.length) onChange({ ...value, files: [...value.files, ...picked] });
          e.target.value = "";
        }}
      />
      <div className="grid grid-cols-4 gap-2">
        {tiles.map((tile) => (
          <div
            key={tile.key}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-gray-200"
          >
            <img src={tile.src} alt="Ảnh không gian" className="h-full w-full object-cover" />
            {tile.fromAi && (
              <span
                className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded bg-primary/90 px-1 py-px text-[9px] font-semibold text-white"
                title="Ảnh bạn đã gửi cho AI - sẽ lưu làm ảnh không gian"
              >
                <Sparkles size={9} />
              </span>
            )}
            <button
              type="button"
              onClick={tile.remove}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white opacity-80 transition-opacity hover:bg-red-500 hover:opacity-100 cursor-pointer"
              title="Gỡ ảnh"
            >
              <X size={11} />
            </button>
          </div>
        ))}
        {room > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 text-[11px] text-gray-500 transition-colors hover:border-primary/50 hover:text-primary cursor-pointer"
          >
            <ImagePlus size={16} />
            Thêm ảnh
          </button>
        )}
      </div>
    </div>
  );
}
