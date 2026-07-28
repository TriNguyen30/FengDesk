import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronLeft, UserX, ShieldAlert, KeyRound, Check } from "lucide-react";
import {
  useAdminUser,
  useAdminUserAuditLogs,
  useUpdateAdminUserStatus,
  useUpdateAdminUserRoles,
  useRevokeAdminUserSessions
} from "@/features/admin/hooks/useAdminUsers";
import Modal from "@/components/ui/Modal";

const AVAILABLE_ROLES = ["Customer", "Manager", "Staff", "Admin", "GardenOwner", "GardenStaff"];

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: userResponse, isLoading: loading, isError: userError } = useAdminUser(id);
  const { data: logsResponse, isLoading: loadingLogs } = useAdminUserAuditLogs(id);

  const updateStatus = useUpdateAdminUserStatus();
  const updateRoles = useUpdateAdminUserRoles();
  const revokeSessions = useRevokeAdminUserSessions();

  const user = userResponse?.isSuccess ? userResponse.data : null;
  const auditLogs = logsResponse?.isSuccess ? logsResponse.data.items : [];

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Reason modal state
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [reasonType, setReasonType] = useState<'status' | 'roles' | null>(null);
  const [reasonText, setReasonText] = useState("");

  // Sync state when data is loaded
  useEffect(() => {
    if (user) {
      setSelectedRoles(user.roles || []);
      setIsActive(user.isActive);
    }
  }, [user]);

  if (userError) {
    toast.error("Không thể tải thông tin người dùng.");
    navigate("/admin/users");
  }

  const promptForReason = (type: 'status' | 'roles') => {
    setReasonType(type);
    setReasonText("");
    setReasonModalOpen(true);
  };

  const handleSubmitReason = () => {
    if (!reasonText.trim()) {
      toast.error("Vui lòng nhập lý do.");
      return;
    }
    if (!id || !reasonType) return;

    if (reasonType === 'roles') {
      updateRoles.mutate(
        { id, payload: { roles: selectedRoles, reason: reasonText.trim() } },
        {
          onSuccess: (res) => {
            if (res.data.isSuccess) {
              toast.success("Cập nhật vai trò thành công.");
              setReasonModalOpen(false);
            } else {
              toast.error(res.data.message || "Lỗi khi cập nhật vai trò.");
            }
          },
          onError: () => toast.error("Lỗi khi cập nhật vai trò."),
        }
      );
    } else if (reasonType === 'status') {
      const newStatus = !isActive;
      updateStatus.mutate(
        { id, payload: { isActive: newStatus, reason: reasonText.trim() } },
        {
          onSuccess: (res) => {
            if (res.data.isSuccess) {
              toast.success(`Đã ${newStatus ? 'mở khóa' : 'khóa'} tài khoản thành công.`);
              setIsActive(newStatus);
              setReasonModalOpen(false);
            } else {
              toast.error(res.data.message || "Lỗi khi cập nhật trạng thái.");
            }
          },
          onError: () => toast.error("Lỗi khi cập nhật trạng thái."),
        }
      );
    }
  };

  const handleUpdateRoles = () => {
    if (!id) return;
    promptForReason('roles');
  };

  const handleToggleStatus = () => {
    if (!id) return;
    promptForReason('status');
  };

  const handleRevokeSessions = () => {
    if (!id) return;
    if (!window.confirm("Bạn có chắc chắn muốn buộc người dùng này đăng xuất khỏi tất cả các thiết bị?")) return;

    revokeSessions.mutate(id, {
      onSuccess: (res) => {
        if (res.data.isSuccess) {
          toast.success("Đã thu hồi tất cả phiên đăng nhập thành công.");
        } else {
          toast.error(res.data.message || "Lỗi khi thu hồi phiên đăng nhập.");
        }
      },
      onError: () => toast.error("Lỗi khi thu hồi phiên đăng nhập."),
    });
  };

  if (loading || !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/users"
          className="flex h-9 w-9 items-center justify-center rounded-4xl hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition-colors"
          title="Quay lại"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Chi tiết người dùng</h1>
          <p className="text-sm text-slate-500 mt-1">ID: {user.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Col: Info & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Thông tin cơ bản</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="block text-slate-500 mb-1">Họ và tên</span>
                <span className="font-medium text-slate-900">{user.fullName}</span>
              </div>
              <div>
                <span className="block text-slate-500 mb-1">Email</span>
                <span className="font-medium text-slate-900">{user.email}</span>
              </div>
              <div>
                <span className="block text-slate-500 mb-1">Số điện thoại</span>
                <span className="font-medium text-slate-900">{user.phone || "Không có"}</span>
              </div>
              <div>
                <span className="block text-slate-500 mb-1">Ngày tham gia</span>
                <span className="font-medium text-slate-900">
                  {new Date(user.createdAt).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50/50 p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-base font-semibold text-red-700 mb-4">
              <ShieldAlert size={18} />
              Vùng nguy hiểm
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-700 mb-2 font-medium">Trạng thái tài khoản</p>
                <button
                  onClick={handleToggleStatus}
                  disabled={updateStatus.isPending}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors cursor-pointer ${isActive
                    ? "border-red-200 bg-white text-red-600 hover:bg-red-50"
                    : "border-green-200 bg-white text-green-600 hover:bg-green-50"
                    }`}
                >
                  {updateStatus.isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : isActive ? (
                    <UserX size={16} />
                  ) : (
                    <Check size={16} />
                  )}
                  {isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                </button>
              </div>

              <div className="pt-4 border-t border-red-200/50">
                <p className="text-sm text-slate-700 mb-2 font-medium">Quản lý phiên đăng nhập</p>
                <p className="text-xs text-slate-500 mb-3">
                  Force logout người dùng khỏi tất cả các thiết bị. Họ sẽ phải đăng nhập lại.
                </p>
                <button
                  onClick={handleRevokeSessions}
                  disabled={revokeSessions.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 cursor-pointer"
                >
                  {revokeSessions.isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <KeyRound size={16} />
                  )}
                  Thu hồi phiên đăng nhập
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Roles & Audit Logs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Vai trò hệ thống</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-5">
              {AVAILABLE_ROLES.map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    checked={selectedRoles.includes(role)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRoles((prev) => [...prev, role]);
                      } else {
                        setSelectedRoles((prev) => prev.filter((r) => r !== role));
                      }
                    }}
                  />
                  <span className="text-sm font-medium text-slate-700">{role}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleUpdateRoles}
                disabled={updateRoles.isPending || JSON.stringify([...selectedRoles].sort()) === JSON.stringify([...(user.roles || [])].sort())}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {updateRoles.isPending && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                Lưu thay đổi vai trò
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">Lịch sử hoạt động (Audit Logs)</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-700 sticky top-0">
                  <tr>
                    <th className="px-5 py-3">Hành động</th>
                    <th className="px-5 py-3">Chi tiết</th>
                    <th className="px-5 py-3">IP Address</th>
                    <th className="px-5 py-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loadingLogs ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                        Đang tải lịch sử...
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                        Không có lịch sử hoạt động nào.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-900">
                          {log.action}
                        </td>
                        <td className="px-5 py-3 text-slate-500 max-w-xs truncate" title={log.details}>
                          {log.details}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          {log.ipAddress || "N/A"}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("vi-VN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={reasonModalOpen}
        onClose={() => !updateRoles.isPending && !updateStatus.isPending && setReasonModalOpen(false)}
        title={reasonType === 'roles' ? "Cập nhật vai trò" : isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Vui lòng nhập lý do thực hiện hành động này. Lý do sẽ được lưu vào lịch sử hoạt động để tiện theo dõi sau này.
          </p>
          <textarea
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder="Nhập lý do chi tiết..."
            className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[100px] resize-y"
            autoFocus
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setReasonModalOpen(false)}
              disabled={updateRoles.isPending || updateStatus.isPending}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmitReason}
              disabled={updateRoles.isPending || updateStatus.isPending || !reasonText.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {(updateRoles.isPending || updateStatus.isPending) && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              Xác nhận
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
