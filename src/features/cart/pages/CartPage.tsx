import { useCart } from "@/features/cart";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Trash2, Leaf, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";

function formatVnd(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

export default function CartPage() {
  const { items, setQuantity, removeItem, deleteAll } = useCart();
  const navigate = useNavigate();
  
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

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
    <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Giỏ hàng của bạn</h1>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-20">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
            <ShoppingCart size={40} strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-medium text-gray-900">Giỏ hàng trống</h2>
          <p className="mt-1 text-gray-500">Bạn chưa có sản phẩm nào trong giỏ hàng.</p>
          <Link
            to="/products"
            className="mt-6 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark cursor-pointer"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Cart Items */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="selectAll" className="font-medium text-gray-900 cursor-pointer select-none">
                  Chọn tất cả ({items.length})
                </label>
              </div>
              <button
                onClick={() => {
                  if (window.confirm("Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?")) {
                    deleteAll();
                    toast.success("Đã xóa giỏ hàng");
                  }
                }}
                className="text-sm font-medium text-red-600 hover:text-red-700 cursor-pointer"
              >
                Xóa tất cả
              </button>
            </div>

            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:items-center">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  </div>
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 ring-1 ring-gray-100 text-gray-400">
                    <Leaf size={32} />
                  </div>
                  
                  <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Link
                        to={`/products`}
                        className="text-base font-medium text-gray-900 hover:text-primary line-clamp-2"
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
                          className="flex h-9 w-9 items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => setQuantity({ itemId: item.id, quantity: item.quantity + 1 })}
                          className="flex h-9 w-9 items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                        <span className="hidden sm:inline">Xóa</span>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Order Summary */}
          <div className="w-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:w-96 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Tóm tắt đơn hàng</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính ({selectedCount} sản phẩm)</span>
                <span className="font-medium text-gray-900">{formatVnd(selectedSubtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span className="font-medium text-gray-900">Chưa tính</span>
              </div>
              
              <div className="my-4 border-t border-gray-100"></div>
              
              <div className="flex justify-between items-end">
                <span className="text-base font-bold text-gray-900">Tổng cộng</span>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary">{formatVnd(selectedSubtotal)}</span>
                  <p className="mt-1 text-xs text-gray-500">(Đã bao gồm VAT nếu có)</p>
                </div>
              </div>

              <button
                onClick={() => toast.info("Chức năng thanh toán đang được hoàn thiện")}
                disabled={selectedItems.length === 0}
                className="mt-6 w-full rounded-xl bg-primary px-4 py-3.5 text-center text-base font-semibold text-white transition-colors hover:bg-primary-dark shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tiến hành thanh toán
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
