import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";
import { ShopStaffSection } from "@/features/shop/components/ShopStaffSection";
import { getShopRequestById } from "@/features/shop/api/shop.api";
import type { Shop } from "@/features/shop/types/shop";

export default function ShopStaffPage() {
  const { storeId = "" } = useParams<{ storeId: string }>();
  const [shop, setShop] = useState<Shop | null>(null);

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link to="/seller" className="inline-flex items-center gap-1 hover:text-primary">
          <ArrowLeft size={14} />
          Cửa hàng của tôi
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-700">Nhân viên</span>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Users size={22} />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Nhân viên {shop ? `— ${shop.name}` : ""}
          </h1>
          <p className="text-sm text-gray-500">Mời người dùng và quản lý phân công cho cửa hàng.</p>
        </div>
      </div>

      {storeId && <ShopStaffSection storeId={storeId} />}
    </div>
  );
}
