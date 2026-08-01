import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { Bot, ImagePlus, Loader2, Pencil, Send, Sparkles, User, X } from "lucide-react";
import { useAiChat, type AiMessage } from "@/features/chatbox/hooks/useAiChat";
import { useImageAttachments } from "@/features/chatbox/hooks/useImageAttachments";
import { AiActivityIndicator } from "@/features/shared/ai-activity";
import LiquidMeshBackground from "@/components/ui/LiquidMeshBackground";
import { useLiquidChat } from "@/utils/appearance";
import AttachmentPreviewRow from "./AttachmentPreviewRow";
import ConfirmDeleteButton from "./ConfirmDeleteButton";
import Markdown from "./Markdown";
import PaymentAttachment from "./PaymentAttachment";
import { extractPaymentBlock } from "@/features/chatbox/utils/paymentBlock";

const SUGGESTIONS = [
  "Cây để bàn nào hợp mệnh Mộc?",
  "Gợi ý sản phẩm phong thủy cho không gian làm việc của tôi",
  "Màu sắc nào hợp với tuổi của tôi?",
  "Sản phẩm nào đang bán chạy?",
];

const DEFAULT_DRAWER_WIDTH = 448;

const getDrawerWidthLimits = (viewportWidth: number) => {
  const minWidth = Math.min(viewportWidth, DEFAULT_DRAWER_WIDTH);
  const maxWidth = Math.max(minWidth, Math.floor(viewportWidth * 0.5));
  const midWidth = Math.round((minWidth + maxWidth) / 2);
  return { minWidth, maxWidth, midWidth };
};

const clampDrawerWidth = (value: number, viewportWidth: number) => {
  const { minWidth, maxWidth } = getDrawerWidthLimits(viewportWidth);
  return Math.min(maxWidth, Math.max(minWidth, value));
};

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
  const {
    messages,
    sending,
    activity,
    narrations,
    contextMessages,
    send,
    rewind,
    uploadImage,
    loadHistory,
    loadMore,
    hasMore,
    loadingMore,
    clearConversation,
  } = useAiChat(productId);

  // Narration neo vào SAU tin user cuối (trước câu trả lời của lượt đó) — không nằm cuối danh sách,
  // để khi câu trả lời cuối về thì thinking block vẫn đứng đúng thứ tự thời gian.
  const lastUserIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") return i;
    }
    return -1;
  })();

  // Mốc "AI context limit": index tin CŨ NHẤT còn nằm trong cửa sổ nhớ gửi LLM.
  // Chỉ vẽ khi có tin bị cắt (messages dài hơn cửa sổ); bỏ qua tin system (không render).
  const contextBoundaryIdx = (() => {
    if (contextMessages == null || messages.length <= contextMessages) return -1;
    for (let i = messages.length - contextMessages; i < messages.length; i++) {
      if (messages[i].role !== "system") return i;
    }
    return -1;
  })();
  const [draft, setDraft] = useState("");
  const [drawerWidth, setDrawerWidth] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_DRAWER_WIDTH;
    return clampDrawerWidth(DEFAULT_DRAWER_WIDTH, window.innerWidth);
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isHoveringResizeHandle, setIsHoveringResizeHandle] = useState(false);
  const att = useImageAttachments(uploadImage);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Phân trang lịch sử: container cuộn + giữ vị trí cuộn khi prepend tin cũ (tránh nhảy).
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const prependingRef = useRef(false);
  // Đã hoàn tất cú nhảy xuống đáy đầu tiên sau khi mở chưa. Khi chưa: cuộn đáy phải là NHẢY TỨC THÌ
  // (không smooth) và scroll-event bị bỏ qua — vì smooth animation đi ngang vùng scrollTop < 60 sẽ
  // kích hoạt load-more, prepend tin cũ hủy animation giữa chừng → kẹt lơ lửng trước đáy.
  const initialScrolledRef = useRef(false);
  // Kéo resize ghi thẳng width vào DOM node này (không qua state) — xem `startResize`.
  const asideRef = useRef<HTMLElement>(null);
  /** Vị trí chuột lúc bấm xuống viền: vừa để tính width, vừa để phân biệt "click" với "kéo". */
  const resizeStartRef = useRef<{ x: number; y: number } | null>(null);
  /** Width mới nhất trong lúc kéo — chỉ đẩy vào React state một lần khi thả chuột. */
  const resizeWidthRef = useRef<number>(DEFAULT_DRAWER_WIDTH);

  // Rewind (sửa & gửi lại tin của mình): id tin đang sửa + nội dung nháp.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const editingIndex = editingId ? messages.findIndex((m) => m.id === editingId) : -1;

  const startEdit = (m: AiMessage) => {
    setEditingId(m.id);
    setEditText(m.content);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };
  const submitEdit = () => {
    const text = editText.trim();
    if (!editingId || !text) return;
    void rewind(editingId, text);
    setEditingId(null);
    setEditText("");
  };
  const handleEditKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Đang gõ IME (tiếng Việt Telex/VNI…): Enter là để CHỐT từ, không phải để gửi. Bỏ qua — nếu
    // xử lý ngay thì editText chưa nhận ký tự vừa compose → gửi nhầm nội dung cũ.
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitEdit();
    } else if (e.key === "Escape") {
      e.stopPropagation(); // đừng để Escape lan lên document listener và đóng luôn cả drawer
      cancelEdit();
    }
  };

  // Mở khung → nạp lại hội thoại AI đã lưu (giữ hội thoại ở khung lớn sau reload).
  useEffect(() => {
    if (open) {
      initialScrolledRef.current = false; // mỗi lần mở lại → nhảy đáy tức thì 1 lần nữa
      void loadHistory();
    }
  }, [open, loadHistory]);

  // Khôi phục vị trí cuộn sau khi prepend tin cũ (layout-effect chạy TRƯỚC effect cuộn-đáy, trước khi
  // paint) → bù đúng phần chiều cao mới thêm ở trên, không reset cờ ở đây (để effect dưới biết mà bỏ cuộn đáy).
  useLayoutEffect(() => {
    if (!prependingRef.current) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
  }, [messages]);

  useEffect(() => {
    // Vừa prepend tin cũ (kéo lên) → giữ vị trí đang đọc, bỏ qua cuộn đáy đúng 1 lần rồi reset cờ.
    if (prependingRef.current) {
      prependingRef.current = false;
      prevScrollHeightRef.current = 0;
      return;
    }
    if (!open) return;
    if (!initialScrolledRef.current) {
      // Lần đầu sau khi mở: nhảy thẳng xuống đáy (không animation — xem chú thích initialScrolledRef).
      bottomRef.current?.scrollIntoView();
      if (messages.length > 0) initialScrolledRef.current = true;
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activity, narrations, open]);

  // Trigger nạp tin cũ hơn (dùng chung cho scroll gần đỉnh + nút bấm). Ghi scrollHeight để bù vị trí.
  const triggerLoadMore = () => {
    const el = scrollRef.current;
    if (!el || !hasMore || loadingMore) return;
    prevScrollHeightRef.current = el.scrollHeight;
    prependingRef.current = true;
    void loadMore();
  };

  const handleMessagesScroll = () => {
    if (!initialScrolledRef.current) return; // đang nhảy xuống đáy lúc mở — đừng nhầm là user kéo lên
    if (scrollRef.current && scrollRef.current.scrollTop < 60) triggerLoadMore();
  };

  useEffect(() => {
    const handleResize = () => {
      setDrawerWidth((prev) => clampDrawerWidth(prev, window.innerWidth));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Kéo resize: KHÔNG setState mỗi lần chuột nhích. Mỗi lần setState ở đây sẽ render lại toàn bộ
  // khung chat (danh sách tin + Markdown) — đó là nguyên nhân kéo bị lag. Trong lúc kéo chỉ ghi
  // thẳng `style.width` vào DOM node; React chỉ được biết một lần duy nhất lúc thả chuột.
  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (event: globalThis.MouseEvent) => {
      const aside = asideRef.current;
      if (!aside || resizeStartRef.current == null) return;
      // Bám 1:1 theo con trỏ. Bản cũ nội suy 22%/frame nên viền luôn chạy sau tay → cảm giác ì.
      const next = clampDrawerWidth(window.innerWidth - event.clientX, window.innerWidth);
      resizeWidthRef.current = next;
      aside.style.width = `${next}px`;
    };

    const handlePointerUp = (event: globalThis.MouseEvent) => {
      const start = resizeStartRef.current;
      setIsResizing(false);
      resizeStartRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      // Bấm vào viền mà gần như không di chuyển = click → nhảy sang mốc rộng kế tiếp.
      if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) <= 8) {
        cycleDrawerWidth();
        return;
      }
      setDrawerWidth(resizeWidthRef.current);
    };

    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  // ESC để đóng + khóa cuộn nền khi mở.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const canSend =
    (draft.trim().length > 0 || att.urls.length > 0) && !sending && !att.uploading && !editingId;

  const submit = () => {
    if (!canSend) return;
    send(draft.trim(), att.urls);
    setDraft("");
    att.clear();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return; // đang gõ IME → Enter để chốt từ, đừng gửi (xem handleEditKeyDown)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const startResize = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    resizeStartRef.current = { x: event.clientX, y: event.clientY };
    resizeWidthRef.current = drawerWidth;
    setIsResizing(true);
  };

  const cycleDrawerWidth = () => {
    if (typeof window === "undefined") return;

    const { minWidth, maxWidth, midWidth } = getDrawerWidthLimits(window.innerWidth);
    setDrawerWidth((currentWidth) => {
      const current = Math.round(currentWidth);
      if (current <= Math.round(minWidth + 2)) return midWidth;
      if (Math.abs(current - midWidth) <= 8) return maxWidth;
      return minWidth;
    });
  };

  const isEmpty = messages.length === 0;
  const liquidChat = useLiquidChat();

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
        ref={asideRef}
        role="dialog"
        aria-label="Lumi AI Assistant "
        aria-hidden={!open}
        style={{
          width: `${drawerWidth}px`,
          // Đang kéo thì TẮT transition width: mỗi lần ghi width sẽ khởi động lại một animation 300ms,
          // viền không bao giờ đuổi kịp con trỏ. Chỉ giữ transition cho lúc click nhảy mốc.
          transition: isResizing
            ? "translate 300ms cubic-bezier(0, 0, 0.2, 1), transform 300ms cubic-bezier(0, 0, 0.2, 1)"
            : "width 300ms cubic-bezier(0, 0, 0.2, 1), translate 300ms cubic-bezier(0, 0, 0.2, 1), transform 300ms cubic-bezier(0, 0, 0.2, 1)",
        }}
        className={`fixed right-0 top-0 z-50 flex h-dvh flex-col border-l-2 border-primary/40 bg-white shadow-2xl ring-1 ring-primary/10 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div
          data-drawer-interaction="resize-handle"
          // z-10: phải nằm trên nội dung, vì giờ đây CHỈ dải viền này mới kích hoạt resize.
          className={`absolute left-0 top-0 z-10 h-full w-4 cursor-ew-resize touch-none transition-colors duration-200 ${
            isResizing
              ? "bg-primary/10"
              : isHoveringResizeHandle
                ? "bg-primary/5"
                : "bg-transparent"
          }`}
          onMouseDown={startResize}
          onMouseEnter={() => setIsHoveringResizeHandle(true)}
          onMouseLeave={() => setIsHoveringResizeHandle(false)}
          aria-hidden="true"
        />
        {/* Header xanh brand */}
        <header className="flex items-center justify-between gap-2 bg-primary px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <Sparkles size={18} />
            </span>
            <div>
              <h2 className="text-sm font-bold leading-tight">Lumi AI Assistant</h2>
              <p className="text-[11px] text-white/80">FengDesk</p>
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

        {/* Khu hội thoại — nền là mặt chất lỏng WebGL khúc xạ lớp ambient
            (mảng mây + fluid ASCII) đang nằm sau drawer.
            Canvas nằm ngoài vùng cuộn (nếu để bên trong thì nó trôi theo nội
            dung); bg-gray-50 của lớp bọc là nền dự phòng khi WebGL không dựng
            được hoặc người dùng bật "giảm chuyển động". */}
        <div className="relative isolate flex-1 overflow-hidden bg-gray-50">
          {liquidChat && <LiquidMeshBackground active={open} className="absolute inset-0 -z-10" />}

          <div
            ref={scrollRef}
            onScroll={handleMessagesScroll}
            className="scrollbar-none h-full overflow-y-auto px-4 py-5"
          >
            {isEmpty ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/30">
                  <Sparkles size={26} />
                </div>
                {/* Nền mờ cục bộ: đây là hai dòng chữ DUY NHẤT nằm trực tiếp trên
                    lớp liquid (tin nhắn thì đã có bong bóng đặc che). Lớp liquid
                    cố ý để tương phản cao nên phải kê chân đế riêng cho chúng. */}
                <div className="mt-4 rounded-2xl bg-neutral/70 px-4 py-3 backdrop-blur-sm">
                  <h3 className="text-lg font-bold text-gray-900">Trợ lý Phong Thủy FengDesk</h3>
                  <p className="mt-2 max-w-xs text-xs leading-relaxed text-gray-600">
                    Hỏi mình về cây phong thủy, sản phẩm hợp mệnh, hay cách bố trí không gian làm
                    việc.
                  </p>
                </div>
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
                {/* Nạp lịch sử cũ hơn: tự động khi kéo lên đỉnh, kèm nút bấm dự phòng chắc chắn. */}
                {hasMore && (
                  <div className="flex justify-center py-1">
                    <button
                      type="button"
                      onClick={triggerLoadMore}
                      disabled={loadingMore}
                      className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500 transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                    >
                      {loadingMore && (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary/40 border-t-transparent" />
                      )}
                      {loadingMore ? "Đang tải..." : "Tải tin nhắn cũ hơn"}
                    </button>
                  </div>
                )}
                {messages.map((m, idx) => {
                  if (m.role === "system") return null;
                  const isUser = m.role === "user";
                  const isEditingThis = editingId === m.id;
                  const isDimmed = editingIndex >= 0 && idx > editingIndex;
                  return (
                    <Fragment key={m.id}>
                      {idx === contextBoundaryIdx && (
                        <div className="flex items-center gap-2 py-2 text-[12px] font-medium tracking-wide text-primary/80 select-none">
                          <span className="flex-1 border-t border-dashed border-primary/30" />
                          AI Context limit here
                          <span className="flex-1 border-t border-dashed border-primary/30" />
                        </div>
                      )}
                      <div
                        data-drawer-interaction="message-bubble-wrapper"
                        className={`group flex items-start gap-2.5 transition-opacity duration-200 ${
                          isUser ? "flex-row-reverse" : ""
                        } ${isDimmed ? "pointer-events-none opacity-40" : ""}`}
                      >
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            isUser ? "bg-gray-200 text-gray-600" : "bg-primary/15 text-primary"
                          }`}
                        >
                          {isUser ? <User size={16} /> : <Bot size={16} />}
                        </span>

                        {isEditingThis ? (
                          <div className="w-full max-w-[92%] rounded-2xl border border-primary bg-white p-2 shadow-sm">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={handleEditKeyDown}
                              rows={2}
                              autoFocus
                              className="max-h-32 w-full resize-none bg-transparent text-sm text-gray-800 outline-none"
                            />
                            <div className="mt-1 flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="rounded-lg px-2.5 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 cursor-pointer"
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                onClick={submitEdit}
                                disabled={!editText.trim()}
                                className="rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                              >
                                Gửi
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            data-drawer-interaction="message-bubble"
                            className={`max-w-[92%] min-w-0 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                              isUser
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
                                    onLoad={() => {
                                      // Ảnh nạp xong mới biết chiều cao → danh sách dài ra SAU khi đã cuộn đáy.
                                      // Nếu đang ở gần đáy thì neo lại đáy, không thì để yên (user đang đọc tin cũ).
                                      const el = scrollRef.current;
                                      if (
                                        el &&
                                        el.scrollHeight - el.scrollTop - el.clientHeight < 200
                                      ) {
                                        bottomRef.current?.scrollIntoView();
                                      }
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                            {m.content &&
                              (m.role === "ai" ? (
                                (() => {
                                  // Tin AI có thể kèm block thanh toán (confirm_order) → tách render card riêng.
                                  const { text, payment } = extractPaymentBlock(m.content);
                                  return (
                                    <>
                                      {text && <Markdown text={text} />}
                                      {payment && <PaymentAttachment payment={payment} />}
                                    </>
                                  );
                                })()
                              ) : (
                                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                              ))}
                          </div>
                        )}

                        {isUser && !isEditingThis && !sending && (
                          <button
                            type="button"
                            onClick={() => startEdit(m)}
                            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center self-center rounded-full text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-primary group-hover:opacity-100"
                            aria-label="Sửa & gửi lại"
                            title="Sửa & gửi lại"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                      </div>

                      {/* Lời dẫn trung gian (narration) — ephemeral, không lưu DB: không bọc khung,
                      chỉ 2 gạch trên/dưới, chữ mờ, giới hạn chiều cao + scroll. Neo sau tin user
                      của lượt hiện tại → câu trả lời cuối về vẫn đứng đúng thứ tự thời gian. */}
                      {idx === lastUserIdx && narrations.length > 0 && (
                        <div className="pl-10">
                          <div className="max-h-30 overflow-y-auto border-y border-gray-200 py-2 font-medium text-gray-500 opacity-90 [&_.fd-md]:text-xs [&_.fd-md]:text-gray-400">
                            {narrations.map((n, i) => (
                              <Markdown key={i} text={n} />
                            ))}
                          </div>
                        </div>
                      )}
                    </Fragment>
                  );
                })}
                {activity && (
                  <div className="pl-10">
                    <AiActivityIndicator activity={activity} />
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
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
