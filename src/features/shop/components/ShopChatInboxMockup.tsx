import { useState } from "react";
import {
  CheckCheck,
  Image as ImageIcon,
  Info,
  MoreHorizontal,
  Paperclip,
  Search,
  Send,
  Smile,
} from "lucide-react";

interface MockMessage {
  id: string;
  from: "customer" | "shop";
  text: string;
  time: string;
  read?: boolean;
}

interface MockConversation {
  id: string;
  name: string;
  avatarColor: string;
  initial: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  online: boolean;
  productHint?: string;
  messages: MockMessage[];
}

const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: "c1",
    name: "Nguyễn Minh Anh",
    avatarColor: "bg-rose-100 text-rose-700",
    initial: "MA",
    lastMessage: "Cho mình hỏi cây tùng la hán size lớn còn không ạ?",
    lastTime: "2 phút",
    unread: 2,
    online: true,
    productHint: "Cây tùng la hán mini",
    messages: [
      { id: "m1", from: "customer", text: "Chào shop ạ", time: "09:12" },
      {
        id: "m2",
        from: "customer",
        text: "Cho mình hỏi cây tùng la hán size lớn còn không ạ?",
        time: "09:13",
      },
      { id: "m3", from: "customer", text: "Mình muốn đặt 2 cây 🌱", time: "09:14" },
    ],
  },
  {
    id: "c2",
    name: "Trần Quốc Khánh",
    avatarColor: "bg-amber-100 text-amber-700",
    initial: "QK",
    lastMessage: "Đơn #A3F812 đã giao chưa shop ơi?",
    lastTime: "18 phút",
    unread: 1,
    online: true,
    messages: [
      { id: "m1", from: "customer", text: "Đơn #A3F812 đã giao chưa shop ơi?", time: "08:55" },
    ],
  },
  {
    id: "c3",
    name: "Lê Phương Thảo",
    avatarColor: "bg-emerald-100 text-emerald-700",
    initial: "PT",
    lastMessage: "Bạn: Mình gửi sau 16h hôm nay nhé ❤️",
    lastTime: "1 giờ",
    unread: 0,
    online: false,
    messages: [
      { id: "m1", from: "customer", text: "Mai shop gửi giúp mình được không?", time: "Hôm qua" },
      { id: "m2", from: "shop", text: "Mình gửi sau 16h hôm nay nhé ❤️", time: "08:02", read: true },
    ],
  },
  {
    id: "c4",
    name: "Phạm Văn Đạt",
    avatarColor: "bg-sky-100 text-sky-700",
    initial: "VĐ",
    lastMessage: "Có giảm thêm cho đơn 3 chậu không shop?",
    lastTime: "3 giờ",
    unread: 0,
    online: false,
    productHint: "Combo chậu sứ phong thuỷ",
    messages: [
      { id: "m1", from: "customer", text: "Có giảm thêm cho đơn 3 chậu không shop?", time: "06:21" },
    ],
  },
  {
    id: "c5",
    name: "Hoàng Thị Linh",
    avatarColor: "bg-violet-100 text-violet-700",
    initial: "HL",
    lastMessage: "Cảm ơn shop nhiều nhé, cây đẹp lắm!",
    lastTime: "Hôm qua",
    unread: 0,
    online: false,
    messages: [
      { id: "m1", from: "customer", text: "Cảm ơn shop nhiều nhé, cây đẹp lắm!", time: "Hôm qua" },
      { id: "m2", from: "shop", text: "Dạ cảm ơn bạn nhiều ạ 🌿", time: "Hôm qua", read: true },
    ],
  },
];

export function ShopChatInboxMockup() {
  const [activeId, setActiveId] = useState(MOCK_CONVERSATIONS[0].id);
  const active = MOCK_CONVERSATIONS.find((c) => c.id === activeId)!;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-700">
        <span className="font-semibold">
          Bản xem trước · Tính năng "Hộp thư shop" đang phát triển, dữ liệu hiển thị là minh hoạ.
        </span>
      </div>

      <div className="grid h-[560px] grid-cols-1 lg:grid-cols-[320px_1fr_280px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {/* ── Conversation list ── */}
        <aside className="flex flex-col border-r border-gray-100">
          <div className="border-b border-gray-100 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                disabled
                placeholder="Tìm kiếm tin nhắn..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-500 placeholder-gray-400 focus:outline-none cursor-not-allowed"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {MOCK_CONVERSATIONS.map((c) => {
              const isActive = c.id === activeId;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`flex w-full items-start gap-3 border-b border-gray-50 px-3 py-3 text-left transition-colors cursor-pointer ${
                    isActive ? "bg-primary/5" : "hover:bg-gray-50/60"
                  }`}
                >
                  <div className="relative">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${c.avatarColor}`}
                    >
                      {c.initial}
                    </div>
                    {c.online && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-gray-900">{c.name}</span>
                      <span className="shrink-0 text-[10px] font-medium text-gray-400">
                        {c.lastTime}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p
                        className={`truncate text-xs ${
                          c.unread > 0 ? "font-semibold text-gray-700" : "text-gray-500"
                        }`}
                      >
                        {c.lastMessage}
                      </p>
                      {c.unread > 0 && (
                        <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Active conversation ── */}
        <section className="flex flex-col">
          <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${active.avatarColor}`}
              >
                {active.initial}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{active.name}</p>
                <p className="text-[11px] text-gray-500">
                  {active.online ? "Đang hoạt động" : "Ngoại tuyến"}
                </p>
              </div>
            </div>
            <button
              disabled
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 cursor-not-allowed"
            >
              <MoreHorizontal size={16} />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50/30 px-4 py-4">
            {active.messages.map((m) => {
              const mine = m.from === "shop";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                      mine
                        ? "rounded-tr-sm bg-primary text-white"
                        : "rounded-tl-sm bg-white text-gray-800 border border-gray-100"
                    }`}
                  >
                    <p className="leading-relaxed">{m.text}</p>
                    <div
                      className={`mt-1 flex items-center gap-1 text-[10px] ${
                        mine ? "text-white/70 justify-end" : "text-gray-400"
                      }`}
                    >
                      <span>{m.time}</span>
                      {mine && m.read && <CheckCheck size={11} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <footer className="border-t border-gray-100 bg-white px-3 py-2.5">
            <div className="flex items-center gap-2">
              <button disabled className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 cursor-not-allowed">
                <Paperclip size={16} />
              </button>
              <button disabled className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 cursor-not-allowed">
                <ImageIcon size={16} />
              </button>
              <input
                disabled
                placeholder="Tính năng đang phát triển..."
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 placeholder-gray-400 focus:outline-none cursor-not-allowed"
              />
              <button disabled className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 cursor-not-allowed">
                <Smile size={16} />
              </button>
              <button
                disabled
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary/50 px-3 text-xs font-bold text-white cursor-not-allowed"
              >
                <Send size={14} />
                Gửi
              </button>
            </div>
          </footer>
        </section>

        {/* ── Customer side panel ── */}
        <aside className="hidden border-l border-gray-100 lg:flex lg:flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Thông tin khách</p>
            <Info size={14} className="text-gray-400" />
          </div>
          <div className="space-y-4 overflow-y-auto p-4 text-sm">
            <div className="flex flex-col items-center gap-2 text-center">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold ${active.avatarColor}`}
              >
                {active.initial}
              </div>
              <p className="font-bold text-gray-900">{active.name}</p>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                Khách mua hàng
              </span>
            </div>
            <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/40 p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Đơn đã mua</span>
                <span className="font-semibold text-gray-800">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tổng chi tiêu</span>
                <span className="font-semibold text-gray-800">1.450.000đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tham gia</span>
                <span className="font-semibold text-gray-800">2 tháng trước</span>
              </div>
            </div>
            {active.productHint && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Sản phẩm đang quan tâm
                </p>
                <div className="flex items-center gap-2 rounded-xl border border-gray-100 p-2">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-gray-800">
                      {active.productHint}
                    </p>
                    <p className="text-[10px] text-gray-500">Còn 12 sản phẩm</p>
                  </div>
                </div>
              </div>
            )}
            <div className="rounded-xl border border-dashed border-gray-200 p-3 text-center text-[11px] text-gray-400">
              Khi hoàn thiện, panel này sẽ hiện đơn hàng gần đây, sản phẩm khách xem, ghi chú nội bộ.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
