import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { ExternalLink, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import paymentApi from "../api/paymentApi";
import type { CreatePaymentResponse } from "../types/payment";

interface PaymentQrModalProps {
  orderId: string | null; // null = đóng
  onClose: () => void;
}

/**
 * Modal thanh toán PayOS: tạo link khi mở → hiển thị QR (quét app ngân hàng) + nút mở trang PayOS.
 * Dùng chung cho danh sách đơn hàng và trang chi tiết đơn.
 */
export default function PaymentQrModal({ orderId, onClose }: PaymentQrModalProps) {
  const [payment, setPayment] = useState<CreatePaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setPayment(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    paymentApi
      .createPayment(orderId)
      .then((res) => {
        if (cancelled) return;
        if (res.data.isSuccess && res.data.data.checkoutUrl) setPayment(res.data.data);
        else setError(res.data.message || "Không thể tạo liên kết thanh toán");
      })
      .catch(() => !cancelled && setError("Lỗi khi kết nối tới cổng thanh toán"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const openCheckout = () => {
    if (!payment || !orderId) return;
    localStorage.setItem("pending_payment_order_id", orderId);
    window.location.href = payment.checkoutUrl;
  };

  return (
    <Modal open={!!orderId} title="Thanh toán PayOS" onClose={onClose}>
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <p className="py-8 text-center text-sm text-gray-600">{error}</p>
      ) : payment ? (
        <div className="flex flex-col items-center gap-3">
          {payment.qrCode && (
            <div className="rounded-xl border border-gray-100 bg-white p-3">
              <QRCode value={payment.qrCode} size={192} />
            </div>
          )}
          <p className="text-lg font-bold text-primary">
            {payment.amount.toLocaleString("vi-VN")}đ
          </p>
          <p className="text-center text-xs text-gray-500">
            Quét mã QR bằng app ngân hàng, hoặc bấm nút bên dưới để mở trang thanh toán PayOS.
          </p>
          <button
            type="button"
            onClick={openCheckout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark cursor-pointer"
          >
            <ExternalLink size={15} />
            Mở trang thanh toán
          </button>
        </div>
      ) : null}
    </Modal>
  );
}
