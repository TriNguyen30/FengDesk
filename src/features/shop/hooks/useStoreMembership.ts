import { useEffect, useState } from "react";
import { getStoreMembershipRequest } from "../api/shop.api";
import type { StoreMembership } from "../types/shop";

/**
 * Vai trò của user hiện tại với một store (GET /stores/{id}/membership) — nguồn sự thật
 * cho việc ẩn/hiện UI owner-only. Không dùng role global: garden staff được nhận diện
 * bằng staff assignment Accepted, không phải bằng role trong token.
 */
export function useStoreMembership(storeId?: string) {
  const [membership, setMembership] = useState<StoreMembership | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) {
      setMembership(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getStoreMembershipRequest(storeId)
      .then((res) => {
        if (!active) return;
        setMembership(res.isSuccess && res.data ? res.data : null);
      })
      .catch(() => {
        if (active) setMembership(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [storeId]);

  return {
    membership,
    loading,
    /**
     * Được sửa hồ sơ + xem tab Thống kê/Nhân viên. Staff assignment thắng role global:
     * admin mà đồng thời là nhân viên của chính store này thì ở màn store vẫn bị giới hạn
     * như nhân viên (BE `isStaff` đã loại owner sẵn). Khu /admin và /manager không đổi.
     */
    isOwnerView:
      !!membership && (membership.isOwner || (membership.isAdmin && !membership.isStaff)),
    /** Owner, staff Accepted hoặc admin — được vào khu quản lý của cửa hàng. */
    isShopMember: !!membership?.canManage,
  };
}
