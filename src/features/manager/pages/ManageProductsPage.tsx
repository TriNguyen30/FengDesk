import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
} from "lucide-react";
import { useProductList, useDeleteProduct } from "@/features/products";
import { getAllShopRequest } from "@/features/shop/api/shop.api";
import { getCategoriesRequest } from "@/features/category/api/category.api";
import { getTags } from "@/features/products/api/tag.api";
import type { Product } from "@/features/products/types/product";
import type { Shop } from "@/features/shop/types/shop";
import type { Category } from "@/features/category/types/category";
import type { Tag } from "@/features/products/types/tag";
import { generateSlug } from "@/utils/string";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";

function formatVnd(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

export default function ManageProductsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Filter lists
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Selected filters
  const [search, setSearch] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedTagId, setSelectedTagId] = useState("");

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Fetch filter options
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [shopsRes, categoriesRes, tagsRes] = await Promise.all([
          getAllShopRequest(),
          getCategoriesRequest(),
          getTags(),
        ]);
        if (shopsRes.isSuccess && shopsRes.data) {
          setShops(shopsRes.data);
        }
        if (categoriesRes.isSuccess && categoriesRes.data) {
          setCategories(categoriesRes.data);
        }
        if (tagsRes.isSuccess && tagsRes.data) {
          setTags(tagsRes.data);
        }
      } catch (err) {
        console.error("Failed to load filter options", err);
      }
    };
    fetchFilters();
  }, []);

  const { products, loading, totalCount, query } = useProductList({
    page,
    pageSize,
    search: search.trim() || undefined,
    storeId: selectedStoreId || undefined,
    categoryId: selectedCategoryId || undefined,
    tagId: selectedTagId || undefined,
  });

  const totalPages = query.data?.isSuccess && query.data.data ? query.data.data.totalPages : 1;
  const deleteProductMutation = useDeleteProduct();

  // Reset filters
  const handleResetFilters = () => {
    setSearch("");
    setSelectedStoreId("");
    setSelectedCategoryId("");
    setSelectedTagId("");
    setPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await deleteProductMutation.mutateAsync(deleteId);
      if (res.data.isSuccess) {
        toast.success(`Đã xóa sản phẩm ${deleteName}`);
      } else {
        toast.error(res.data.message || "Đã xảy ra lỗi khi xóa sản phẩm");
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi khi xóa sản phẩm");
    } finally {
      setDeleting(false);
      setDeleteId(null);
      setDeleteName("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Quản lý sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách sản phẩm và các tùy chọn quản lý.</p>
        </div>
        <Link
          to="/manager/products/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-dark active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          Thêm sản phẩm
        </Link>
      </div>

      {/* ── Filters Section ────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm tên sản phẩm..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* Store Filter */}
          <div className="relative">
            <select
              value={selectedStoreId}
              onChange={(e) => {
                setSelectedStoreId(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30 appearance-none"
            >
              <option value="">Tất cả cửa hàng</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30 appearance-none"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tag Filter */}
          <div className="relative flex gap-2">
            <select
              value={selectedTagId}
              onChange={(e) => {
                setSelectedTagId(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30 appearance-none"
            >
              <option value="">Tất cả nhãn (Tag)</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleResetFilters}
              title="Đặt lại bộ lọc"
              className="flex items-center justify-center p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition-colors"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Products Table ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white overflow-hidden shadow-sm ring-1 ring-gray-100">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm font-medium text-gray-500">Đang tải danh sách sản phẩm...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400 ring-1 ring-gray-100">
                <Package size={30} strokeWidth={1.5} />
              </div>
              <p className="text-base font-semibold text-gray-900">Không tìm thấy sản phẩm</p>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                Không có sản phẩm nào khớp với bộ lọc của bạn hoặc hệ thống chưa có dữ liệu.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Ảnh</th>
                  <th className="px-6 py-4">Tên sản phẩm</th>
                  <th className="px-6 py-4">Cửa hàng</th>
                  <th className="px-6 py-4">Giá thấp nhất</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
                {products.map((product) => {
                  const shopName =
                    shops.find((s) => s.id === product.gardenStoreId)?.name || "Chưa xác định";
                  return (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="h-12 w-12 overflow-hidden rounded-lg bg-gray-50 ring-1 ring-gray-100 flex items-center justify-center">
                          {product.primaryImageUrl ? (
                            <img
                              src={product.primaryImageUrl}
                              alt={product.name}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <Package size={20} className="text-gray-300" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-[200px] sm:max-w-md">
                          <p className="font-bold text-gray-900 line-clamp-1">{product.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">
                            {product.id}
                          </p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="font-medium text-gray-700">{shopName}</span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-bold text-gray-900">
                        {formatVnd(product.minPrice)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {product.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                            <CheckCircle size={12} />
                            Đang bán
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                            <XCircle size={12} />
                            Ngừng bán
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/product/${generateSlug(product.name)}.${product.id}`}
                            target="_blank"
                            title="Xem chi tiết (cửa hàng)"
                            className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
                          >
                            <Eye size={18} />
                          </Link>
                          <Link
                            to={`/manager/products/${product.id}/edit`}
                            title="Chỉnh sửa sản phẩm"
                            className="inline-flex items-center justify-center p-2 rounded-lg text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => {
                              setDeleteId(product.id);
                              setDeleteName(product.name);
                            }}
                            title="Xóa sản phẩm"
                            className="inline-flex items-center justify-center p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination ─────────────────────────────────────────────────────── */}
        {!loading && products.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-sm">
            <span className="text-gray-500">
              Hiển thị <span className="font-semibold text-gray-900">{products.length}</span> trên{" "}
              <span className="font-semibold text-gray-900">{totalCount}</span> sản phẩm
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronLeft size={14} />
                Trước
              </button>
              <div className="flex items-center px-2">
                <span className="text-xs font-semibold text-gray-700">
                  Trang {page} / {totalPages}
                </span>
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Sau
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteId !== null} title="Xóa sản phẩm" onClose={() => setDeleteId(null)}>
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3 text-red-800">
            <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-500" />
            <div>
              <p className="text-sm font-semibold">Cảnh báo: Hành động không thể hoàn tác</p>
              <p className="text-xs text-red-700 mt-0.5">
                Xóa sản phẩm sẽ đồng thời xóa toàn bộ các biến thể, hình ảnh và dữ liệu phong thủy
                liên quan.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Bạn có chắc chắn muốn xóa sản phẩm{" "}
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
                  <RefreshCw size={14} className="animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xác nhận xóa"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
