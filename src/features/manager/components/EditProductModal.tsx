import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Info,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { productApi } from "@/features/products/api/product.api";
import { getCategoriesRequest } from "@/features/category/api/category.api";
import { getVibes, getStyles } from "@/features/products/api/taxonomy.api";
import type { ProductDetail } from "@/features/products/types/product";
import type { Category } from "@/features/category/types/category";
import type { LookupItem } from "@/features/products/types/taxonomy";
import { toast } from "sonner";
import {
  ProductBasicForm,
  ProductVariantsSection,
  ProductImagesSection,
  ProductRelationsForm,
  ProductFengShuiForm,
  type FengShuiValues,
} from "@/features/manager/components";
import Modal from "@/components/ui/Modal";

type TabType = "basic" | "variants" | "images" | "categories" | "feng-shui";

const EMPTY_FENG_SHUI: FengShuiValues = {
  primaryElement: "Kim",
  secondaryElements: [],
  sizeClass: "Medium",
  vibes: [],
  styles: [],
};

interface EditProductModalProps {
  productId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditProductModal({
  productId,
  open,
  onClose,
  onSuccess,
}: EditProductModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("basic");
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Global option lists
  const [categories, setCategories] = useState<Category[]>([]);
  const [vibeOptions, setVibeOptions] = useState<LookupItem[]>([]);
  const [styleOptions, setStyleOptions] = useState<LookupItem[]>([]);

  // Tab 1: Basic Info states
  const [basicName, setBasicName] = useState("");
  const [basicDescription, setBasicDescription] = useState("");
  const [basicIsActive, setBasicIsActive] = useState(true);
  const [savingBasic, setSavingBasic] = useState(false);

  // Tab 2: Categories states
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [savingRelations, setSavingRelations] = useState(false);

  // Tab 5: Feng Shui states
  const [fengShui, setFengShui] = useState<FengShuiValues>(EMPTY_FENG_SHUI);
  const [savingFengShui, setSavingFengShui] = useState(false);

  // Fetch product detail
  const fetchProductDetail = useCallback(async () => {
    if (!productId || !open) return;
    setLoading(true);
    try {
      const res = await productApi.getProductById(productId);
      if (res.data.isSuccess && res.data.data) {
        const p = res.data.data;
        setProduct(p);

        // Populate basic info
        setBasicName(p.name);
        setBasicDescription(p.description || "");
        setBasicIsActive(p.isActive);

        // Populate categories
        setSelectedCategoryIds(p.categories?.map((c) => c.id) || []);

        // Populate Feng Shui
        setFengShui({
          primaryElement: p.primaryElement || "Kim",
          secondaryElements: p.secondaryElements || [],
          sizeClass: p.sizeClass || "Medium",
          vibes: p.vibes || [],
          styles: p.styles || [],
        });
      } else {
        toast.error("Không thể tải chi tiết sản phẩm");
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi tải chi tiết sản phẩm");
    } finally {
      setLoading(false);
    }
  }, [productId, open, onClose]);

  // Load product detail and global options
  useEffect(() => {
    if (open) {
      setActiveTab("basic");
      fetchProductDetail();
    } else {
      setProduct(null);
    }

    const fetchOptions = async () => {
      if (!open) return;
      try {
        const [categoriesRes, vibesRes, stylesRes] = await Promise.all([
          getCategoriesRequest(),
          getVibes(),
          getStyles(),
        ]);
        if (categoriesRes.isSuccess && categoriesRes.data) {
          setCategories(categoriesRes.data.filter((c) => c.isActive));
        }
        if (vibesRes.isSuccess && vibesRes.data) setVibeOptions(vibesRes.data);
        if (stylesRes.isSuccess && stylesRes.data) setStyleOptions(stylesRes.data);
      } catch (err) {
        console.error("Failed to load options", err);
      }
    };
    fetchOptions();
  }, [open, fetchProductDetail]);

  // Update Basic Info
  const handleSaveBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !product) return;
    if (!basicName.trim()) {
      toast.error("Tên sản phẩm không được trống");
      return;
    }

    setSavingBasic(true);
    try {
      const res = await productApi.updateProduct(productId, {
        name: basicName.trim(),
        description: basicDescription.trim(),
        isActive: basicIsActive,
      });

      if (res.data.isSuccess) {
        toast.success("Đã cập nhật thông tin cơ bản");
        fetchProductDetail();
        onSuccess(); // Refresh parent list
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

  // Update Categories
  const handleSaveRelations = async () => {
    if (!productId) return;
    setSavingRelations(true);
    try {
      const res = await productApi.updateProductCategories(productId, {
        categoryIds: selectedCategoryIds,
      });
      if (res.data.isSuccess) {
        toast.success("Đã cập nhật danh mục thành công");
        fetchProductDetail();
        onSuccess();
      } else {
        toast.error(res.data.message || "Cập nhật danh mục thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi cập nhật danh mục");
    } finally {
      setSavingRelations(false);
    }
  };

  // Update Feng Shui
  const handleSaveFengShui = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;

    setSavingFengShui(true);
    try {
      const res = await productApi.updateProductFengShui(productId, {
        primaryElement: fengShui.primaryElement,
        secondaryElements: fengShui.secondaryElements,
        sizeClass: fengShui.sizeClass,
        vibes: fengShui.vibes,
        styles: fengShui.styles,
      });

      if (res.data.isSuccess) {
        toast.success("Đã cập nhật thông tin phong thủy");
        fetchProductDetail();
        onSuccess();
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

  const handleRefresh = () => {
    fetchProductDetail();
    onSuccess();
  };

  let content;

  if (loading) {
    content = (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-gray-500">Đang tải thông tin sản phẩm...</p>
      </div>
    );
  } else if (!product) {
    content = (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center px-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-base font-medium text-gray-800">Không tìm thấy sản phẩm</p>
      </div>
    );
  } else {
    content = (
      <div className="space-y-6 max-w-5xl mx-auto pb-6">

        {/* Tabs list */}
        <div className="border-b border-gray-200 bg-white">
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
                { id: "categories", label: "Danh mục", icon: Layers },
                { id: "feng-shui", label: "Phong thủy", icon: Sparkles },
              ] as const
            ).map((t) => {
              const isSelected = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-semibold cursor-pointer transition-all ${isSelected
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
          <ProductBasicForm
            name={basicName}
            setName={setBasicName}
            description={basicDescription}
            setDescription={setBasicDescription}
            isActive={basicIsActive}
            setIsActive={setBasicIsActive}
            storeName={product.storeName}
            onSubmit={handleSaveBasic}
            saving={savingBasic}
          />
        )}

        {/* ── TAB CONTENT: VARIANTS ─────────────────────────────────────────── */}
        {activeTab === "variants" && (
          <ProductVariantsSection
            productId={product.id}
            productName={product.name}
            items={product.items || []}
            onRefreshProduct={handleRefresh}
          />
        )}

        {/* ── TAB CONTENT: IMAGES ───────────────────────────────────────────── */}
        {activeTab === "images" && (
          <ProductImagesSection
            productId={product.id}
            images={product.images || []}
            onRefreshProduct={handleRefresh}
          />
        )}

        {/* ── TAB CONTENT: CATEGORIES ───────────────────────────────────────── */}
        {activeTab === "categories" && (
          <ProductRelationsForm
            categories={categories}
            selectedCategoryIds={selectedCategoryIds}
            setSelectedCategoryIds={setSelectedCategoryIds}
            onSubmit={handleSaveRelations}
            saving={savingRelations}
          />
        )}

        {/* ── TAB CONTENT: FENG SHUI ────────────────────────────────────────── */}
        {activeTab === "feng-shui" && (
          <ProductFengShuiForm
            value={fengShui}
            onChange={setFengShui}
            vibeOptions={vibeOptions}
            styleOptions={styleOptions}
            onSubmit={handleSaveFengShui}
            saving={savingFengShui}
          />
        )}
      </div>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="max-w-5xl"
      title={
        product ? (
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 truncate max-w-[200px] sm:max-w-md lg:max-w-3xl">
              {product.name}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 font-mono font-normal">ID: {product.id}</p>
          </div>
        ) : (
          "Chỉnh sửa sản phẩm"
        )
      }
    >
      {content}
    </Modal>
  );
}
