import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Store, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useProductList } from "@/features/products/hooks/useProducts";
import { getShopRequestById } from "@/features/shop/api/shop.api";
import { Shop } from "@/features/shop/types/shop";
import { useAppDispatch } from "@/app/store";
import { openChatbox } from "@/features/chatbox/store/chatboxSlice";
import { ShopHeader, ShopSidebar, ShopProductCatalog } from "../components";

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [shop, setShop] = useState<Shop | null>(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const shopAddressText =
    typeof shop.address === "object" && shop.address
      ? (shop.address as any).streetAddress || "Đang cập nhật"
      : typeof shop.address === "string"
        ? shop.address
        : "Đang cập nhật";

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
      />

      {/* Main Grid: Details Sidebar & Products list */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Component */}
        <ShopSidebar shop={shop} shopAddressText={shopAddressText} />

        {/* Catalog Component */}
        <ShopProductCatalog
          products={products}
          loadingProducts={loadingProducts}
          totalCount={totalCount}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
      </div>
    </div>
  );
}
