import { useRef, type FormEvent, type KeyboardEvent } from "react";
import { ImagePlus, Loader2, Send, Sparkles } from "lucide-react";

/** Phát hiện lệnh @AI trong nội dung đang gõ (khớp regex BE: word-boundary, không phân biệt hoa thường). */
const AI_MENTION = /(^|\s)@ai\b/i;

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onPickImage?: (file: File) => void;
  disabled?: boolean;
  isSending?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  onPickImage,
  disabled = false,
  isSending = false,
  placeholder = "Nhập tin nhắn...",
}: ChatInputProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const aiActive = AI_MENTION.test(value);

  const submit = () => {
    if (!value.trim() || disabled || isSending) return;
    onSubmit();
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
      {aiActive && (
        <div className="pointer-events-none absolute -top-2 left-3 z-10 flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary shadow-sm backdrop-blur">
          <Sparkles size={11} />
          Đang gọi trợ lý AI
        </div>
      )}
      <div
        className={`flex items-end gap-2 rounded-2xl transition-all ${
          aiActive ? "bg-primary/5 p-2 ring-2 ring-primary/50" : ""
        }`}
      >
        {onPickImage && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/bmp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onPickImage(file);
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
          disabled={disabled || isSending || !value.trim()}
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          aria-label="Gửi tin nhắn"
        >
          {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
      <p className="mt-1.5 text-[10px] text-gray-400">
        Enter để gửi · Shift+Enter xuống dòng · gõ <span className="text-primary">@AI</span> để hỏi trợ lý
      </p>
    </form>
  );
}
