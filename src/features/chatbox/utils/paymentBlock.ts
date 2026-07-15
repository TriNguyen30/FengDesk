/**
 * Block thanh toán do BE gắn vào cuối tin nhắn AI khi confirm_order tạo link PayOS
 * (xem AiChatService.AppendPaymentBlock). Định dạng: `@@payment:{json}@@`.
 * FE tách block ra khỏi text để render card QR/nút thanh toán như một phần đính kèm.
 */
export interface PaymentBlock {
  orderId: string;
  amount: number;
  checkoutUrl: string;
  qrCode: string | null;
  expiresInMinutes: number;
}

const PAYMENT_RE = /\n*@@payment:(\{[\s\S]*?\})@@/;

/** Tách block thanh toán (nếu có) khỏi nội dung tin nhắn. Parse lỗi → coi như không có block. */
export function extractPaymentBlock(content: string): { text: string; payment: PaymentBlock | null } {
  const m = content.match(PAYMENT_RE);
  if (!m) return { text: content, payment: null };
  try {
    const payment = JSON.parse(m[1]) as PaymentBlock;
    return { text: content.replace(PAYMENT_RE, "").trim(), payment };
  } catch {
    return { text: content, payment: null };
  }
}
