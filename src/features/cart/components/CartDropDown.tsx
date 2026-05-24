import { useCart } from "@/features/cart";
import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function formatVnd(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

export default function CartDropDown() {
  const { items, itemCount, subtotal, setQuantity, removeItem, clearCart } =
    useCart();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: MouseEvent | PointerEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer, true);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex min-w-[44px] flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-gray-700 transition-colors hover:text-primary active:bg-gray-100 cursor-pointer"
        aria-haspopup="true"
        aria-label={`Giỏ hàng, ${itemCount} sản phẩm`}
      >
        <ShoppingCart size={22} strokeWidth={1.8} />
        <span className="hidden text-[10px] font-medium sm:block sm:text-xs">
          Giỏ hàng
        </span>
        {itemCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-bold text-white tabular-nums">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id="navbar-cart-panel"
          role="dialog"
          aria-label="Giỏ hàng"
          className="absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-1.5rem),22rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
            <h2 className="text-sm font-bold text-gray-900">
              Giỏ hàng{" "}
              {itemCount > 0 && (
                <span className="font-normal text-gray-500">
                  ({itemCount})
                </span>
              )}
            </h2>
            <div className="flex items-center gap-1">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    clearCart();
                    toast.success("Đã xóa giỏ hàng");
                  }}
                  className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                >
                  Xóa tất cả
                </button>
              )}
              <button
                type="button"
                onClick={close}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <ShoppingCart size={28} strokeWidth={1.5} />
              </div>
              <p className="text-sm text-gray-600">Chưa có sản phẩm nào</p>
              <Link
                to="/products"
                onClick={close}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Mua sắm ngay
              </Link>
            </div>
          ) : (
            <>
              <ul className="scrollbar-none max-h-[min(50vh,20rem)] overflow-y-auto divide-y divide-gray-100">
                {items.map(({ product, quantity }) => (
                  <li
                    key={product.id}
                    className="flex gap-3 px-3 py-3 hover:bg-gray-50/80"
                  >
                    <Link
                      to={`/products`}
                      onClick={close}
                      className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-50 ring-1 ring-gray-100"
                    >
                      <img
                        src={product.image}
                        alt=""
                        className="h-full w-full object-contain p-1"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/products"
                        onClick={close}
                        className="line-clamp-2 text-left text-xs font-medium leading-snug text-gray-800 hover:text-primary"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-1 text-sm font-bold text-primary">
                        {formatVnd(product.price)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center rounded-md border border-gray-200 bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(product.id, quantity - 1)
                            }
                            className="flex h-7 w-7 items-center justify-center text-gray-600 hover:bg-gray-100"
                            aria-label="Giảm số lượng"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="min-w-6 text-center text-xs font-semibold tabular-nums">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(product.id, quantity + 1)
                            }
                            className="flex h-7 w-7 items-center justify-center text-gray-600 hover:bg-gray-100"
                            aria-label="Tăng số lượng"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(product.id)}
                          className="ml-auto rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Xóa khỏi giỏ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t border-gray-100 bg-gray-50/80 px-3 py-3">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tạm tính</span>
                  <span className="font-bold text-gray-900">
                    {formatVnd(subtotal)}
                  </span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    to="/products"
                    onClick={close}
                    className="flex flex-1 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-center text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                  >
                    Tiếp tục mua
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      toast.info("Chức năng thanh toán đang được hoàn thiện")
                    }
                    className="flex flex-1 items-center justify-center rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                  >
                    Thanh toán
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
