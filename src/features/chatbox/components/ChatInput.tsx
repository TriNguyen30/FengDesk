import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Loader2, Send } from "lucide-react";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  isSending?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  disabled = false,
  isSending = false,
  placeholder = "Nhập tin nhắn...",
}: ChatInputProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isSending) return;
    onSend(trimmed);
    setValue("");
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
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-100 bg-white px-3 py-3"
    >
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
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
      <p className="mt-1.5 text-[10px] text-gray-400">Enter để gửi · Shift+Enter xuống dòng</p>
    </form>
  );
}
