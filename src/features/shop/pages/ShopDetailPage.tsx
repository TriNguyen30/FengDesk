import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BarChart3, ChevronLeft, MessagesSquare, Store, Truck, Users, Package } from "lucide-react";
import { toast } from "sonner";
import { useProductList } from "@/features/products/hooks/useProducts";
import { getShopRequestById, getStoreMembershipRequest } from "@/features/shop/api/shop.api";
import { Shop, StoreMembership } from "@/features/shop/types/shop";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { chatApi, chatHub } from "@/features/chatbox";
import {
  openChatbox,
  setActiveChatbox,
  setMessages,
  setView,
  upsertChatbox,
} from "@/features/chatbox/store/chatboxSlice";
import {
  ShopChatInbox,
  ShopDeliveriesView,
  ShopHeader,
  ShopProductCatalog,
  ShopSidebar,
  ShopStaffSection,
  ShopStatsSection,
} from "../components";
import ShopReturnsView from "../components/ShopReturnsView";
import FeatureBar from "@/components/ui/FeatureBar";
import CommitmentPage from "@/components/ui/CommitmentPage";

type ShopTab = "products" | "stats" | "deliveries" | "returns" | "chat" | "staff";

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);

  const [shop, setShop] = useState<Shop | null>(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ShopTab>("products");
  // Vai trò của user với store từ BE /stores/{id}/membership — nguồn sự thật duy nhất
  // (owner chính / đồng sở hữu / garden staff Accepted / admin). Null = khách.
  const [membership, setMembership] = useState<StoreMembership | null>(null);
  // Guard chống double-click nút "Chat ngay": ref chặn đồng bộ, state để disable nút cho UX.
  const openingChatRef = useRef(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);

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

  // Membership per-store từ BE — cover cả staff-only (khác /stores/mine trước đây).
  useEffect(() => {
    if (!id || !currentUser?.id) {
      setMembership(null);
      return;
    }
    let active = true;
    getStoreMembershipRequest(id)
      .then((res) => {
        if (!active) return;
        setMembership(res.isSuccess && res.data ? res.data : null);
      })
      .catch(() => {
        if (active) setMembership(null);
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

  // Không dùng useChatbox() ở đây — ChatWidget (AppLayout) đã mount hook đó toàn cục và tự giữ kết
  // nối SignalR + subscription "messageReceived". Gọi thêm 1 instance nữa sẽ đăng ký trùng handler
  // → mỗi tin nhắn cộng unread 2 lần. Thay vào đó dispatch thẳng vào state chung (widget đang lắng
  // nghe Redux nên tự phản ứng: mark-as-read, v.v.) + gọi REST để nạp tin nhắn/join phòng.
  const handleChatWithShop = async () => {
    if (!shop) return;
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
      void chatHub.joinChatbox(box.id).catch(() => {});
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

  // Phân quyền theo membership per-store (KHÔNG theo role global):
  // - Owner (chính/đồng sở hữu) / Admin: full quyền — sửa hồ sơ, xem thống kê + nhân viên.
  // - Garden staff (Accepted): chỉ xử lý đơn giao / trả hàng / tin nhắn.
  const isOwnerView = !!membership && (membership.isOwner || membership.isAdmin);
  const isShopMember = !!membership?.canManage;
  const canEditShopProfile = isOwnerView;
  const shopAddressText =
    typeof shop.address === "object" && shop.address
      ? (shop.address as any).streetAddress || "Đang cập nhật"
      : typeof shop.address === "string"
        ? shop.address
        : "Đang cập nhật";

  // Tab hiện theo vai trò per-store: staff KHÔNG thấy "Thống kê" + "Nhân viên" (BE cũng chặn 403).
  const TABS: { value: ShopTab; label: string; icon: typeof Store; hidden?: boolean }[] = [
    { value: "products", label: "Sản phẩm", icon: Store },
    { value: "stats", label: "Thống kê", icon: BarChart3, hidden: !isOwnerView },
    { value: "deliveries", label: "Đơn giao", icon: Truck },
    { value: "returns", label: "Trả hàng", icon: Package },
    { value: "chat", label: "Tin nhắn", icon: MessagesSquare },
    { value: "staff", label: "Nhân viên", icon: Users, hidden: !isOwnerView },
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
        chatDisabled={isOpeningChat}
        onFollowClick={() => toast.success(`Đã theo dõi cửa hàng ${shop.name}`)}
        joinedTimeAgo={getJoinedTimeAgo(shop.createdAt)}
        isMember={isShopMember}
        onManageDeliveriesClick={() => setActiveTab("deliveries")}
      />

      {/* Owner-only tabs */}
      {isShopMember && (
        <div className="mb-6 flex flex-wrap gap-1.5 border-b border-gray-100">
          {TABS.filter((tab) => !tab.hidden).map((tab) => {
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
            canEdit={canEditShopProfile}
            onShopUpdated={(updated) => setShop(updated)}
          />
          <ShopProductCatalog
            products={products}
            loadingProducts={loadingProducts}
            totalCount={totalCount}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            shopId={shop.id}
            isShopMember={isShopMember}
            canAddProduct={isOwnerView}
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

      {activeTab === "returns" && isShopMember && shop.id && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Đơn trả hàng của cửa hàng</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Nhận đơn để vào trạng thái xử lý, sau đó tạo vận đơn để gọi đơn vị giao hàng.
              </p>
            </div>
            <button
              onClick={() => navigate(`/seller/${shop.id}/returns`)}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              Mở trang đầy đủ →
            </button>
          </div>
          <ShopReturnsView storeId={shop.id} />
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
          <ShopChatInbox storeId={shop.id} />
        </div>
      )}

      {activeTab === "stats" && isOwnerView && shop.id && <ShopStatsSection storeId={shop.id} />}

      {activeTab === "staff" && isOwnerView && shop.id && <ShopStaffSection storeId={shop.id} />}

      <FeatureBar />
      <CommitmentPage />
    </div>
  );
}
