import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, MapPin, ShoppingBag, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch } from "@/store/hooks";
import { useCart } from "@/features/cart";
import { createOrder } from "@/features/orders/store/orderSlice";
import { getAddresses } from "@/features/users/api/address.api";
import type { Address } from "@/features/users/types/address";
import type { PaymentMethod } from "@/features/orders/types/orders";
import { formatVnd, PAYMENT_METHODS } from "@/features/orders/utils/orderUtils";
import AddressModal from "@/features/users/components/AddressModal";
import { paymentApi } from "@/features/payment";

interface CheckoutLocationState {
  selectedItemIds?: string[];
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { items } = useCart();

  const selectedItemIds = (location.state as CheckoutLocationState)?.selectedItemIds ?? [];

  const checkoutItems = useMemo(
    () => items.filter((item) => selectedItemIds.includes(item.id)),
    [items, selectedItemIds],
  );

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PayOS");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const subtotal = checkoutItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalQuantity = checkoutItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (selectedItemIds.length === 0 || checkoutItems.length === 0) {
      toast.error("Vui lòng chọn sản phẩm để thanh toán");
      navigate("/cart", { replace: true });
    }
  }, [selectedItemIds.length, checkoutItems.length, navigate]);

  useEffect(() => {
    async function loadAddresses() {
      try {
        setLoadingAddresses(true);
        const data = await getAddresses();
        setAddresses(data);
        const defaultAddress = data.find((a) => a.isDefault) ?? data[0];
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        }
      } catch {
        toast.error("Không thể tải danh sách địa chỉ");
      } finally {
        setLoadingAddresses(false);
      }
    }
    loadAddresses();
  }, []);

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error("Vui lòng chọn địa chỉ giao hàng");
      return;
    }

    if (checkoutItems.length === 0) {
      toast.error("Không có sản phẩm để thanh toán");
      return;
    }

    setSubmitting(true);
    try {
      const result = await dispatch(
        createOrder({
          shippingAddressId: selectedAddressId,
          note: note.trim(),
          paymentMethod,
          items: checkoutItems.map((item) => ({
            productItemId: item.productItemId,
            quantity: item.quantity,
          })),
        }),
      ).unwrap();

      if (result.isSuccess && result.data) {
        toast.success("Đặt hàng thành công");

        if (paymentMethod === "PayOS") {
          try {
            const paymentRes = await paymentApi.createPayment(result.data.id);
            if (paymentRes.data.isSuccess && paymentRes.data.data.checkoutUrl) {
              localStorage.setItem("pending_payment_order_id", result.data.id);
              window.location.href = paymentRes.data.data.checkoutUrl;
              return;
            } else {
              toast.error(paymentRes.data.message || "Không thể tạo liên kết thanh toán");
            }
          } catch {
            toast.error("Lỗi khi kết nối cổng thanh toán PayOS");
          }
          // Fallback if payment generation failed
          navigate(`/profile/orders/${result.data.id}`, { replace: true });
          return;
        }

        navigate(`/profile/orders/${result.data.id}`, { replace: true });
        return;
      }

      toast.error(result.message || "Không thể tạo đơn hàng");
    } catch {
      toast.error("Không thể tạo đơn hàng");
    } finally {
      setSubmitting(false);
    }
  };

  if (checkoutItems.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
      <button
        onClick={() => navigate("/cart")}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary cursor-pointer transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Quay lại giỏ hàng
      </button>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">Thanh toán</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Shipping address */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <MapPin className="h-5 w-5 text-primary" />
                Địa chỉ giao hàng
              </h2>
              <button
                onClick={() => setIsAddressModalOpen(true)}
                className="text-sm font-medium text-primary hover:underline cursor-pointer"
              >
                + Thêm địa chỉ
              </button>
            </div>

            {loadingAddresses ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center">
                <p className="text-sm text-gray-500">Bạn chưa có địa chỉ giao hàng</p>
                <button
                  onClick={() => setIsAddressModalOpen(true)}
                  className="mt-3 text-sm font-medium text-primary hover:underline cursor-pointer"
                >
                  Thêm địa chỉ ngay
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
                      selectedAddressId === address.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-primary/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="shippingAddress"
                      value={address.id}
                      checked={selectedAddressId === address.id}
                      onChange={() => setSelectedAddressId(address.id)}
                      className="mt-1 h-4 w-4 text-primary focus:ring-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">{address.recipientName}</span>
                        <span className="text-sm text-gray-500">{address.recipientPhone}</span>
                        {address.isDefault && (
                          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{address.streetAddress}</p>
                      {address.label && (
                        <p className="mt-1 text-xs text-gray-400">{address.label}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </section>

          {/* Payment method */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <CreditCard className="h-5 w-5 text-primary" />
              Phương thức thanh toán
            </h2>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
                    paymentMethod === method.value
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-primary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={() => setPaymentMethod(method.value)}
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-800">{method.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Note */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <label htmlFor="orderNote" className="mb-2 block text-sm font-medium text-gray-700">
              Ghi chú đơn hàng (tuỳ chọn)
            </label>
            <textarea
              id="orderNote"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú cho người bán hoặc shipper..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </section>
        </div>

        {/* Order summary */}
        <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 lg:sticky lg:top-24">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Đơn hàng ({checkoutItems.length} sản phẩm)
          </h2>

          <ul className="mb-4 max-h-64 space-y-3 overflow-y-auto">
            {checkoutItems.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-medium text-gray-800">
                    {item.productName}
                    {item.variantName ? ` (${item.variantName})` : ""}
                  </p>
                  <p className="text-xs text-gray-500">x{item.quantity}</p>
                </div>
                <span className="shrink-0 font-semibold text-gray-900">
                  {formatVnd(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="space-y-2 border-t border-dashed border-gray-200 pt-4 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Tạm tính ({totalQuantity} sản phẩm)</span>
              <span className="font-semibold text-gray-900">{formatVnd(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Phí vận chuyển</span>
              <span className="font-semibold text-gray-900">Chưa tính</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold text-gray-900">
              <span>Tổng cộng</span>
              <span className="text-primary">{formatVnd(subtotal)}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={submitting || !selectedAddressId || checkoutItems.length === 0}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-bold text-white shadow-md transition-all hover:bg-primary-dark active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Đặt hàng"
            )}
          </button>

          <p className="mt-3 text-center text-xs text-gray-500">
            Bằng việc đặt hàng, bạn đồng ý với{" "}
            <Link to="/products" className="text-primary hover:underline">
              điều khoản mua hàng
            </Link>
          </p>
        </aside>
      </div>

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        address={null}
        onSuccess={async () => {
          const data = await getAddresses();
          setAddresses(data);
          const defaultAddress = data.find((a) => a.isDefault) ?? data[data.length - 1];
          if (defaultAddress) setSelectedAddressId(defaultAddress.id);
        }}
      />
    </div>
  );
}
