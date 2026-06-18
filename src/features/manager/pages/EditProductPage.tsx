import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Save,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  Image as ImageIcon,
  Tag as TagIcon,
  Layers,
  Sparkles,
  Info,
  DollarSign,
  AlertCircle,
  Upload,
} from "lucide-react";
import { productApi } from "@/features/products/api/product.api";
import { getCategoriesRequest } from "@/features/category/api/category.api";
import { getTags } from "@/features/products/api/tag.api";
import type { ProductDetail, ProductItem } from "@/features/products/types/product";
import type { Category } from "@/features/category/types/category";
import type { Tag } from "@/features/products/types/tag";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";

function formatVnd(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

type TabType = "basic" | "variants" | "images" | "categories-tags" | "feng-shui";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>("basic");
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Global option lists
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Tab 1: Basic Info states
  const [basicName, setBasicName] = useState("");
  const [basicDescription, setBasicDescription] = useState("");
  const [basicIsActive, setBasicIsActive] = useState(true);
  const [savingBasic, setSavingBasic] = useState(false);

  // Tab 2: Categories & Tags states
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [savingRelations, setSavingRelations] = useState(false);

  // Tab 3: Variants states & modals
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null);
  const [variantName, setVariantName] = useState("");
  const [variantPrice, setVariantPrice] = useState<number>(0);
  const [variantStock, setVariantStock] = useState<number>(0);
  const [variantSku, setVariantSku] = useState("");
  const [savingVariant, setSavingVariant] = useState(false);

  const [deleteItemOpen, setDeleteItemOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ProductItem | null>(null);
  const [deletingVariant, setDeletingVariant] = useState(false);

  // Tab 4: Images states
  const [newImageSortOrder, setNewImageSortOrder] = useState(1);
  const [addingImage, setAddingImage] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  // Tab 5: Feng Shui states
  const [fsElement, setFsElement] = useState("Kim");
  const [fsCompatibility, setFsCompatibility] = useState("");
  const [fsDescription, setFsDescription] = useState("");
  const [savingFengShui, setSavingFengShui] = useState(false);

  // Fetch product detail
  const fetchProductDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await productApi.getProductById(id);
      if (res.data.isSuccess && res.data.data) {
        const p = res.data.data;
        setProduct(p);

        // Populate basic info
        setBasicName(p.name);
        setBasicDescription(p.description || "");
        setBasicIsActive(p.isActive);

        // Populate categories/tags
        setSelectedCategoryIds(p.categories?.map((c) => c.id) || []);
        setSelectedTagIds(p.tags?.map((t) => t.id) || []);

        // Populate Feng Shui (dynamic keys on product details)
        const rawP = p as any;
        setFsElement(rawP.element || rawP.fengShui?.element || "Kim");
        setFsCompatibility(rawP.compatibility || rawP.fengShui?.compatibility || "");
        setFsDescription(
          rawP.descriptionFengShui || rawP.fengShuiDescription || rawP.fengShui?.description || "",
        );
      } else {
        toast.error("Không thể tải chi tiết sản phẩm");
        navigate("/manager/products");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi tải chi tiết sản phẩm");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // Load product detail and global options
  useEffect(() => {
    fetchProductDetail();

    const fetchOptions = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([getCategoriesRequest(), getTags()]);
        if (categoriesRes.isSuccess && categoriesRes.data) {
          setCategories(categoriesRes.data.filter((c) => c.isActive));
        }
        if (tagsRes.isSuccess && tagsRes.data) {
          setTags(tagsRes.data);
        }
      } catch (err) {
        console.error("Failed to load options", err);
      }
    };
    fetchOptions();
  }, [fetchProductDetail]);

  // Update Basic Info
  const handleSaveBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !product) return;
    if (!basicName.trim()) {
      toast.error("Tên sản phẩm không được trống");
      return;
    }

    setSavingBasic(true);
    try {
      const res = await productApi.updateProduct(id, {
        name: basicName.trim(),
        description: basicDescription.trim(),
        isActive: basicIsActive,
      });

      if (res.data.isSuccess) {
        toast.success("Đã cập nhật thông tin cơ bản");
        fetchProductDetail();
      } else {
        toast.error(res.data.message || "Cập nhật thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi cập nhật sản phẩm");
    } finally {
      setSavingBasic(false);
    }
  };

  // Update Categories & Tags
  const handleSaveRelations = async () => {
    if (!id) return;
    setSavingRelations(true);
    try {
      // Call both APIs concurrently
      const [catRes, tagRes] = await Promise.all([
        productApi.updateProductCategories(id, { categoryIds: selectedCategoryIds }),
        productApi.updateProductTags(id, { tagIds: selectedTagIds }),
      ]);

      if (catRes.data.isSuccess && tagRes.data.isSuccess) {
        toast.success("Đã cập nhật danh mục và nhãn thành công");
        fetchProductDetail();
      } else {
        if (!catRes.data.isSuccess)
          toast.error(catRes.data.message || "Cập nhật danh mục thất bại");
        if (!tagRes.data.isSuccess) toast.error(tagRes.data.message || "Cập nhật nhãn thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi cập nhật danh mục / nhãn");
    } finally {
      setSavingRelations(false);
    }
  };

  // Variant Modal helpers
  const handleOpenItemModal = (item?: ProductItem) => {
    if (item) {
      setSelectedItem(item);
      setVariantName(item.name);
      setVariantPrice(item.price);
      setVariantStock(item.stock);
      setVariantSku(item.sku);
    } else {
      setSelectedItem(null);
      setVariantName("");
      setVariantPrice(0);
      setVariantStock(10);
      // Auto generate SKU prefix
      const prefix =
        product?.name
          .toUpperCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 6) || "SKU";
      setVariantSku(`${prefix}-${Math.floor(1000 + Math.random() * 9000)}`);
    }
    setItemModalOpen(true);
  };

  // Create / Update Variant
  const handleSaveVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !product) return;
    if (!variantName.trim()) {
      toast.error("Tên phân loại không được trống");
      return;
    }
    if (variantPrice < 0 || variantStock < 0) {
      toast.error("Thông số giá hoặc số lượng kho không hợp lệ");
      return;
    }

    setSavingVariant(true);
    try {
      let res;
      if (selectedItem) {
        // Update
        res = await productApi.updateProductItem(id, selectedItem.id, {
          name: variantName.trim(),
          price: variantPrice,
          stock: variantStock,
          sku: variantSku.trim(),
        });
      } else {
        // Create
        res = await productApi.createProductItem(id, {
          name: variantName.trim(),
          price: variantPrice,
          stock: variantStock,
          sku: variantSku.trim(),
        });
      }

      if (res.data.isSuccess) {
        toast.success(selectedItem ? "Đã cập nhật biến thể" : "Đã thêm biến thể mới");
        setItemModalOpen(false);
        fetchProductDetail();
      } else {
        toast.error(res.data.message || "Lưu biến thể thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi lưu biến thể");
    } finally {
      setSavingVariant(false);
    }
  };

  // Delete Variant
  const handleDeleteItemConfirm = async () => {
    if (!id || !itemToDelete) return;
    if (product?.items && product.items.length <= 1) {
      toast.error("Sản phẩm phải có ít nhất một biến thể/phân loại");
      setDeleteItemOpen(false);
      return;
    }

    setDeletingVariant(true);
    try {
      const res = await productApi.deleteProductItem(id, itemToDelete.id);
      if (res.data.isSuccess) {
        toast.success(`Đã xóa biến thể ${itemToDelete.name}`);
        setDeleteItemOpen(false);
        fetchProductDetail();
      } else {
        toast.error(res.data.message || "Xóa biến thể thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi xóa biến thể");
    } finally {
      setDeletingVariant(false);
      setItemToDelete(null);
    }
  };

  // Add Product Image (Direct File Upload)
  const handleAddImageFile = async (file: File) => {
    if (!id) return;
    setAddingImage(true);
    try {
      const res = await productApi.addProductImage(id, {
        file,
        sortOrder: Number(newImageSortOrder),
      });

      if (res.data.isSuccess) {
        toast.success(`Đã thêm hình ảnh ${file.name}`);
        setNewImageSortOrder((prev) => prev + 1);
        fetchProductDetail();
      } else {
        toast.error(res.data.message || "Thêm ảnh thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error(`Lỗi khi thêm hình ảnh: ${file.name}`);
    } finally {
      setAddingImage(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleAddImageFile(e.target.files[0]);
    }
  };

  const handleDropImage = async (files: FileList) => {
    if (files.length > 0) {
      await handleAddImageFile(files[0]);
    }
  };

  // Delete Product Image
  const handleDeleteImage = async (imageId: string) => {
    if (!id) return;
    setDeletingImageId(imageId);
    try {
      const res = await productApi.deleteProductImage(id, imageId);
      if (res.data.isSuccess) {
        toast.success("Đã xóa hình ảnh");
        fetchProductDetail();
      } else {
        toast.error(res.data.message || "Xóa hình ảnh thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi xóa hình ảnh");
    } finally {
      setDeletingImageId(null);
    }
  };

  // Update Feng Shui
  const handleSaveFengShui = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSavingFengShui(true);
    try {
      const res = await productApi.updateProductFengShui(id, {
        element: fsElement,
        compatibility: fsCompatibility.trim(),
        description: fsDescription.trim(),
      });

      if (res.data.isSuccess) {
        toast.success("Đã cập nhật thông tin phong thủy");
        fetchProductDetail();
      } else {
        toast.error(res.data.message || "Cập nhật thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi cập nhật phong thủy");
    } finally {
      setSavingFengShui(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-gray-500">Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center px-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-base font-medium text-gray-800">Không tìm thấy sản phẩm</p>
        <button
          onClick={() => navigate("/manager/products")}
          className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 cursor-pointer"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/manager/products")}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 cursor-pointer transition-colors"
          title="Quay lại danh sách"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 truncate max-w-md md:max-w-xl">
            Chỉnh sửa: {product.name}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">ID: {product.id}</p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="border-b border-gray-200">
        <nav className="flex flex-wrap gap-4 -mb-px">
          {(
            [
              { id: "basic", label: "Thông tin cơ bản", icon: Info },
              {
                id: "variants",
                label: `Biến thể (${product.items?.length || 0})`,
                icon: DollarSign,
              },
              { id: "images", label: `Hình ảnh (${product.images?.length || 0})`, icon: ImageIcon },
              { id: "categories-tags", label: "Danh mục & Nhãn", icon: Layers },
              { id: "feng-shui", label: "Phong thủy", icon: Sparkles },
            ] as const
          ).map((t) => {
            const isSelected = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-semibold cursor-pointer transition-all ${
                  isSelected
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-550 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── TAB CONTENT: BASIC INFO ───────────────────────────────────────── */}
      {activeTab === "basic" && (
        <form
          onSubmit={handleSaveBasic}
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-5"
        >
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Info size={18} className="text-primary" />
            <h2 className="text-base font-bold text-gray-950">Chỉnh sửa thông tin cơ bản</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Tên sản phẩm *</label>
              <input
                type="text"
                required
                value={basicName}
                onChange={(e) => setBasicName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Cửa hàng vườn</label>
              <div className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 font-medium select-none">
                {product.storeName}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Trạng thái bán</label>
              <div className="flex h-[42px] items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={basicIsActive}
                    onChange={(e) => setBasicIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {basicIsActive ? "Đang bán" : "Ngừng bán"}
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Mô tả sản phẩm</label>
              <textarea
                rows={6}
                value={basicDescription}
                onChange={(e) => setBasicDescription(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={savingBasic}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-primary-dark active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {savingBasic ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              Lưu thay đổi
            </button>
          </div>
        </form>
      )}

      {/* ── TAB CONTENT: VARIANTS ─────────────────────────────────────────── */}
      {activeTab === "variants" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Danh sách phân loại sản phẩm (Biến thể)
            </h2>
            <button
              onClick={() => handleOpenItemModal()}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-dark cursor-pointer transition-colors"
            >
              <Plus size={14} /> Thêm biến thể
            </button>
          </div>

          <div className="rounded-2xl bg-white overflow-hidden shadow-sm ring-1 ring-gray-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Tên phân loại</th>
                  <th className="px-6 py-4">Mã SKU</th>
                  <th className="px-6 py-4">Giá bán</th>
                  <th className="px-6 py-4">Số lượng kho</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-600">
                {product.items?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{item.sku}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{formatVnd(item.price)}</td>
                    <td className="px-6 py-4 font-medium">
                      {item.stock === 0 ? (
                        <span className="text-red-500 font-semibold">Hết hàng</span>
                      ) : (
                        <span>{item.stock}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleOpenItemModal(item)}
                          className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                          title="Sửa biến thể"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setItemToDelete(item);
                            setDeleteItemOpen(true);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa biến thể"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Variant Create/Update Modal */}
          <Modal
            open={itemModalOpen}
            title={selectedItem ? "Chỉnh sửa biến thể" : "Thêm biến thể mới"}
            onClose={() => setItemModalOpen(false)}
          >
            <form onSubmit={handleSaveVariant} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Tên phân loại *</label>
                <input
                  type="text"
                  required
                  placeholder="ví dụ: Tiêu chuẩn, Chậu sứ lớn, Chậu đất nung..."
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Giá bán (VNĐ) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={1000}
                  value={variantPrice}
                  onChange={(e) => setVariantPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Số lượng kho *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={variantStock}
                  onChange={(e) => setVariantStock(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Mã SKU *</label>
                <input
                  type="text"
                  required
                  value={variantSku}
                  onChange={(e) => setVariantSku(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none font-mono"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  className="flex-1 rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingVariant}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {savingVariant && <RefreshCw size={14} className="animate-spin" />}
                  Lưu lại
                </button>
              </div>
            </form>
          </Modal>

          {/* Delete Variant Confirmation */}
          <Modal
            open={deleteItemOpen}
            title="Xóa phân loại/biến thể"
            onClose={() => setDeleteItemOpen(false)}
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Bạn có chắc chắn muốn xóa biến thể{" "}
                <span className="font-bold text-gray-900">{itemToDelete?.name}</span> không?
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteItemOpen(false)}
                  disabled={deletingVariant}
                  className="flex-1 rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteItemConfirm}
                  disabled={deletingVariant}
                  className="flex-1 rounded-xl bg-red-650 py-2.5 text-sm font-semibold text-white hover:bg-red-700 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {deletingVariant && <RefreshCw size={14} className="animate-spin" />}
                  Xóa bỏ
                </button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* ── TAB CONTENT: IMAGES ───────────────────────────────────────────── */}
      {activeTab === "images" && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Add image form */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4 h-fit">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Upload size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-gray-900">Tải lên hình ảnh</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 font-medium">
                  Thứ tự sắp xếp trước khi tải ảnh
                </label>
                <input
                  type="number"
                  min={1}
                  value={newImageSortOrder}
                  onChange={(e) => setNewImageSortOrder(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                />
              </div>

              {/* Direct Drag & Drop Zone */}
              <div
                onClick={() =>
                  !addingImage && document.getElementById("edit-file-upload-input")?.click()
                }
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  if (!addingImage && e.dataTransfer.files) {
                    await handleDropImage(e.dataTransfer.files);
                  }
                }}
                className={`border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 group ${
                  addingImage
                    ? "opacity-60 cursor-not-allowed bg-gray-50"
                    : "hover:border-primary hover:bg-primary/5"
                }`}
              >
                <input
                  id="edit-file-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={addingImage}
                  className="hidden"
                />
                <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  {addingImage ? (
                    <RefreshCw size={20} className="animate-spin text-primary" />
                  ) : (
                    <Upload size={20} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-750">
                    {addingImage ? "Đang tải ảnh lên..." : "Kéo thả hoặc click chọn ảnh"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Hỗ trợ JPG, PNG, WEBP. Ảnh tải trực tiếp vào sản phẩm.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Images Gallery */}
          <div className="md:col-span-2 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <ImageIcon size={18} className="text-primary" />
              <h2 className="text-base font-bold text-gray-950">Thư viện ảnh sản phẩm</h2>
            </div>

            {product.images?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                <ImageIcon size={32} className="stroke-1 text-gray-300 mb-2" />
                <p className="text-sm">Không có hình ảnh nào cho sản phẩm này.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {product.images?.map((img) => (
                  <div
                    key={img.id}
                    className="relative group rounded-xl overflow-hidden bg-gray-50 ring-1 ring-gray-100 flex flex-col items-center justify-center p-2"
                  >
                    <div className="aspect-square w-full overflow-hidden flex items-center justify-center rounded-lg">
                      <img
                        src={img.url}
                        alt="product"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="mt-2 w-full flex items-center justify-between px-1">
                      <span className="text-xs text-gray-400 font-medium">
                        Thứ tự: {img.sortOrder}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id)}
                        disabled={deletingImageId === img.id}
                        className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-55"
                        title="Xóa ảnh"
                      >
                        {deletingImageId === img.id ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: CATEGORIES & TAGS ────────────────────────────────── */}
      {activeTab === "categories-tags" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Categories */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Layers size={18} className="text-primary" />
                <h3 className="text-base font-bold text-gray-950">Danh mục sản phẩm</h3>
              </div>

              {categories.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Đang tải danh mục...</p>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {categories.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(cat.id)}
                        onChange={() => {
                          setSelectedCategoryIds((prev) =>
                            prev.includes(cat.id)
                              ? prev.filter((id) => id !== cat.id)
                              : [...prev, cat.id],
                          );
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                      {cat.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <TagIcon size={18} className="text-primary" />
                <h3 className="text-base font-bold text-gray-950">Nhãn sản phẩm (Tag)</h3>
              </div>

              {tags.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Đang tải nhãn...</p>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {tags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTagIds.includes(tag.id)}
                        onChange={() => {
                          setSelectedTagIds((prev) =>
                            prev.includes(tag.id)
                              ? prev.filter((id) => id !== tag.id)
                              : [...prev, tag.id],
                          );
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                      {tag.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <button
              onClick={handleSaveRelations}
              disabled={savingRelations}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary-dark active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {savingRelations ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Lưu danh mục & nhãn
            </button>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: FENG SHUI ────────────────────────────────────────── */}
      {activeTab === "feng-shui" && (
        <form
          onSubmit={handleSaveFengShui}
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-5"
        >
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Sparkles size={18} className="text-primary" />
            <h2 className="text-base font-bold text-gray-950">Thuộc tính ngũ hành phong thủy</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5 max-w-sm">
              <label className="text-sm font-semibold text-gray-700">
                Mệnh / Hành phong thủy *
              </label>
              <select
                value={fsElement}
                onChange={(e) => setFsElement(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none"
              >
                <option value="Kim">Kim (Kim loại)</option>
                <option value="Mộc">Mộc (Cây cối)</option>
                <option value="Thủy">Thủy (Nước)</option>
                <option value="Hỏa">Hỏa (Lửa)</option>
                <option value="Thổ">Thổ (Đất)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Khả năng tương thích</label>
              <textarea
                rows={3}
                placeholder="Ví dụ: Tương sinh với mệnh Thủy, tương khắc mệnh Hỏa..."
                value={fsCompatibility}
                onChange={(e) => setFsCompatibility(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Mô tả phong thủy</label>
              <textarea
                rows={4}
                placeholder="Ý nghĩa phong thủy, hướng tốt nhất đặt cây..."
                value={fsDescription}
                onChange={(e) => setFsDescription(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={savingFengShui}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary-dark active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {savingFengShui ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Lưu phong thủy
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
