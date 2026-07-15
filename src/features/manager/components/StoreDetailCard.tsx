import React from "react";
import { MapPin, Plus, Info, Users, Shield, UserMinus, UserPlus, RefreshCw } from "lucide-react";
import type { Shop, StoreAddress, StoreStaff } from "@/features/shop/types/shop";

interface StoreDetailCardProps {
  selectedStore: Shop;
  selectedStoreDetails: Shop | null;
  staff: StoreStaff[];
  loadingStaff: boolean;
  activeTab: "info" | "staff";
  onActiveTabChange: (tab: "info" | "staff") => void;
  onOpenAddressModal: (addr: StoreAddress | null) => void;
  onDeleteAddress: (hard: boolean) => void;
  deletingAddress: boolean;
  staffUserId: string;
  onStaffUserIdChange: (val: string) => void;
  staffRole: string;
  onStaffRoleChange: (val: string) => void;
  onAddStaff: (e: React.FormEvent) => void;
  submittingStaff: boolean;
  onRemoveStaff: (assignmentId: string) => void;
  deletingStaffId: string | null;
}

export function StoreDetailCard({
  selectedStore,
  selectedStoreDetails,
  staff,
  loadingStaff,
  activeTab,
  onActiveTabChange,
  onOpenAddressModal,
  onDeleteAddress,
  deletingAddress,
  staffUserId,
  onStaffUserIdChange,
  staffRole,
  onStaffRoleChange,
  onAddStaff,
  submittingStaff,
  onRemoveStaff,
  deletingStaffId,
}: StoreDetailCardProps) {
  const renderStoreAddressDetails = (storeDetails: Shop | null) => {
    if (!storeDetails) return null;

    // BE trả địa chỉ store ở field `address` (object StoreAddressResponse).
    const storeAddr: StoreAddress | null = (storeDetails as any).address ?? null;

    if (storeAddr && typeof storeAddr === "object" && storeAddr.streetAddress) {
      return (
        <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <MapPin size={16} className="text-primary" />
              Địa chỉ chi tiết (Cơ sở dữ liệu)
            </h4>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onOpenAddressModal(storeAddr)}
                className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors cursor-pointer"
              >
                Chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => onDeleteAddress(false)}
                disabled={deletingAddress}
                className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors disabled:opacity-55 cursor-pointer"
              >
                Xóa mềm
              </button>
              <button
                type="button"
                onClick={() => onDeleteAddress(true)}
                disabled={deletingAddress}
                className="text-xs font-semibold text-red-700 hover:text-red-900 transition-colors disabled:opacity-55 cursor-pointer"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 text-sm text-gray-600">
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-400 font-medium">Địa chỉ cụ thể</p>
              <p className="font-semibold text-gray-800 mt-0.5">{storeAddr.streetAddress}</p>
            </div>
            {storeAddr.latitude && storeAddr.longitude ? (
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-400 font-medium">Tọa độ trên bản đồ</p>
                <p className="font-mono text-xs text-gray-700 mt-0.5">
                  Lat: {storeAddr.latitude.toFixed(6)}, Lng: {storeAddr.longitude.toFixed(6)}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
        <MapPin size={24} className="mx-auto text-gray-300 mb-2" />
        <h4 className="text-sm font-semibold text-gray-800">Chưa thiết lập địa chỉ chi tiết</h4>
        <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
          Địa chỉ chuỗi văn phòng/kho hàng chi tiết chưa được cấu hình. Thiết lập tọa độ và thông
          tin liên hệ giúp khách hàng dễ tìm kiếm.
        </p>
        <button
          type="button"
          onClick={() => onOpenAddressModal(null)}
          className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/15 cursor-pointer"
        >
          <Plus size={14} />
          Thiết lập ngay
        </button>
      </div>
    );
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
      {/* Card Header with tabs */}
      <div className="border-b border-gray-100 bg-gray-50/50 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider font-mono">
              Mã: {selectedStore.id}
            </span>
            <h2 className="text-lg font-bold text-gray-900 mt-0.5">{selectedStore.name}</h2>
          </div>
          <div className="flex gap-1.5 p-1 bg-gray-200/60 rounded-xl max-w-fit">
            <button
              type="button"
              onClick={() => onActiveTabChange("info")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "info"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Info size={14} />
              Thông tin & Địa chỉ
            </button>
            <button
              type="button"
              onClick={() => onActiveTabChange("staff")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "staff"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Users size={14} />
              Nhân viên ({staff.length})
            </button>
          </div>
        </div>
      </div>

      {/* Card Body content */}
      <div className="p-6">
        {/* ── Tab: Info & Address ── */}
        {activeTab === "info" && (
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs text-gray-400 font-medium">Mô tả chi nhánh</h4>
                  <p className="text-sm text-gray-800 mt-1 font-normal leading-relaxed">
                    {selectedStore.description || "Không có mô tả."}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs text-gray-400 font-medium">Giờ mở cửa</h4>
                  <p className="text-sm text-gray-800 font-semibold mt-1">
                    {selectedStore.openingHours || "Chưa cấu hình"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs text-gray-400 font-medium">Hotline liên hệ</h4>
                  <p className="text-sm text-gray-800 font-semibold mt-1">
                    {selectedStore.hotline || "Chưa cấu hình"}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs text-gray-400 font-medium">Địa chỉ hiển thị</h4>
                  <p className="text-sm text-gray-800 mt-1">
                    {selectedStore.address || "Chưa cấu hình"}
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Address entity management details */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3">Thông tin bản đồ & giao nhận</h3>
              {renderStoreAddressDetails(selectedStoreDetails)}
            </div>
          </div>
        )}

        {/* ── Tab: Staff Management ── */}
        {activeTab === "staff" && (
          <div className="space-y-6">
            {/* Add Staff form */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
              <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <UserPlus size={14} className="text-primary" />
                Giao việc cho nhân viên mới
              </h4>
              <form onSubmit={onAddStaff} className="grid gap-4 sm:grid-cols-3 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Mã người dùng (User ID)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập mã GUID của tài khoản nhân viên..."
                    value={staffUserId}
                    onChange={(e) => onStaffUserIdChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Vai trò trong cửa hàng
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={staffRole}
                      onChange={(e) => onStaffRoleChange(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="staff">Nhân viên bán hàng</option>
                      <option value="manager">Trưởng ca/Quản lý</option>
                      <option value="shipper">Người giao hàng</option>
                    </select>
                    <button
                      type="submit"
                      disabled={submittingStaff}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer min-w-fit"
                    >
                      {submittingStaff ? <RefreshCw className="animate-spin" size={16} /> : "Thêm"}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Staff List Table */}
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              {loadingStaff ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                  <span className="text-xs text-gray-400">Đang tải nhân viên...</span>
                </div>
              ) : staff.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm bg-white">
                  Cửa hàng này chưa được phân công nhân viên nào.
                </div>
              ) : (
                <table className="w-full text-left border-collapse bg-white">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-bold uppercase tracking-wider text-gray-500">
                      <th className="px-4 py-3">Nhân viên (User ID)</th>
                      <th className="px-4 py-3">Vai trò</th>
                      <th className="px-4 py-3 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
                    {staff.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                              {member.staffName?.charAt(0) || member.staffId.charAt(0) || "U"}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {member.staffName || "Chưa cập nhật họ tên"}
                              </p>
                              <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                UID: {member.staffId}
                              </p>
                              {member.staffEmail && (
                                <p className="text-xs text-gray-500">{member.staffEmail}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize">
                            <Shield size={10} />
                            Nhân viên
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => onRemoveStaff(member.id)}
                            disabled={deletingStaffId === member.id}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Gỡ nhân viên khỏi chi nhánh"
                          >
                            {deletingStaffId === member.id ? (
                              <RefreshCw className="animate-spin" size={14} />
                            ) : (
                              <UserMinus size={14} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
