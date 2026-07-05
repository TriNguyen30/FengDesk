import { useCart } from "@/features/cart";
import CartItemImage from "@/features/cart/components/CartItemImage";
import type { CartItem } from "@/features/cart/types/cart";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/app/store";
import { useProductPrimaryImage } from "@/features/products";
import type { UpdateCartItemParams } from "@/features/cart/types/cart";
import { generateSlug } from "@/utils/string";

function formatVnd(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

interface CartDropdownItemProps {
  item: CartItem;
  onNavigate: (e: React.MouseEvent, path: string) => void;
  onQuantityChange: (params: UpdateCartItemParams) => void;
  onRemove: () => void;
}

function CartDropdownItem({ item, onNavigate, onQuantityChange, onRemove }: CartDropdownItemProps) {
  const { imageUrl } = useProductPrimaryImage(item.productId);

  return (
    <li className="flex gap-3 px-3 py-3 hover:bg-gray-50/80">
      <CartItemImage imageUrl={imageUrl} alt={item.productName} />
      <div className="min-w-0 flex-1">
        <a
          href={`/products/${item.productId}`}
          onClick={(e) => onNavigate(e, `/product/${item.productId}`)}
          className="line-clamp-2 text-left text-xs font-medium leading-snug text-gray-800 hover:text-primary"
        >
          {item.productName} {item.variantName ? `(${item.variantName})` : ""}
        </a>
        <p className="mt-1 text-sm font-bold text-primary">{formatVnd(item.unitPrice)}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center rounded-md border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => onQuantityChange({ itemId: item.id, quantity: item.quantity - 1 })}
              className="flex h-7 w-7 items-center justify-center text-gray-600 hover:bg-gray-100 cursor-pointer"
              aria-label="Giảm số lượng"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-6 text-center text-xs font-semibold tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantityChange({ itemId: item.id, quantity: item.quantity + 1 })}
              className="flex h-7 w-7 items-center justify-center text-gray-600 hover:bg-gray-100 cursor-pointer"
              aria-label="Tăng số lượng"
            >
              <Plus size={14} />
            </button>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="ml-auto rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
            aria-label="Xóa khỏi giỏ"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </li>
  );
}

export default function CartDropDown() {
  const { items, itemCount, subtotal, setQuantity, removeItem, clearCart, deleteAll } = useCart();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    setClosing(true);
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 150);
  }, []);

  const open_ = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setClosing(false);
    setOpen(true);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleNavigate = useCallback(
    (e: React.MouseEvent, path: string) => {
      e.preventDefault();
      close();
      setTimeout(() => {
        navigate(path);
      }, 180); // Wait for the slide-up animation to finish
    },
    [close, navigate],
  );

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
    <>
      <style>{`
        @keyframes cart-dropdown-in {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes cart-dropdown-out {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
        }
        .cart-dropdown-enter {
          animation: cart-dropdown-in 0.18s cubic-bezier(0.16, 1, 0.3, 1) both;
          transform-origin: top right;
        }
        .cart-dropdown-exit {
          animation: cart-dropdown-out 0.15s ease-in both;
          transform-origin: top right;
        }
      `}</style>

      <div ref={rootRef} className="relative group" onMouseEnter={open_} onMouseLeave={close}>
        <a
          href="/cart"
          onClick={(e) => handleNavigate(e, "/cart")}
          className="relative flex min-w-[44px] flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-gray-700 transition-colors hover:text-primary active:bg-gray-100 cursor-pointer"
          aria-haspopup="true"
          aria-label={`Giỏ hàng, ${itemCount} sản phẩm`}
        >
          <ShoppingCart size={22} strokeWidth={1.8} />
          <span className="hidden text-[10px] font-medium sm:block sm:text-xs">Giỏ hàng</span>
          {itemCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-bold text-white tabular-nums">
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          )}
        </a>

        {open && (
          <div className="absolute right-0 top-full z-50 pt-2">
            <div
              id="navbar-cart-panel"
              role="dialog"
              aria-label="Giỏ hàng"
              className={`w-[min(calc(100vw-1.5rem),22rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl sm:w-96 ${
                closing ? "cart-dropdown-exit" : "cart-dropdown-enter"
              }`}
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
                <h2 className="text-sm font-bold text-gray-900">
                  Giỏ hàng{" "}
                  {itemCount > 0 && (
                    <span className="font-normal text-gray-500">({itemCount})</span>
                  )}
                </h2>
                <div className="flex items-center gap-1">
                  {items.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        deleteAll();
                        toast.success("Đã xóa giỏ hàng");
                      }}
                      className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 cursor-pointer"
                    >
                      Xóa tất cả
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 cursor-pointer"
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
                  <a
                    href="/products"
                    onClick={(e) => handleNavigate(e, "/products")}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark cursor-pointer"
                  >
                    Mua sắm ngay
                  </a>
                </div>
              ) : (
                <>
                  <ul className="scrollbar-none max-h-[min(50vh,20rem)] overflow-y-auto divide-y divide-gray-100">
                    {items.map((item) => (
                      <CartDropdownItem
                        key={item.id}
                        item={item}
                        onNavigate={handleNavigate}
                        onQuantityChange={setQuantity}
                        onRemove={() => removeItem(item.id)}
                      />
                    ))}
                  </ul>

                  <div className="border-t border-gray-100 bg-gray-50/80 px-3 py-3">
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span className="text-gray-600">Tạm tính</span>
                      <span className="font-bold text-gray-900">{formatVnd(subtotal)}</span>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <a
                        href="/cart"
                        onClick={(e) => handleNavigate(e, "/cart")}
                        className="flex flex-1 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-center text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 cursor-pointer"
                      >
                        Xem giỏ hàng
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
