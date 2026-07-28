import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import { useAdminUsers } from "@/features/admin/hooks/useAdminUsers";
import AdminFilterBar from "@/features/admin/components/AdminFilterBar";

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState<"name" | "email">("name");
  const [filterRole, setFilterRole] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1); // Reset page on new search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: responseData, isLoading: loading, isError, error } = useAdminUsers({ 
    page, 
    pageSize: 15,
    ...(searchTerm.trim() ? { [searchField]: searchTerm.trim() } : {}),
    ...(filterRole ? { role: filterRole } : {})
  });

  if (isError) {
    toast.error("Lỗi khi tải danh sách người dùng.");
    console.error(error);
  }

  const users = responseData?.isSuccess ? responseData.data.items : [];
  const totalPages = responseData?.isSuccess ? responseData.data.totalPages : 1;
  const totalCount = responseData?.isSuccess ? responseData.data.totalCount : 0;

  // Client-side filtering
  const filteredUsers = users.filter((user) => {
    // Role filter
    if (filterRole && !user.roles.includes(filterRole)) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (searchField === "name") {
        const nameMatch = user.fullName?.toLowerCase().includes(term) || false;
        if (!nameMatch) return false;
      } else if (searchField === "email") {
        const emailMatch = user.email?.toLowerCase().includes(term) || false;
        if (!emailMatch) return false;
      }
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý người dùng</h1>
          <p className="text-sm text-slate-500 mt-1">
            Xem và quản lý tất cả người dùng trong hệ thống (tổng số: {totalCount})
          </p>
        </div>
        <AdminFilterBar
          searchPlaceholder={searchField === "name" ? "Tìm theo tên..." : "Tìm theo email..."}
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          onClearSearch={() => setSearchInput("")}
          searchField={searchField}
          onSearchFieldChange={(field) => {
            setSearchField(field);
            setPage(1);
          }}
          showAdd={false}
          selectedRole={filterRole}
          onRoleChange={(role) => {
            setFilterRole(role);
            setPage(1); // Reset page on filter change
          }}
        />
      </div>

      {/* Table Section */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-700">
              <tr>
                <th className="px-6 py-4">Người dùng</th>
                <th className="px-6 py-4">Liên hệ</th>
                <th className="px-6 py-4">Vai trò</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ngày tạo</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      <p>Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Không tìm thấy người dùng nào phù hợp với bộ lọc trên trang này.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                          {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{user.fullName || "Người dùng ẩn danh"}</div>
                          <div className="text-xs text-slate-500 font-mono">{user.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700">{user.email}</div>
                      {user.phone ? (
                        <div className="text-xs text-slate-500 mt-0.5">{user.phone}</div>
                      ) : (
                        <div className="text-xs text-slate-400 italic mt-0.5">Chưa cập nhật</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((r) => (
                          <span
                            key={r}
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              r === "Admin"
                                ? "bg-red-100 text-red-700"
                                : r === "Manager" || r === "Staff"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          user.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.isActive ? "bg-green-600" : "bg-red-600"
                          }`}
                        />
                        {user.isActive ? "Hoạt động" : "Khóa"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <Link
                        to={`/admin/users/${user.id}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all hover:text-primary group-hover:ring-primary/30"
                      >
                        <Eye size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 bg-slate-50">
            <p className="text-sm text-slate-600">
              Trang <span className="font-medium text-slate-900">{page}</span> /{" "}
              <span className="font-medium text-slate-900">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Tiếp
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
