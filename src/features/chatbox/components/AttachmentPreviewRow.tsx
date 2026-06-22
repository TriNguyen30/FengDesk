import { AlertCircle, Loader2, X } from "lucide-react";
import type { Attachment } from "@/features/chatbox/hooks/useImageAttachments";

interface AttachmentPreviewRowProps {
  items: Attachment[];
  onRemove: (id: string) => void;
}

/** Hàng preview ảnh đính kèm: overlay spinner khi đang upload, dấu x để hủy/gỡ. */
export default function AttachmentPreviewRow({ items, onRemove }: AttachmentPreviewRowProps) {
  if (items.length === 0) return null;

  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {items.map((it) => (
        <div
          key={it.id}
          className="group relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
        >
          <img src={it.previewUrl} alt="Ảnh đính kèm" className="h-full w-full object-cover" />

          {it.status === "uploading" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 size={18} className="animate-spin text-white" />
            </div>
          )}
          {it.status === "error" && (
            <div className="absolute inset-0 flex items-center justify-center bg-danger/50">
              <AlertCircle size={18} className="text-white" />
            </div>
          )}

          <button
            type="button"
            onClick={() => onRemove(it.id)}
            className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900/70 text-white transition-colors hover:bg-gray-900 cursor-pointer"
            aria-label={it.status === "uploading" ? "Hủy tải ảnh" : "Gỡ ảnh"}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
