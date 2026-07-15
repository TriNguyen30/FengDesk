import { useCart } from "@/features/cart";
import CartItemImage from "@/features/cart/components/CartItemImage";
import type { CartItem } from "@/features/cart/types/cart";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";
import { useAppSelector } from "@/app/store";
import { useProductPrimaryImage } from "@/features/products";
import { YouMightAlsoLikeSection } from "@/features/products/components/ProductCard";
import type { UpdateCartItemParams } from "@/features/cart/types/cart";
import Modal from "@/components/ui/Modal";
import EmptyCartImg from "@/assets/image/EmptyCart.jpg";
import { generateSlug } from "@/utils/string";

function formatVnd(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

interface CartLineItemProps {
  item: CartItem;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onQuantityChange: (params: UpdateCartItemParams) => void;
  onRemove: () => void;
}

function CartLineItem({ item, selected, onSelect, onQuantityChange, onRemove }: CartLineItemProps) {
  const { imageUrl } = useProductPrimaryImage(item.productId);

  return (
    <li className="flex gap-4 py-5 sm:items-center">
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
        />
      </div>
      <CartItemImage
        imageUrl={imageUrl}
        alt={item.productName}
        className="flex h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-100"
        iconSize={28}
      />

      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to={`/products/${item.productId || item.productItemId}`}
            className="text-base font-bold text-gray-900 hover:text-primary line-clamp-2"
          >
            {item.productName} {item.variantName ? `(${item.variantName})` : ""}
          </Link>
          <p className="mt-1 text-lg font-bold text-primary">{formatVnd(item.unitPrice)}</p>
        </div>

        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3">
          <div className="flex items-center rounded-lg border border-gray-200 bg-white">
            <button
              onClick={() => onQuantityChange({ itemId: item.id, quantity: item.quantity - 1 })}
              className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer rounded-l-lg"
            >
              <Minus size={14} />
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={item.quantity}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                if (val) {
                  onQuantityChange({ itemId: item.id, quantity: parseInt(val, 10) });
                }
              }}
              onBlur={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                const num = val ? parseInt(val, 10) : 1;
                onQuantityChange({ itemId: item.id, quantity: Math.max(1, num) });
              }}
              className="min-w-10 w-10 text-center text-sm font-semibold tabular-nums focus:outline-none bg-transparent"
            />
            <button
              onClick={() => onQuantityChange({ itemId: item.id, quantity: item.quantity + 1 })}
              className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer rounded-r-lg"
            >
              <Plus size={14} />
            </button>
          </div>
          <button
            onClick={onRemove}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Xóa</span>
          </button>
        </div>
      </div>
    </li>
  );
}

export default function CartPage() {
  const { items, setQuantity, removeItem, deleteAll } = useCart();
  const navigate = useNavigate();

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Automatically deselect items that are removed from the cart
  useEffect(() => {
    setSelectedItems((prev) => prev.filter((id) => items.some((item) => item.id === id)));
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
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-500">
        <Link to="/" className="hover:text-primary transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <span className="text-gray-900">Giỏ hàng</span>
      </nav>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="mb-4 flex items-center justify-center">
              <img src={EmptyCartImg} alt="Empty Cart" className="h-70 w-70 object-contain" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">“Hổng” có gì trong giỏ hết</h2>
            <p className="mt-2 text-sm text-gray-500">
              Về trang cửa hàng để chọn mua sản phẩm bạn nhé!!
            </p>
            <Link
              to="/products"
              className="mt-6 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-primary-dark hover:shadow-lg active:scale-95 cursor-pointer"
            >
              Mua Sắm Ngay
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

              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <label
                    htmlFor="selectAll"
                    className="text-sm font-medium text-gray-900 cursor-pointer select-none"
                  >
                    Chọn tất cả
                  </label>
                </div>
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(true);
                  }}
                  className="text-sm font-medium text-red-500 hover:text-red-700 cursor-pointer transition-colors"
                >
                  Xóa tất cả
                </button>
              </div>

              <ul className="divide-y divide-dashed divide-gray-100">
                {items.map((item) => (
                  <CartLineItem
                    key={item.id}
                    item={item}
                    selected={selectedItems.includes(item.id)}
                    onSelect={(checked) => handleSelectItem(item.id, checked)}
                    onQuantityChange={setQuantity}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </ul>
            </div>

            {/* ── Right: Order Summary ───────────────────────────────────── */}
            <div className="flex w-full flex-col gap-5 border-t border-gray-100 bg-gray-50/50 p-4 lg:w-96 lg:border-l lg:border-t-0 lg:p-6">
              <h2 className="text-lg font-bold leading-snug text-gray-900">Tóm tắt đơn hàng</h2>

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
                  onClick={() => {
                    if (selectedItems.length === 0) {
                      toast.error("Vui lòng chọn ít nhất một sản phẩm");
                      return;
                    }
                    navigate("/checkout", { state: { selectedItemIds: selectedItems } });
                  }}
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

      <Modal
        open={isDeleteModalOpen}
        title="Xóa tất cả sản phẩm trong giỏ hàng"
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={() => {
                deleteAll();
                toast.success("Đã xóa giỏ hàng");
                setIsDeleteModalOpen(false);
              }}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 cursor-pointer"
            >
              Xóa tất cả
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
