import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Bot, ImagePlus, Loader2, Send, Sparkles, User } from "lucide-react";
import { useAiChat } from "@/features/chatbox/hooks/useAiChat";
import { useImageAttachments } from "@/features/chatbox/hooks/useImageAttachments";
import AiActivityIndicator from "@/features/chatbox/components/AiActivityIndicator";
import AttachmentPreviewRow from "@/features/chatbox/components/AttachmentPreviewRow";
import Markdown from "@/features/chatbox/components/Markdown";

const SUGGESTIONS = [
  "Cây để bàn nào hợp mệnh Mộc?",
  "Gợi ý sản phẩm phong thủy cho không gian làm việc của tôi",
  "Màu sắc nào hợp với tuổi của tôi?",
  "Sản phẩm nào đang bán chạy?",
];

export default function AiChatPage() {
  const [params] = useSearchParams();
  const productId = params.get("productId") ?? undefined;
  const { messages, sending, activity, send, uploadImage } = useAiChat(productId);
  const [draft, setDraft] = useState("");
  const att = useImageAttachments(uploadImage);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activity]);

  // Chỉ cho gửi khi có nội dung/ảnh, không đang gửi và KHÔNG còn ảnh đang upload dở.
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
    <div className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-3xl flex-col px-4">
      {/* Khu hội thoại */}
      <div className="scrollbar-none flex-1 overflow-y-auto py-6">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/30">
              <Sparkles size={30} />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-gray-900">Trợ lý Phong Thủy FengDesk</h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">
              Hỏi mình về cây phong thủy, sản phẩm hợp mệnh, hay cách bố trí không gian làm việc.
              Mình có thể tra cứu hồ sơ, không gian và sản phẩm thật để tư vấn cho bạn.
            </p>
            <div className="mt-6 grid w-full max-w-lg gap-2 sm:grid-cols-2">
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
          <div className="flex flex-col gap-5">
            {messages.map((m) =>
              m.role === "system" ? null : (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      m.role === "user" ? "bg-gray-200 text-gray-600" : "bg-primary/15 text-primary"
                    }`}
                  >
                    {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
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
              <div className="pl-11">
                <AiActivityIndicator activity={activity} />
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-gray-100 bg-white/80 py-3 backdrop-blur">
        <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
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
    </div>
  );
}
