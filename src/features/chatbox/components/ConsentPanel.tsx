import { useEffect, useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { chatApi, type ChatConsent } from "@/features/chatbox/api/chat.api";

/** Danh sách scope — thêm mục mới chỉ cần thêm 1 dòng (key phải khớp ChatConsent + DTO BE). */
const SCOPES: { key: keyof ChatConsent; label: string; hint: string }[] = [
  { key: "shareProfile", label: "Hồ sơ cá nhân", hint: "Tên, ngày sinh, mệnh phong thủy" },
  {
    key: "shareWorkspaces",
    label: "Không gian làm việc",
    hint: "Phong cách, mục đích, hành/hướng",
  },
  { key: "shareOrders", label: "Lịch sử mua hàng", hint: "Các đơn hàng gần đây" },
];

// Mặc định CHIA SẺ (opt-out) — khớp BE: chưa có bản ghi consent thì coi như đã cho phép.
const EMPTY: ChatConsent = { shareProfile: true, shareWorkspaces: true, shareOrders: true };

interface ConsentPanelProps {
  chatboxId: string;
  pulse: boolean;
  onInteract: () => void;
}

export default function ConsentPanel({ chatboxId, pulse, onInteract }: ConsentPanelProps) {
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState<ChatConsent>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    chatApi
      .getConsent(chatboxId)
      .then((r) => {
        if (!cancelled && r.data.isSuccess) setConsent(r.data.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [chatboxId]);

  const toggle = async (key: keyof ChatConsent) => {
    const prev = consent;
    const next = { ...consent, [key]: !consent[key] };
    setConsent(next);
    setSaving(true);
    try {
      const r = await chatApi.setConsent(chatboxId, next);
      if (r.data.isSuccess) setConsent(r.data.data);
      else {
        setConsent(prev);
        toast.error(r.data.message || "Không lưu được tùy chọn.");
      }
    } catch {
      setConsent(prev);
      toast.error("Không lưu được tùy chọn.");
    } finally {
      setSaving(false);
    }
  };

  const enabled = SCOPES.filter((s) => consent[s.key]).length;

  const headerClick = () => {
    setOpen((o) => !o);
    onInteract();
  };

  return (
    <div className="group border-b border-gray-100 px-3 py-2">
      <button
        type="button"
        onClick={headerClick}
        className="relative flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-left transition-colors hover:bg-gray-100 cursor-pointer"
      >
        {/* Hiệu ứng nháy khi có nhân viên vừa vào — dừng (giãn tối đa, đứng yên) khi hover, mất khi bấm. */}
        {pulse && (
          <>
            <span className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-primary/60 group-hover:ring-primary" />
            <span className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-primary/50 animate-ping group-hover:hidden" />
          </>
        )}
        <span className="flex items-center gap-2 text-xs font-medium text-gray-700">
          <ShieldCheck size={14} className="text-primary" />
          Chia sẻ với nhân viên hỗ trợ{enabled > 0 ? ` · ${enabled}` : ""}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-1.5 space-y-1.5 px-1">
          <p className="text-[10px] leading-relaxed text-gray-400">
            Nhân viên hỗ trợ có thể nhờ trợ lý AI xem các mục bạn cho phép dưới đây để tư vấn tốt
            hơn. Bạn có thể tắt bất cứ lúc nào.
          </p>
          {SCOPES.map((s) => (
            <label
              key={s.key}
              className="flex cursor-pointer items-start gap-2 rounded-lg px-1.5 py-1 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={consent[s.key]}
                disabled={saving}
                onChange={() => void toggle(s.key)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              />
              <span className="min-w-0">
                <span className="block text-xs font-medium text-gray-700">{s.label}</span>
                <span className="block text-[10px] text-gray-400">{s.hint}</span>
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
