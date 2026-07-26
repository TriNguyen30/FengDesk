import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ShoppingCart,
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Store,
  MessageSquare,
  MapPin,
  Phone,
  Clock,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  X,
  Truck,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { ProductItem } from "../types/product";
import { useProductDetail, useProductList } from "../hooks/useProducts";
import ProductCard, { ProductCardSkeleton } from "../components/ProductCard";
import { useCart } from "@/features/cart";
import { getShopRequestById } from "@/features/shop/api/shop.api";
import { Shop } from "@/features/shop/types/shop";
import { ReviewSection } from "@/features/review";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { chatApi, chatHub } from "@/features/chatbox";
import {
  openChatbox,
  setActiveChatbox,
  setMessages,
  setView,
  upsertChatbox,
} from "@/features/chatbox/store/chatboxSlice";
import { setAuthModal } from "@/features/auth/store/authSlice";
import ProductFitPanel from "@/features/recommendation/components/element-vector/ProductFitPanel";
import FeatureBar from "@/components/ui/FeatureBar";
import CommitmentPage from "@/components/ui/CommitmentPage"

const ELEMENT_LABELS: Record<string, string> = {
  Kim: "Kim",
  Moc: "Mộc",
  Thuy: "Thủy",
  Hoa: "Hỏa",
  Tho: "Thổ",
};

const ELEMENT_COLORS: Record<string, string> = {
  Kim: "bg-slate-500",
  Moc: "bg-green-600",
  Thuy: "bg-blue-500",
  Hoa: "bg-red-500",
  Tho: "bg-amber-600",
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { product, loading, failed } = useProductDetail(id);
  const sortedImages = useMemo(() => {
    return [...(product?.images || [])].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [product?.images]);
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => !!s.auth.token);

  // Guard chống double-click: ref chặn đồng bộ (2 click cùng tick), state để disable nút cho UX.
  const openingChatRef = useRef(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const thumbRef = useRef<HTMLDivElement>(null);

  const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null);
  const [activeImage, setActiveImage] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [shop, setShop] = useState<Shop | null>(null);

  // Zoom on hover state (Desktop main image)
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // Lightbox modal state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  useEffect(() => {
    if (!product) return;

    setSelectedItem(product.items[0] ?? null);
    setActiveImage(sortedImages[0]?.url ?? "");
    setQuantity(1);
    setShop(null);

    if (product.gardenStoreId) {
      getShopRequestById(product.gardenStoreId)
        .then((shopRes) => {
          if (shopRes.isSuccess && shopRes.data) {
            setShop(shopRes.data);
          }
        })
        .catch(console.error);
    }
  }, [product]);

  const handleAddToCart = () => {
    if (product && selectedItem) {
      addItem({ productItemId: selectedItem.id, quantity });
      toast.success("Đã thêm vào giỏ hàng");
    }
  };

  const handleBuyNow = async () => {
    if (product && selectedItem) {
      try {
        const response = await addItem({ productItemId: selectedItem.id, quantity });
        if (response?.isSuccess && response.data) {
          const cartItem = response.data.items.find((i) => i.productItemId === selectedItem.id);
          if (cartItem) {
            navigate("/checkout", { state: { selectedItemIds: [cartItem.id] } });
          } else {
            navigate("/cart");
          }
        }
      } catch (error) {
        toast.error("Lỗi khi mua ngay");
      }
    }
  };

  // Mở cuộc trò chuyện hỗ trợ với shop của sản phẩm. Không dùng useChatbox() ở đây — ChatWidget
  // (AppLayout) đã mount hook đó toàn cục và tự giữ kết nối SignalR + subscription. Dispatch thẳng
  // vào state chung rồi gọi REST để nạp tin nhắn / join phòng, mirror ShopDetailPage.
  const handleChatWithShop = async () => {
    if (!shop) return;
    if (!isAuthenticated) {
      dispatch(setAuthModal("login"));
      return;
    }
    if (openingChatRef.current) return; // đang mở phòng — chặn click trùng
    openingChatRef.current = true;
    setIsOpeningChat(true);
    try {
      const res = await chatApi.startStoreSupport(shop.id);
      if (!res.data.isSuccess) {
        toast.error(res.data.message || "Không mở được cuộc trò chuyện với cửa hàng.");
        return;
      }
      const box = res.data.data;
      dispatch(upsertChatbox(box));
      dispatch(setActiveChatbox(box.id));
      dispatch(setView("conversation"));
      dispatch(openChatbox());
      void chatHub.joinChatbox(box.id).catch(() => { });
      const msgRes = await chatApi.getMessages(box.id);
      if (msgRes.data.isSuccess) {
        dispatch(setMessages({ roomId: box.id, messages: [...msgRes.data.data.items].reverse() }));
      }
    } catch {
      toast.error("Không mở được cuộc trò chuyện với cửa hàng.");
    } finally {
      openingChatRef.current = false;
      setIsOpeningChat(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const openLightbox = () => {
    if (!product || sortedImages.length === 0) return;
    const idx = sortedImages.findIndex((img) => img.url === activeImage);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
    setIsLightboxOpen(true);
  };

  const handleNextImage = useCallback(() => {
    if (!product || sortedImages.length === 0) return;
    const nextIdx = (lightboxIndex + 1) % sortedImages.length;
    setLightboxIndex(nextIdx);
    setActiveImage(sortedImages[nextIdx].url);
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
  }, [lightboxIndex, product, sortedImages, setActiveImage]);

  const handlePrevImage = useCallback(() => {
    if (!product || sortedImages.length === 0) return;
    const prevIdx = (lightboxIndex - 1 + sortedImages.length) % sortedImages.length;
    setLightboxIndex(prevIdx);
    setActiveImage(sortedImages[prevIdx].url);
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
  }, [lightboxIndex, product, sortedImages, setActiveImage]);

  const handleMainNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sortedImages.length <= 1) return;
    const currentIndex = sortedImages.findIndex((img) => img.url === activeImage);
    const nextIndex = (currentIndex + 1) % sortedImages.length;
    setActiveImage(sortedImages[nextIndex].url);
  };

  const handleMainPrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sortedImages.length <= 1) return;
    const currentIndex = sortedImages.findIndex((img) => img.url === activeImage);
    const prevIndex = (currentIndex - 1 + sortedImages.length) % sortedImages.length;
    setActiveImage(sortedImages[prevIndex].url);
  };

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (thumbRef.current) {
      const scrollAmount = thumbRef.current.clientWidth / 2; // Scroll half a page for smoother UX
      thumbRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const handleZoomIn = () => {
    setScale((s) => Math.min(s + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((s) => {
      const next = Math.max(s - 0.5, 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      handleResetZoom();
    } else {
      setScale(2);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMoveModal = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || scale <= 1) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (scale <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || scale <= 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPanOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      } else if (e.key === "ArrowLeft") {
        handlePrevImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, handleNextImage, handlePrevImage]);

  // Auto swipe main image every 5 seconds
  useEffect(() => {
    if (!product || sortedImages.length <= 1 || isLightboxOpen || isHovering) return;

    const intervalId = setInterval(() => {
      setActiveImage((currentImage) => {
        const currentIndex = sortedImages.findIndex((img) => img.url === currentImage);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % sortedImages.length;
        return sortedImages[nextIndex].url;
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [product, sortedImages, isLightboxOpen, isHovering]);

  const error = failed ? "Không thể tải thông tin sản phẩm" : null;

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6 animate-pulse">
        <div className="mb-4 h-4 w-20 rounded bg-gray-200" />
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <div className="w-full sm:w-[360px] shrink-0">
            <div className="aspect-square w-full rounded-xl bg-gray-200" />
            <div className="mt-2 flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 w-16 rounded-lg bg-gray-200" />
              ))}
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <div className="h-6 w-3/4 rounded bg-gray-200" />
            <div className="h-4 w-1/3 rounded bg-gray-200" />
            <div className="h-10 w-1/2 rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-5/6 rounded bg-gray-200" />
            <div className="mt-4 flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 w-24 rounded-lg bg-gray-200" />
              ))}
            </div>
            <div className="mt-4 h-12 w-48 rounded-xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !product) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center px-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-base font-medium text-gray-800">{error || "Không tìm thấy sản phẩm"}</p>
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const currentPrice = selectedItem?.price ?? product.items[0]?.price ?? 0;
  const outOfStock = selectedItem?.stock === 0;

  const elementLabel = product.primaryElement
    ? ELEMENT_LABELS[product.primaryElement] || product.primaryElement
    : null;
  const elementColor = product.primaryElement
    ? ELEMENT_COLORS[product.primaryElement] || "bg-primary"
    : "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-500">
        <Link to="/" className="hover:text-primary transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <Link to="/products" className="hover:text-primary transition-colors">
          Sản phẩm
        </Link>
        {product && product.categories && product.categories.length > 0 && (
          <>
            <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
            <Link
              to={`/products?categoryId=${product.categories[0].id}`}
              className="hover:text-primary transition-colors whitespace-nowrap"
            >
              {product.categories[0].name}
            </Link>
          </>
        )}
        {product && (
          <>
            <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-gray-900 line-clamp-1" title={product.name}>
              {product.name}
            </span>
          </>
        )}
      </nav>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col sm:flex-row">
          {/* ── Left: Images ─────────────────────────────────────────────── */}
          <div className="w-full shrink-0 p-4 sm:w-[440px] sm:p-6 lg:w-[520px]">
            {/* Main image */}
            <div
              className="relative aspect-square w-full overflow-hidden shadow-inner cursor-zoom-in group select-none"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onClick={openLightbox}
            >
              {elementLabel && (
                <div
                  className={`absolute top-3 right-3 z-10 rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm pointer-events-none ${elementColor}`}
                >
                  Mệnh {elementLabel}
                </div>
              )}
              {activeImage ? (
                <>
                  <motion.img
                    key={activeImage}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    src={activeImage}
                    alt={product.name}
                    style={{
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                      transform: isHovering ? "scale(2.2)" : "scale(1)",
                    }}
                    className="h-full w-full object-contain transition-transform duration-300 ease-out"
                  />
                  {/* Slider Controls */}
                  {sortedImages.length > 1 && (
                    <>
                      <button
                        onClick={handleMainPrevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md backdrop-blur-sm opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-white cursor-pointer"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={handleMainNextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md backdrop-blur-sm opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-white cursor-pointer"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                  {/* Zoom hint overlay */}
                  <div className="absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-md backdrop-blur-sm opacity-0 transition-all duration-200 group-hover:opacity-100 scale-95 group-hover:scale-100 pointer-events-none">
                    <Maximize2 size={16} />
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-300">
                  Không có ảnh
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {sortedImages.length > 1 && (
              <div className="relative mt-3 group/thumb">
                {sortedImages.length > 5 && (
                  <button
                    onClick={() => scrollThumbnails('left')}
                    className="absolute left-1 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md backdrop-blur-sm opacity-0 transition-all duration-200 group-hover/thumb:opacity-100 hover:bg-white cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                )}

                <style>{`
                  .hide-scrollbar-force::-webkit-scrollbar {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                  }
                `}</style>
                <div
                  ref={thumbRef}
                  className="flex gap-2 sm:gap-3 overflow-x-auto snap-x snap-mandatory pb-1 hide-scrollbar-force"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {sortedImages.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImage(img.url)}
                      className={`group aspect-square w-[calc(20%-0.4rem)] sm:w-[calc(20%-0.6rem)] shrink-0 snap-start overflow-hidden rounded-lg border-2 bg-gray-50 transition-all cursor-pointer ${activeImage === img.url
                        ? "border-primary"
                        : "border-transparent hover:border-gray-300"
                        }`}
                    >
                      <img src={img.url} alt="thumb" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                    </button>
                  ))}
                </div>

                {sortedImages.length > 5 && (
                  <button
                    onClick={() => scrollThumbnails('right')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md backdrop-blur-sm opacity-0 transition-all duration-200 group-hover/thumb:opacity-100 hover:bg-white cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Info ───────────────────────────────────────────────── */}
          <div className="flex flex-1 flex-col gap-5 border-t border-gray-100 p-4 sm:border-l sm:border-t-0 sm:p-6">
            {/* Categories */}
            {product.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.categories.map((cat) => (
                  <span
                    key={cat.id}
                    className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            )}

            {/* Name + store */}
            <div>
              <h1 className="text-xl font-bold leading-snug text-gray-900 sm:text-2xl">
                {product.name}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-gray-400">
                <p>
                  Cửa hàng:{" "}
                  <button
                    onClick={() =>
                      product.gardenStoreId && navigate(`/stores/${product.gardenStoreId}`)
                    }
                    className="font-medium text-primary hover:underline cursor-pointer focus:outline-none bg-transparent border-0 p-0"
                  >
                    {product.storeName}
                  </button>
                </p>
                {selectedItem?.sku && (
                  <>
                    <span className="hidden sm:block h-3 w-px bg-gray-300"></span>
                    <p>
                      Mã sản phẩm:{" "}
                      <span className="font-medium text-gray-600">{selectedItem.sku}</span>
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-3xl font-bold text-primary">
                {currentPrice.toLocaleString("vi-VN")}
                <span className="text-lg">đ</span>
              </p>
            </div>

            {/* Variants */}
            {product.items.length > 0 && (
              <div>
                <div className="mb-2.5 flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Phân loại</span>
                  {selectedItem && (
                    <span className="text-xs text-gray-400">
                      Kho: {selectedItem.stock} sản phẩm
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.items.map((item) => {
                    const isSelected = selectedItem?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`relative flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all focus:outline-none cursor-not-allowed ${isSelected
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 text-gray-600 hover:border-primary/40 hover:bg-gray-50 cursor-pointer"
                          }`}
                      >
                        {item.name}
                        <span className="text-xs opacity-60">
                          {item.price.toLocaleString("vi-VN")}đ
                        </span>
                        {isSelected && (
                          <Check className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-primary p-0.5 text-white" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Feng Shui attributes */}
            {product.primaryElement && (
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  Hành: {ELEMENT_LABELS[product.primaryElement] ?? product.primaryElement}
                </span>
                {(product.secondaryElements ?? []).map((el) => (
                  <span
                    key={el}
                    className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500"
                  >
                    {ELEMENT_LABELS[el] ?? el}
                  </span>
                ))}
                {(product.vibes ?? []).concat(product.styles ?? []).map((code) => (
                  <span
                    key={code}
                    className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500"
                  >
                    {code}
                  </span>
                ))}
              </div>
            )}

            {/* Physical attributes */}
            {selectedItem && (selectedItem.weightGram > 0 || selectedItem.lengthCm > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {selectedItem.weightGram > 0 && (
                  <span className="rounded-md  border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500">
                    Nặng: {selectedItem.weightGram}g
                  </span>
                )}
                {(selectedItem.lengthCm > 0 ||
                  selectedItem.widthCm > 0 ||
                  selectedItem.heightCm > 0) && (
                    <span className="rounded-md  border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500">
                      Kích thước: {selectedItem.lengthCm}x{selectedItem.widthCm}x
                      {selectedItem.heightCm} cm
                    </span>
                  )}
              </div>
            )}

            {/* Add to cart */}
            <div className="mt-auto pt-2 flex flex-col gap-3">
              <div className="flex flex-row gap-3">
                {/* Quantity Selector */}
                <div className="flex items-center rounded-lg border border-gray-200 bg-white p-1 h-10 sm:h-11 w-24 sm:w-28 shrink-0 shadow-sm">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || outOfStock}
                    className="flex h-full flex-1 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={quantity}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setQuantity(val === "" ? ("" as any) : parseInt(val, 10));
                    }}
                    onBlur={() => {
                      let val = Number(quantity);
                      if (isNaN(val) || val < 1) val = 1;
                      if (selectedItem && val > selectedItem.stock) val = selectedItem.stock;
                      setQuantity(val);
                    }}
                    className="flex-1 w-8 sm:w-10 text-center text-sm font-semibold tabular-nums text-gray-900 focus:outline-none bg-transparent"
                  />
                  <button
                    onClick={() =>
                      setQuantity((q) =>
                        selectedItem ? Math.min(selectedItem.stock, q + 1) : q + 1,
                      )
                    }
                    disabled={(selectedItem && quantity >= selectedItem.stock) || outOfStock}
                    className="flex h-full flex-1 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!selectedItem || outOfStock}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border-1 border-primary bg-primary/5 px-2 sm:px-4 py-0 text-sm font-semibold text-primary transition-all hover:bg-primary/10 active:scale-95 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:bg-gray-50 cursor-pointer h-10 sm:h-11 w-full"
                >
                  <ShoppingCart className="h-4 w-4 shrink-0" />
                  <span className="truncate">{outOfStock ? "Hết hàng" : "Thêm giỏ hàng"}</span>
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                disabled={!selectedItem || outOfStock}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-0 text-lg font-bold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none cursor-pointer h-11 sm:h-12 w-full"
              >
                {outOfStock ? "HẾT HÀNG" : "MUA NGAY"}
              </button>
            </div>

            {/* Promotional Banners */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 shrink-0 shadow-sm">
                  <Truck className="h-4 w-4" />
                </div>
                <span className="font-semibold">
                  Free Ship TP.Hồ Chí Minh cho hoá đơn từ 500.000đ
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Độ phù hợp phong thủy với không gian của bạn ─────────────────── */}
      {product.primaryElement && <ProductFitSection productId={product.id} />}

      {/* ── Store Info ─────────────────────────────────────────────────── */}
      {shop && (
        <div className="mt-6 rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex items-center gap-4 border-b border-gray-100 pb-6 md:border-b-0 md:pb-0 md:border-r md:pr-6 shrink-0 w-full md:w-auto">
            <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 ring-4 ring-gray-50">
              <Store className="h-8 w-8" />
            </div>
            <div>
              <h2
                onClick={() => navigate(`/stores/${shop.id}`)}
                className="text-lg font-bold text-gray-900 leading-tight hover:text-primary transition-colors cursor-pointer"
              >
                {shop.name}
              </h2>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleChatWithShop}
                  disabled={isOpeningChat}
                  className="flex items-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Chat ngay
                </button>
                <button
                  onClick={() => navigate(`/stores/${shop.id}`)}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Store className="h-3.5 w-3.5" />
                  Xem Shop
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
            <div className="flex flex-col gap-1.5 text-gray-500">
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" /> Hotline
              </span>
              <span className="font-semibold text-primary">{shop.hotline || "Đang cập nhật"}</span>
            </div>
            <div className="flex flex-col gap-1.5 text-gray-500">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Giờ mở cửa
              </span>
              <span className="font-medium text-gray-800">
                {shop.openingHours || "Đang cập nhật"}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 text-gray-500 sm:col-span-2 lg:col-span-1">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> Địa chỉ
              </span>
              <span className="font-medium text-gray-800 line-clamp-2">
                {typeof shop.address === "object" && shop.address
                  ? (shop.address as any).streetAddress || "Đang cập nhật"
                  : typeof shop.address === "string"
                    ? shop.address
                    : "Đang cập nhật"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      {product.description && (
        <div className="mt-6 rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-4 sm:p-6 overflow-hidden">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-4 border-b border-gray-100">
            Mô tả sản phẩm
          </h2>
          <div
            className="text-sm leading-relaxed text-gray-600 quill-content"
            dangerouslySetInnerHTML={{ __html: product.description.replace(/&nbsp;/g, " ") }}
          />
        </div>
      )}

      {/* Reviews Section */}
      <ReviewSection productId={product.id} />

      {/* Same Store Products Section */}
      {product.gardenStoreId && (
        <SuggestedProductsSection
          title="Các sản phẩm khác của shop"
          currentProductId={product.id}
          storeId={product.gardenStoreId}
        />
      )}

      {/* Suggested Products Section */}
      <SuggestedProductsSection
        title="Có thể bạn cũng thích"
        currentProductId={product.id}
        categoryId={product.categories?.[0]?.id}
        hideViewAll
      />

      <FeatureBar />
      <CommitmentPage />

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <div className="fixed inset-0 z-[120] flex flex-col items-center justify-between bg-black/95 backdrop-blur-md p-4 select-none">
            {/* Top bar */}
            <div className="w-full flex items-center justify-between px-4 py-2 text-white z-10">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-300 truncate max-w-[200px] sm:max-w-md">
                  {product.name}
                </span>
                {sortedImages.length > 0 && (
                  <span className="text-xs text-gray-400 mt-0.5">
                    {lightboxIndex + 1} / {sortedImages.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <button
                  onClick={handleZoomOut}
                  disabled={scale <= 1}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Thu nhỏ"
                >
                  <ZoomOut size={18} />
                </button>
                <button
                  onClick={handleZoomIn}
                  disabled={scale >= 4}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Phóng to"
                >
                  <ZoomIn size={18} />
                </button>
                <button
                  onClick={handleResetZoom}
                  disabled={scale === 1 && panOffset.x === 0 && panOffset.y === 0}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Đặt lại"
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  onClick={() => setIsLightboxOpen(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
                  title="Đóng (Esc)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Main view area */}
            <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden my-4">
              {/* Prev Button */}
              {sortedImages.length > 1 && (
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white cursor-pointer transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
              )}

              {/* Image Container with Zoom & Pan */}
              <div
                className="w-full h-full flex items-center justify-center overflow-hidden"
                onMouseMove={handleMouseMoveModal}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              >
                {sortedImages[lightboxIndex] && (
                  <img
                    src={sortedImages[lightboxIndex].url}
                    alt="Product preview"
                    onDoubleClick={handleDoubleClick}
                    draggable={false}
                    style={{
                      transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
                      cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
                      transition: isDragging ? "none" : "transform 0.15s ease-out",
                    }}
                    className="max-h-full max-w-full object-contain pointer-events-auto select-none"
                  />
                )}
              </div>

              {/* Next Button */}
              {sortedImages.length > 1 && (
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white cursor-pointer transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              )}
            </div>

            {/* Bottom thumbnail bar */}
            {sortedImages.length > 1 && (
              <div className="w-full max-w-xl px-4 py-2 overflow-x-auto flex justify-center gap-2 select-none z-10 pb-4">
                {sortedImages.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => {
                      setLightboxIndex(idx);
                      setActiveImage(img.url);
                      setScale(1);
                      setPanOffset({ x: 0, y: 0 });
                    }}
                    className={`h-12 w-12 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-gray-900 transition-all ${lightboxIndex === idx
                      ? "border-primary"
                      : "border-transparent opacity-50 hover:opacity-100"
                      }`}
                  >
                    <img
                      src={img.url}
                      alt="Lightbox thumb"
                      className="h-full w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductFitSection({ productId }: { productId: string }) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => !!s.auth.token);

  return (
    <div className="mt-6 rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-4 sm:p-6">
      {isAuthenticated ? (
        <ProductFitPanel productId={productId} />
      ) : (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="text-sm font-bold text-gray-900">
            Độ phù hợp phong thủy với không gian của bạn
          </span>
          <p className="max-w-md text-sm text-gray-500">
            Đăng nhập để xem sản phẩm này hợp đến đâu với bản mệnh và Ngũ hành từng phòng của bạn.
          </p>
          <button
            onClick={() => dispatch(setAuthModal("login"))}
            className="cursor-pointer rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Đăng nhập
          </button>
        </div>
      )}
    </div>
  );
}

interface SuggestedProductsSectionProps {
  title?: string;
  currentProductId: string;
  categoryId?: string;
  storeId?: string;
  hideViewAll?: boolean;
}

function SuggestedProductsSection({
  title = "Sản phẩm tương tự",
  currentProductId,
  categoryId,
  storeId,
  hideViewAll,
}: SuggestedProductsSectionProps) {
  const { products, loading } = useProductList({
    categoryId: categoryId || undefined,
    storeId: storeId || undefined,
    pageSize: 6,
  });

  const displayProducts = products.filter((p) => p.id !== currentProductId).slice(0, 4);

  if (!loading && displayProducts.length === 0) {
    return null;
  }

  let viewAllLink = "";
  if (!hideViewAll) {
    if (categoryId) {
      viewAllLink = `/products?categoryId=${categoryId}`;
    } else if (storeId) {
      viewAllLink = `/stores/${storeId}`;
    }
  }

  return (
    <section className="mt-6 w-full overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2 sm:mb-6">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="shrink-0 text-sm font-medium text-primary transition-colors hover:text-primary-dark cursor-pointer"
          >
            Xem tất cả &rsaquo;
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {displayProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
