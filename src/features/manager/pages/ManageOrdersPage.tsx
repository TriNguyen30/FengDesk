import { useState, useEffect, useMemo } from "react";
import { Store as StoreIcon, Loader2 } from "lucide-react";
import { useAppSelector } from "@/app/store";
import { getAllShopRequest, getMyShopsRequest } from "@/features/shop/api/shop.api";
import type { Shop } from "@/features/shop/types/shop";
import { ShopDeliveriesView } from "@/features/shop/components/ShopDeliveriesView";

export default function ManageOrdersPage() {
  const currentUser = useAppSelector((s) => s.auth.user);
  const userRoles = useMemo(
    () => (currentUser?.role ?? "").split(",").map((r) => r.trim()),
    [currentUser?.role],
  );
  const isAdmin = useMemo(
    () => userRoles.some((r) => ["Admin", "SystemAdmin"].includes(r)),
    [userRoles],
  );

  const [userActiveStores, setUserActiveStores] = useState<Shop[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [loadingStores, setLoadingStores] = useState<boolean>(true);

  // Fetch active stores where user is in role (Owner, Staff, or Manager/Admin)
  useEffect(() => {
    let isMounted = true;
    const fetchUserStores = async () => {
      setLoadingStores(true);
      try {
        const [allRes, mineRes] = await Promise.allSettled([
          getAllShopRequest(),
          getMyShopsRequest(),
        ]);

        let allStores: Shop[] = [];
        if (allRes.status === "fulfilled" && allRes.value?.isSuccess && allRes.value.data) {
          allStores = allRes.value.data;
        }

        const ownedIds = new Set<string>();
        const staffIds = new Set<string>();

        if (mineRes.status === "fulfilled" && mineRes.value?.isSuccess && mineRes.value.data) {
          mineRes.value.data.forEach((s) => {
            if (s.isOwner !== false) {
              ownedIds.add(s.id);
            } else {
              staffIds.add(s.id);
            }
          });
        }

        let enrichedStores = allStores.map((s) => ({
          ...s,
          isOwner:
            s.isOwner ||
            ownedIds.has(s.id) ||
            (!!currentUser?.id && s.ownerUserId === currentUser.id),
          isStaff: staffIds.has(s.id),
        }));

        if (enrichedStores.length === 0 && mineRes.status === "fulfilled" && mineRes.value?.data) {
          enrichedStores = mineRes.value.data.map((s) => ({
            ...s,
            isOwner: s.isOwner !== false || (!!currentUser?.id && s.ownerUserId === currentUser.id),
            isStaff: !s.isOwner && (s as any).isStaff,
          }));
        }

        // Filter ONLY ACTIVE stores (isActive === true)
        const activeStores = enrichedStores.filter((s) => s.isActive);

        // Filter for stores where user has a role (isOwner || isStaff), unless Admin
        const validStores = activeStores.filter((s) => {
          if (isAdmin) return true;
          return (
            s.isOwner ||
            (s as any).isStaff ||
            (!!currentUser?.id && s.ownerUserId === currentUser.id)
          );
        });

        if (isMounted) {
          setUserActiveStores(validStores);
          if (validStores.length > 0) {
            setSelectedStoreId((prev) =>
              validStores.some((s) => s.id === prev) ? prev : validStores[0].id,
            );
          } else {
            setSelectedStoreId("");
          }
        }
      } catch (err) {
        console.error("Failed to load active stores for orders page:", err);
      } finally {
        if (isMounted) {
          setLoadingStores(false);
        }
      }
    };

    fetchUserStores();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, isAdmin]);

  return (
    <div className="space-y-6">
      {/* Header section with active store selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Quản lý Đơn hàng</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Xem và xử lý các đơn giao thuộc cửa hàng bạn quản lý.
          </p>
        </div>

        {/* Store Selector dropdown */}
        {userActiveStores.length > 0 && (
          <div className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-2xl border border-gray-200 shadow-xs">
            <StoreIcon size={16} className="text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold text-gray-600">Cửa hàng của tôi:</span>
            {loadingStores ? (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Loader2 size={13} className="animate-spin text-emerald-600" />
                <span>Đang tải...</span>
              </div>
            ) : (
              <select
                value={selectedStoreId}
                onChange={(e) => {
                  const targetId = e.target.value;
                  if (!isAdmin && !userActiveStores.some((s) => s.id === targetId)) {
                    return;
                  }
                  setSelectedStoreId(targetId);
                }}
                className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none cursor-pointer pr-1"
              >
                {userActiveStores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}{" "}
                    {store.isOwner ? "(Chủ cửa hàng)" : (store as any).isStaff ? "(Nhân viên)" : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loadingStores ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-2xl border border-gray-100 shadow-xs">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Đang tải chi nhánh hoạt động...</p>
        </div>
      ) : userActiveStores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-xs px-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <StoreIcon size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-900">Không tìm thấy chi nhánh hoạt động</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md">
            Bạn chưa thuộc chi nhánh nào đang hoạt động với vai trò Garden Owner hoặc Staff, hoặc
            cửa hàng hiện tại đang tạm ngưng.
          </p>
        </div>
      ) : selectedStoreId ? (
        <ShopDeliveriesView key={selectedStoreId} storeId={selectedStoreId} />
      ) : null}
    </div>
  );
}
