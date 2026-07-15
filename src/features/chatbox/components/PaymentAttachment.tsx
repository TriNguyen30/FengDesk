import QRCode from "react-qr-code";
import { ExternalLink, QrCode as QrIcon } from "lucide-react";
import type { PaymentBlock } from "@/features/chatbox/utils/paymentBlock";

/**
 * Card thanh toán PayOS đính kèm dưới tin nhắn AI (sau confirm_order) — do hệ thống render,
 * không phụ thuộc model chép link. QR là chuỗi EMV/VietQR → quét bằng app ngân hàng.
 */
export default function PaymentAttachment({ payment }: { payment: PaymentBlock }) {
  return (
    <div className="mt-2 w-full max-w-xs rounded-xl border border-primary/25 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
        <QrIcon size={14} />
        Thanh toán PayOS
      </div>

      {payment.qrCode && (
        <div className="mb-2 flex justify-center rounded-lg border border-gray-100 bg-white p-2">
          <QRCode value={payment.qrCode} size={144} />
        </div>
      )}

      <div className="mb-2 text-center text-sm font-semibold text-gray-800">
        {payment.amount.toLocaleString("vi-VN")}đ
      </div>

      <a
        href={payment.checkoutUrl}
        target="_blank"
        rel="noreferrer"
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
      >
        <ExternalLink size={13} />
        Mở trang thanh toán
      </a>

      <p className="mt-1.5 text-center text-[10px] text-gray-400">
        Link hết hạn sau {payment.expiresInMinutes} phút — quét QR bằng app ngân hàng hoặc bấm nút.
      </p>
    </div>
  );
}
