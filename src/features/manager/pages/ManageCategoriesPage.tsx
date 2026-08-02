import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  FolderTree,
  Loader2,
} from "lucide-react";
import {
  useCategoryList,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/features/category";
import type { Category } from "@/features/category";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";

export default function ManageCategoriesPage() {
  const [search, setSearch] = useState("");

  const { categories, loading } = useCategoryList();

  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  // Modals state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parentId: "",
    isActive: true,
  });

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleResetFilters = () => {
    setSearch("");
  };

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      parentId: "",
      isActive: true,
    });
    setEditModalOpen(true);
  };

  const handleOpenEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      parentId: category.parentId || "",
      isActive: category.isActive,
    });
    setEditModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await deleteCategoryMutation.mutateAsync(deleteId);
      if (res.isSuccess) {
        toast.success(`Đã xóa danh mục ${deleteName}`);
      } else {
        toast.error(res.message || "Đã xảy ra lỗi khi xóa danh mục");
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi khi xóa danh mục");
    } finally {
      setDeleting(false);
      setDeleteId(null);
      setDeleteName("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        const res = await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          data: {
            name: formData.name,
            description: formData.description,
            parentId: formData.parentId || undefined,
            isActive: formData.isActive,
          },
        });
        if (res.isSuccess) {
          toast.success("Đã cập nhật danh mục");
          setEditModalOpen(false);
        } else {
          toast.error(res.message || "Lỗi khi cập nhật danh mục");
        }
      } else {
        const res = await createCategoryMutation.mutateAsync({
          name: formData.name,
          description: formData.description,
          parentId: formData.parentId || undefined,
          isActive: formData.isActive,
        });
        if (res.isSuccess) {
          toast.success("Đã thêm danh mục mới");
          setEditModalOpen(false);
        } else {
          toast.error(res.message || "Lỗi khi thêm danh mục");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Quản lý danh mục</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách danh mục sản phẩm của hệ thống.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-dark active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          Thêm danh mục
        </button>
      </div>

      {/* ── Filters Section ────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm tên danh mục..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div className="relative flex gap-2 sm:col-start-2 lg:col-start-4 justify-end">
            <button
              onClick={handleResetFilters}
              title="Đặt lại tìm kiếm"
              className="flex items-center justify-center p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition-colors"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Categories Table ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white overflow-hidden shadow-sm ring-1 ring-gray-100">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-gray-400 font-medium">Đang tải danh sách danh mục...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400 ring-1 ring-gray-100">
                <FolderTree size={30} strokeWidth={1.5} />
              </div>
              <p className="text-base font-semibold text-gray-900">Không tìm thấy danh mục</p>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                Không có danh mục nào khớp với bộ lọc của bạn hoặc hệ thống chưa có dữ liệu.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Tên danh mục</th>
                  <th className="px-6 py-4">Mô tả</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="max-w-[200px] sm:max-w-md">
                        <p className="font-bold text-gray-900 line-clamp-1">{category.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">
                          {category.id}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate text-gray-500">
                        {category.description || "—"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {category.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                          <CheckCircle size={12} />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                          <XCircle size={12} />
                          Tạm ẩn
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(category)}
                          title="Chỉnh sửa"
                          className="inline-flex items-center justify-center p-2 rounded-lg text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(category.id);
                            setDeleteName(category.name);
                          }}
                          title="Xóa danh mục"
                          className="inline-flex items-center justify-center p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteId !== null} title="Xóa danh mục" onClose={() => setDeleteId(null)}>
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3 text-red-800">
            <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-500" />
            <div>
              <p className="text-sm font-semibold">Cảnh báo: Hành động không thể hoàn tác</p>
              <p className="text-xs text-red-700 mt-0.5">
                Xóa danh mục này có thể ảnh hưởng đến các sản phẩm đang sử dụng nó.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Bạn có chắc chắn muốn xóa danh mục{" "}
            <span className="font-bold text-gray-900">{deleteName}</span> không?
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setDeleteId(null)}
              disabled={deleting}
              className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xác nhận xóa"
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create / Edit Modal */}
      <Modal
        open={editModalOpen}
        title={editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
        onClose={() => !isSubmitting && setEditModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
              placeholder="Nhập tên danh mục..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
              placeholder="Mô tả về danh mục..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Danh mục cha (Tùy chọn)
            </label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30 appearance-none"
            >
              <option value="">-- Không có (Danh mục gốc) --</option>
              {categories
                .filter((c) => c.id !== editingCategory?.id)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Cho phép hoạt động
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu danh mục"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
