import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Store, Plus, Phone, Clock, Loader2, ChevronRight, Truck, Users } from "lucide-react";
import { getMyShopsRequest } from "@/features/shop/api/shop.api";
import type { Shop } from "@/features/shop/types/shop";

type SellerShopCard = {
  id: string;
  name: string;
  description?: string;
  hotline?: string;
  openingHours?: string;
  isActive: boolean;
  isOwner: boolean;
  roleLabel: string;
  roleDescription: string;
};

export default function MyShopsPage() {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getMyShopsRequest();
        if (!active) return;
        if (res.isSuccess && res.data) {
          setShops(res.data);
        } else {
          toast.error(res.message || "Không thể tải cửa hàng của bạn");
        }
      } catch (err) {
        console.error(err);
        if (active) toast.error("Đã xảy ra lỗi khi tải cửa hàng của bạn");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // /stores/mine đã gồm store user là owner HOẶC nhân viên (Accepted). Phân biệt nhãn qua isOwner.
  const storeCards = useMemo<SellerShopCard[]>(
    () =>
      shops.map((shop) => ({
        id: shop.id,
        name: shop.name,
        hotline: shop.hotline,
        openingHours: shop.openingHours,
        isActive: shop.isActive,
        isOwner: shop.isOwner ?? true,
        roleLabel: shop.isOwner === false ? "Nhân viên được phân công" : "Chủ cửa hàng",
        roleDescription:
          shop.isOwner === false
            ? "Bạn là nhân viên của cửa hàng này."
            : "Bạn đang quản lý cửa hàng này.",
      })),
    [shops],
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-400">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  // Chưa có cửa hàng owned hoặc được phân công → đẩy thẳng sang màn tạo shop.
  if (storeCards.length === 0) {
    return <Navigate to="/become-seller" replace />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500">
        <Link to="/" className="hover:text-primary transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <span className="text-gray-900">Cửa hàng của tôi</span>
      </nav>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Store size={22} />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Cửa hàng của tôi</h1>
            <p className="text-sm text-gray-500">
              Bạn đang có {storeCards.length} cửa hàng để truy cập.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/become-seller")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-dark active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          Mở cửa hàng mới
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {storeCards.map((shop) => (
          <div
            key={shop.id}
            className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md cursor-pointer"
            onClick={() => navigate(`/stores/${shop.id}`)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-bold text-gray-900 line-clamp-1">{shop.name}</h2>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-primary/80">
                  {shop.roleLabel}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  shop.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                }`}
              >
                {shop.isActive ? "Đang hoạt động" : "Tạm dừng"}
              </span>
            </div>

            {shop.description && (
              <p className="mt-1 line-clamp-2 text-sm text-gray-500">{shop.description}</p>
            )}

            <p className="mt-2 text-xs text-gray-400">{shop.roleDescription}</p>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              {shop.hotline && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={13} />
                  {shop.hotline}
                </span>
              )}
              {shop.openingHours && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} />
                  {shop.openingHours}
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => navigate(`/seller/${shop.id}/deliveries`)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-all cursor-pointer"
                >
                  <Truck size={13} />
                  Quản lý đơn giao
                </button>
                {shop.isOwner && (
                  <button
                    onClick={() => navigate(`/seller/${shop.id}/staff`)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    <Users size={13} />
                    Nhân viên
                  </button>
                )}
              </div>
              <button
                onClick={() => navigate(`/stores/${shop.id}`)}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline cursor-pointer"
              >
                Xem cửa hàng
                <ChevronRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
