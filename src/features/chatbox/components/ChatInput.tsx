import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { ImagePlus, Loader2, Send, Sparkles } from "lucide-react";
import { useImageAttachments, type UploadFn } from "@/features/chatbox/hooks/useImageAttachments";
import AttachmentPreviewRow from "./AttachmentPreviewRow";

/** Phát hiện lệnh @AI trong nội dung đang gõ (khớp regex BE: word-boundary, không phân biệt hoa thường). */
const AI_MENTION = /(^|\s)@ai\b/i;

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Gửi tin: nội dung + link ảnh đã upload xong. */
  onSubmit: (content: string, imageUrls: string[]) => void;
  /** Upload 1 ảnh (trả link). Có → hiện nút đính kèm ảnh. */
  onUpload?: UploadFn;
  /** Báo trạng thái @AI đang bật lên trên → khung chat (panel) tự sáng viền, không cần bọc hộp riêng. */
  onAiActiveChange?: (active: boolean) => void;
  disabled?: boolean;
  isSending?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  onUpload,
  onAiActiveChange,
  disabled = false,
  isSending = false,
  placeholder = "Nhập tin nhắn...",
}: ChatInputProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const att = useImageAttachments(onUpload ?? (async () => ""));
  const aiActive = AI_MENTION.test(value);

  // Đẩy trạng thái @AI lên panel để sáng viền KHUNG CHAT, thay vì bọc thêm 1 hộp viền quanh ô nhập.
  // Cleanup khi unmount (rời phòng) → tắt glow để panel không kẹt sáng.
  useEffect(() => {
    onAiActiveChange?.(aiActive);
    return () => onAiActiveChange?.(false);
  }, [aiActive, onAiActiveChange]);

  // Chỉ cho gửi khi có nội dung/ảnh, không đang gửi và KHÔNG còn ảnh đang upload dở.
  const hasContent = value.trim().length > 0 || att.urls.length > 0;
  const canSend = hasContent && !disabled && !isSending && !att.uploading;

  const submit = () => {
    if (!canSend) return;
    onSubmit(value.trim(), att.urls);
    onChange("");
    att.clear();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative border-t border-gray-100 bg-white px-3 py-3">
      <AttachmentPreviewRow items={att.items} onRemove={att.remove} />

      {/* Không bọc hộp viền quanh ô nhập nữa — viền sáng được chuyển lên KHUNG CHAT (panel) qua onAiActiveChange. */}
      <div className="relative flex items-end gap-2">
        {aiActive && (
          // Badge nằm NGANG mép trên ô nhập (đầu ô chat), căn giữa.
          <div className="ai-badge-up pointer-events-none absolute -top-2.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary shadow-sm backdrop-blur">
            <Sparkles size={11} />
            Đang gọi trợ lý AI
          </div>
        )}
        {onUpload && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/bmp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) att.add(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={disabled || isSending}
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              aria-label="Gửi ảnh"
            >
              <ImagePlus size={18} />
            </button>
          </>
        )}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled || isSending}
          placeholder={placeholder}
          className="max-h-24 min-h-[42px] flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!canSend}
          title={att.uploading ? "Đang tải ảnh, vui lòng đợi..." : undefined}
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          aria-label="Gửi tin nhắn"
        >
          {isSending || att.uploading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
      <p className="mt-1.5 text-[10px] text-gray-400">
        Enter để gửi · Shift+Enter xuống dòng · gõ <span className="text-primary">@AI</span> để hỏi
        trợ lý
      </p>
    </form>
  );
}
