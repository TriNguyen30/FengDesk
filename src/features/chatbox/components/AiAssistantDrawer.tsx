import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Bot, ImagePlus, Loader2, Send, Sparkles, User, X } from "lucide-react";
import { useAiChat } from "@/features/chatbox/hooks/useAiChat";
import { useImageAttachments } from "@/features/chatbox/hooks/useImageAttachments";
import AiActivityIndicator from "./AiActivityIndicator";
import AttachmentPreviewRow from "./AttachmentPreviewRow";
import ConfirmDeleteButton from "./ConfirmDeleteButton";
import Markdown from "./Markdown";

const SUGGESTIONS = [
  "Cây để bàn nào hợp mệnh Mộc?",
  "Gợi ý sản phẩm phong thủy cho không gian làm việc của tôi",
  "Màu sắc nào hợp với tuổi của tôi?",
  "Sản phẩm nào đang bán chạy?",
];

interface AiAssistantDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Mở kèm ngữ cảnh sản phẩm (vd từ trang chi tiết). */
  productId?: string;
}

/**
 * Trợ lý AI dạng KHUNG CHAT trượt ra từ bên phải (thay cho trang full-screen cũ).
 * Tông xanh brand. Chat thuần AI — không cần @AI. aiStatus realtime hiển thị trong khung.
 */
export default function AiAssistantDrawer({ open, onClose, productId }: AiAssistantDrawerProps) {
  const { messages, sending, activity, send, uploadImage, loadHistory, clearConversation } =
    useAiChat(productId);
  const [draft, setDraft] = useState("");
  const att = useImageAttachments(uploadImage);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Mở khung → nạp lại hội thoại AI đã lưu (giữ hội thoại ở khung lớn sau reload).
  useEffect(() => {
    if (open) void loadHistory();
  }, [open, loadHistory]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activity, open]);

  // ESC để đóng + khóa cuộn nền khi mở.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const canSend = (draft.trim().length > 0 || att.urls.length > 0) && !sending && !att.uploading;

  const submit = () => {
    if (!canSend) return;
    send(draft.trim(), att.urls);
    setDraft("");
    att.clear();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-gray-900/30 backdrop-blur-[1px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer trượt từ phải — viền trái sáng xanh (khung AI). */}
      <aside
        role="dialog"
        aria-label="Trợ lý Phong Thủy"
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 flex h-dvh w-[min(100vw,28rem)] flex-col border-l-2 border-primary/40 bg-white shadow-2xl ring-1 ring-primary/10 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header xanh brand */}
        <header className="flex items-center justify-between gap-2 bg-primary px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <Sparkles size={18} />
            </span>
            <div>
              <h2 className="text-sm font-bold leading-tight">Trợ lý Phong Thủy</h2>
              <p className="text-[11px] text-white/80">FengDesk AI</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ConfirmDeleteButton
              onConfirm={() => void clearConversation()}
              disabled={messages.length === 0}
              size={17}
              label="Xóa hội thoại"
              idleClassName="text-white/90 hover:bg-white/15"
            />
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/90 transition-colors hover:bg-white/15 cursor-pointer"
              aria-label="Đóng trợ lý"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Khu hội thoại — nền nhẹ #f9fafb */}
        <div className="scrollbar-none flex-1 overflow-y-auto bg-[#f9fafb] px-4 py-5">
          {isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/30">
                <Sparkles size={26} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">Trợ lý Phong Thủy FengDesk</h3>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-gray-500">
                Hỏi mình về cây phong thủy, sản phẩm hợp mệnh, hay cách bố trí không gian làm việc.
              </p>
              <div className="mt-5 grid w-full gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((m) =>
                m.role === "system" ? null : (
                  <div
                    key={m.id}
                    className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        m.role === "user"
                          ? "bg-gray-200 text-gray-600"
                          : "bg-primary/15 text-primary"
                      }`}
                    >
                      {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
                    </span>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "rounded-tr-md bg-primary text-white"
                          : "rounded-tl-md border border-gray-200 bg-white text-gray-800"
                      }`}
                    >
                      {m.images.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          {m.images.map((url) => (
                            <img
                              key={url}
                              src={url}
                              alt="Ảnh"
                              className="max-h-40 rounded-lg border border-black/10 object-cover"
                            />
                          ))}
                        </div>
                      )}
                      {m.content &&
                        (m.role === "ai" ? (
                          <Markdown text={m.content} />
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        ))}
                    </div>
                  </div>
                ),
              )}
              {activity && (
                <div className="pl-10">
                  <AiActivityIndicator activity={activity} />
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-gray-100 bg-white px-3 py-3">
          <div className="rounded-2xl border border-gray-200 bg-[#f9fafb] p-2 transition-colors focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20">
            <AttachmentPreviewRow items={att.items} onRemove={att.remove} />
            <div className="flex items-end gap-2">
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
                disabled={sending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                aria-label="Đính kèm ảnh"
              >
                <ImagePlus size={18} />
              </button>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Hỏi trợ lý phong thủy..."
                className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={submit}
                disabled={!canSend}
                title={att.uploading ? "Đang tải ảnh, vui lòng đợi..." : undefined}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                aria-label="Gửi"
              >
                {sending || att.uploading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-gray-400">
            Trợ lý có thể đưa thông tin chưa chính xác — hãy kiểm chứng khi cần.
          </p>
        </div>
      </aside>
    </>
  );
}
