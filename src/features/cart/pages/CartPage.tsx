import { useCart } from "@/features/cart";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Trash2, Leaf, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";
import { YouMightAlsoLikeSection } from "@/features/products/components/ProductCard";

function formatVnd(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

export default function CartPage() {
  const { items, setQuantity, removeItem, deleteAll } = useCart();
  const navigate = useNavigate();
  
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Automatically deselect items that are removed from the cart
  useEffect(() => {
    setSelectedItems((prev) => prev.filter(id => items.some(item => item.id === id)));
  }, [items]);

  const selectedCount = useMemo(() => {
    return items
      .filter((i) => selectedItems.includes(i.id))
      .reduce((acc, i) => acc + i.quantity, 0);
  }, [items, selectedItems]);

  const selectedSubtotal = useMemo(() => {
    return items
      .filter((i) => selectedItems.includes(i.id))
      .reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  }, [items, selectedItems]);

  const isAllSelected = items.length > 0 && selectedItems.length === items.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(items.map((i) => i.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, id]);
    } else {
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary cursor-pointer transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Quay lại
      </button>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-gray-400 ring-1 ring-gray-100">
              <ShoppingCart size={40} strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Giỏ hàng trống</h2>
            <p className="mt-2 text-sm text-gray-500">Bạn chưa có sản phẩm nào trong giỏ hàng.</p>
            <Link
              to="/products"
              className="mt-6 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-primary-dark hover:shadow-lg active:scale-95 cursor-pointer"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row">
            {/* ── Left: Cart Items ───────────────────────────────────────── */}
            <div className="flex-1 p-4 sm:p-6">
              <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
                <h1 className="text-xl font-medium leading-snug text-gray-900 sm:text-xl">
                  Giỏ hàng của bạn
                </h1>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {items.length} Sản phẩm
                </span>
              </div>

              <div className="mb-4 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="selectAll" className="text-sm font-medium text-gray-900 cursor-pointer select-none">
                    Chọn tất cả
                  </label>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm("Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?")) {
                      deleteAll();
                      toast.success("Đã xóa giỏ hàng");
                    }
                  }}
                  className="text-sm font-medium text-red-500 hover:text-red-700 cursor-pointer transition-colors"
                >
                  Xóa tất cả
                </button>
              </div>

              <ul className="divide-y divide-dashed divide-gray-100">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-4 py-5 sm:items-center">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                    </div>
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-100 text-gray-400">
                      <Leaf size={28} />
                    </div>
                    
                    <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Link
                          to={`/products/${item.productId}`}
                          className="text-base font-bold text-gray-900 hover:text-primary line-clamp-2"
                        >
                          {item.productName} {item.variantName ? `(${item.variantName})` : ""}
                        </Link>
                        <p className="mt-1 text-lg font-bold text-primary">
                          {formatVnd(item.unitPrice)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3">
                        <div className="flex items-center rounded-lg border border-gray-200 bg-white">
                          <button
                            onClick={() => setQuantity({ itemId: item.id, quantity: item.quantity - 1 })}
                            className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer rounded-l-lg"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              if (val) {
                                setQuantity({ itemId: item.id, quantity: parseInt(val, 10) });
                              }
                            }}
                            onBlur={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              const num = val ? parseInt(val, 10) : 1;
                              setQuantity({ itemId: item.id, quantity: Math.max(1, num) });
                            }}
                            className="min-w-[2.5rem] w-10 text-center text-sm font-semibold tabular-nums focus:outline-none bg-transparent"
                          />
                          <button
                            onClick={() => setQuantity({ itemId: item.id, quantity: item.quantity + 1 })}
                            className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer rounded-r-lg"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                          <span className="hidden sm:inline">Xóa</span>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Right: Order Summary ───────────────────────────────────── */}
            <div className="flex w-full flex-col gap-5 border-t border-gray-100 bg-gray-50/50 p-4 lg:w-96 lg:border-l lg:border-t-0 lg:p-6">
              <h2 className="text-lg font-bold leading-snug text-gray-900">
                Tóm tắt đơn hàng
              </h2>
              
              <div className="flex flex-col gap-4 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Tạm tính ({selectedCount} sản phẩm)</span>
                  <span className="font-semibold text-gray-900">{formatVnd(selectedSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <span className="font-semibold text-gray-900">Chưa tính</span>
                </div>
              </div>
              
              <div className="border-t border-dashed border-gray-200 pt-4">
                <div className="flex justify-between items-end">
                  <span className="text-base font-bold text-gray-900">Tổng cộng</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">
                      {selectedSubtotal.toLocaleString("vi-VN")}
                      <span className="text-lg">đ</span>
                    </span>
                    <p className="mt-0.5 text-xs text-gray-500">(Đã bao gồm VAT nếu có)</p>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-2">
                <button
                  onClick={() => toast.info("Chức năng thanh toán đang được hoàn thiện")}
                  disabled={selectedItems.length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-bold text-white shadow-md transition-all hover:bg-primary-dark hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none cursor-pointer"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Tiến hành thanh toán
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── You might also like ─────────────────────────────────────────────── */}
      <YouMightAlsoLikeSection />
    </div>
  );
}
