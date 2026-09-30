import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Truck } from "lucide-react";
import { ShopDeliveriesView } from "../components/ShopDeliveriesView";
import { getShopRequestById } from "@/features/shop/api/shop.api";
import { useStoreMembership } from "@/features/shop/hooks/useStoreMembership";
import type { Shop } from "@/features/shop/types/shop";

export default function ShopDeliveriesPage() {
  const { storeId = "" } = useParams<{ storeId: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  // Route chỉ bọc ProtectedRoute (kiểm tra ĐĂNG NHẬP, không kiểm tra store này có phải của mình),
  // nên phải tự chặn theo membership: mở thẳng URL với id cửa hàng của người khác thì BE trả 403
  // cho danh sách, NHƯNG khung trang + tên cửa hàng vẫn hiện ra như thể mình quản lý nó.
  const { isShopMember, loading: loadingMembership } = useStoreMembership(storeId);

  useEffect(() => {
    let active = true;
    if (!storeId) return;
    (async () => {
      try {
        const res = await getShopRequestById(storeId);
        if (!active) return;
        if (res.isSuccess && res.data) setShop(res.data);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      active = false;
    };
  }, [storeId]);

  if (loadingMembership) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-400">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  if (!isShopMember) {
    return <Navigate to={`/stores/${storeId}`} replace />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link
          to={`/stores/${storeId}`}
          className="inline-flex items-center gap-1 hover:text-primary"
        >
          <ArrowLeft size={14} />
          Cửa hàng của tôi
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Quản lý đơn giao</span>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Truck size={22} />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Đơn giao của cửa hàng
            </h1>
            <p className="text-sm text-gray-500">
              {shop ? shop.name : "Đang tải..."} · Nhận đơn rồi tạo vận đơn để bắt đầu giao.
            </p>
          </div>
        </div>
      </div>

      <ShopDeliveriesView storeId={storeId} />
    </div>
  );
}
