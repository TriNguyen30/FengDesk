import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, MessagesSquare, Store, Truck } from "lucide-react";
import { toast } from "sonner";
import { useProductList } from "@/features/products/hooks/useProducts";
import { getMyShopsRequest, getShopRequestById } from "@/features/shop/api/shop.api";
import { Shop } from "@/features/shop/types/shop";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { openChatbox } from "@/features/chatbox/store/chatboxSlice";
import {
  ShopChatInboxMockup,
  ShopDeliveriesView,
  ShopHeader,
  ShopProductCatalog,
  ShopSidebar,
} from "../components";

type ShopTab = "products" | "deliveries" | "chat";

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);

  const [shop, setShop] = useState<Shop | null>(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ShopTab>("products");
  // Cờ "user thuộc cửa hàng" — đúng cho owner + co-owner (qua /stores/mine).
  // Staff-only chưa detect được nếu không thêm endpoint BE.
  const [isMember, setIsMember] = useState(false);

  const {
    products,
    loading: loadingProducts,
    totalCount,
  } = useProductList({
    storeId: id || undefined,
    search: searchQuery || undefined,
    pageSize: 40,
  });

  useEffect(() => {
    if (!id) return;
    setLoadingShop(true);
    getShopRequestById(id)
      .then((res) => {
        if (res.isSuccess && res.data) {
          setShop(res.data);
        } else {
          toast.error("Không thể tải thông tin cửa hàng");
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Lỗi khi kết nối với máy chủ");
      })
      .finally(() => {
        setLoadingShop(false);
      });
  }, [id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  // Detect co-ownership: gọi /stores/mine (rẻ — chỉ vài shop). Chưa cover staff-only.
  useEffect(() => {
    if (!id || !currentUser?.id) {
      setIsMember(false);
      return;
    }
    let active = true;
    getMyShopsRequest()
      .then((res) => {
        if (!active) return;
        if (res.isSuccess && res.data) {
          setIsMember(res.data.some((s) => s.id === id));
        }
      })
      .catch(() => {
        if (active) setIsMember(false);
      });
    return () => {
      active = false;
    };
  }, [id, currentUser?.id]);

  // Đổi shop → reset về tab Sản phẩm để khách không kẹt ở tab owner-only.
  useEffect(() => {
    setActiveTab("products");
  }, [id]);

  const getJoinedTimeAgo = (createdAtString?: string) => {
    if (!createdAtString) return "Vừa mới";
    try {
      const created = new Date(createdAtString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - created.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 30) {
        return `${diffDays} ngày trước`;
      }
      const diffMonths = Math.floor(diffDays / 30);
      if (diffMonths < 12) {
        return `${diffMonths} tháng trước`;
      }
      const diffYears = Math.floor(diffMonths / 12);
      return `${diffYears} năm trước`;
    } catch (e) {
      return "Đang hoạt động";
    }
  };

  const handleChatWithShop = () => {
    if (shop) {
      dispatch(openChatbox());
      toast.success(`Đã kết nối với hỗ trợ viên của ${shop.name}`);
    }
  };

  if (loadingShop) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-pulse">
        <div className="h-6 w-20 rounded bg-gray-200" />
        <div className="h-44 w-full rounded-2xl bg-gray-200" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 h-60 rounded-2xl bg-gray-200" />
          <div className="lg:col-span-3 space-y-6">
            <div className="h-10 w-full rounded-xl bg-gray-200" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 rounded-xl bg-gray-200" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center space-y-4">
        <Store size={48} className="mx-auto text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900">Không tìm thấy cửa hàng</h2>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Cửa hàng này không tồn tại hoặc đã bị gỡ bỏ khỏi hệ thống.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark cursor-pointer transition-all"
        >
          Quay lại
        </button>
      </div>
    );
  }

  // isOwner = chủ chính (truyền vào ShopSidebar để cho sửa hồ sơ — quyết định BE: chỉ owner-chính được PUT /stores/{id}).
  // isMember = owner | co-owner | (sau này: staff) — quyết định ẩn nút "Theo dõi" + bật tab owner.
  const isOwner = !!currentUser?.id && currentUser.id === shop.ownerUserId;
  const isShopMember = isOwner || isMember;
  const shopAddressText =
    typeof shop.address === "object" && shop.address
      ? (shop.address as any).streetAddress || "Đang cập nhật"
      : typeof shop.address === "string"
        ? shop.address
        : "Đang cập nhật";

  const TABS: { value: ShopTab; label: string; icon: typeof Store }[] = [
    { value: "products", label: "Sản phẩm", icon: Store },
    { value: "deliveries", label: "Đơn giao", icon: Truck },
    { value: "chat", label: "Tin nhắn", icon: MessagesSquare },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary cursor-pointer transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Quay lại
      </button>

      {/* Shopee-style Header Card Component */}
      <ShopHeader
        shop={shop}
        totalProductsCount={totalCount}
        onChatClick={handleChatWithShop}
        onFollowClick={() => toast.success(`Đã theo dõi cửa hàng ${shop.name}`)}
        joinedTimeAgo={getJoinedTimeAgo(shop.createdAt)}
        isMember={isShopMember}
        onManageDeliveriesClick={() => setActiveTab("deliveries")}
      />

      {/* Owner-only tabs */}
      {isShopMember && (
        <div className="mb-6 flex flex-wrap gap-1.5 border-b border-gray-100">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = tab.value === activeTab;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab body */}
      {activeTab === "products" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <ShopSidebar
            shop={shop}
            shopAddressText={shopAddressText}
            canEdit={isOwner}
            onShopUpdated={(updated) => setShop(updated)}
          />
          <ShopProductCatalog
            products={products}
            loadingProducts={loadingProducts}
            totalCount={totalCount}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
        </div>
      )}

      {activeTab === "deliveries" && isShopMember && shop.id && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Đơn giao của cửa hàng</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Nhận đơn để vào trạng thái xử lý, sau đó tạo vận đơn để gọi đơn vị giao hàng.
              </p>
            </div>
            <button
              onClick={() => navigate(`/seller/${shop.id}/deliveries`)}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              Mở trang đầy đủ →
            </button>
          </div>
          <ShopDeliveriesView storeId={shop.id} />
        </div>
      )}

      {activeTab === "chat" && isShopMember && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Hộp thư khách hàng</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Tổng hợp tin nhắn khách gửi đến cửa hàng, có panel xem nhanh thông tin khách.
            </p>
          </div>
          <ShopChatInboxMockup />
        </div>
      )}
    </div>
  );
}
