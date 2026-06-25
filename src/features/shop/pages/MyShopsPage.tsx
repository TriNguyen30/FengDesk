import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Store, Plus, Phone, Clock, Loader2, ChevronRight } from "lucide-react";
import { getMyShopsRequest } from "@/features/shop/api/shop.api";
import type { Shop } from "@/features/shop/types/shop";

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

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-400">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  // Chưa có cửa hàng → đẩy thẳng sang màn tạo shop.
  if (shops.length === 0) {
    return <Navigate to="/become-seller" replace />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Store size={22} />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Cửa hàng của tôi</h1>
            <p className="text-sm text-gray-500">
              Bạn đang quản lý {shops.length} cửa hàng.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/become-seller")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-dark active:scale-95 self-start sm:self-auto"
        >
          <Plus size={16} />
          Mở cửa hàng mới
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {shops.map((shop) => (
          <button
            key={shop.id}
            onClick={() => navigate(`/stores/${shop.id}`)}
            className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-bold text-gray-900 line-clamp-1">{shop.name}</h2>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  shop.isActive
                    ? "bg-green-50 text-green-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {shop.isActive ? "Đang hoạt động" : "Tạm dừng"}
              </span>
            </div>

            {shop.description && (
              <p className="mt-1 line-clamp-2 text-sm text-gray-500">{shop.description}</p>
            )}

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

            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Xem cửa hàng
              <ChevronRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
