import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Save,
  Trash2,
  RefreshCw,
  Image,
  Layers,
  Sparkles,
  Info,
  DollarSign,
  Upload,
} from "lucide-react";
import { productApi } from "@/features/products/api/product.api";
import { getAllShopRequest } from "@/features/shop/api/shop.api";
import { getCategoriesRequest } from "@/features/category/api/category.api";
import { getVibes, getStyles } from "@/features/products/api/taxonomy.api";
import type { Shop } from "@/features/shop/types/shop";
import type { Category } from "@/features/category/types/category";
import type { LookupItem } from "@/features/products/types/taxonomy";
import { ProductFengShuiFields, type FengShuiValues } from "@/features/manager/components";
import { toast } from "sonner";
import { uploadFile } from "@/services/upload.service";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

export default function CreateProductPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // Lists for dropdowns/checkboxes
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vibeOptions, setVibeOptions] = useState<LookupItem[]>([]);
  const [styleOptions, setStyleOptions] = useState<LookupItem[]>([]);

  // Form states
  const [gardenStoreId, setGardenStoreId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Variant/Item
  const [itemName, setItemName] = useState("Tiêu chuẩn");
  const [itemPrice, setItemPrice] = useState<number>(0);
  const [itemStock, setItemStock] = useState<number>(10);
  const [itemSku, setItemSku] = useState("");
  const [itemWeight, setItemWeight] = useState<number>(0);
  const [itemLength, setItemLength] = useState<number>(0);
  const [itemWidth, setItemWidth] = useState<number>(0);
  const [itemHeight, setItemHeight] = useState<number>(0);

  // Categories selection
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Images state
  interface ImageItem {
    id: string;
    url: string;
    sortOrder: number;
    uploading?: boolean;
    error?: boolean;
  }
  const [images, setImages] = useState<ImageItem[]>([]);
  const [manualUrl, setManualUrl] = useState("");
  const [showManualUrlInput, setShowManualUrlInput] = useState(false);

  // Feng Shui state (gửi luôn trong payload tạo sản phẩm)
  const [fengShui, setFengShui] = useState<FengShuiValues>({
    primaryElement: "Kim",
    secondaryElements: [],
    sizeClass: "Medium",
    vibes: [],
    styles: [],
  });

  // Fetch filter options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [shopsRes, categoriesRes, vibesRes, stylesRes] = await Promise.all([
          getAllShopRequest(),
          getCategoriesRequest(),
          getVibes(),
          getStyles(),
        ]);
        if (shopsRes.isSuccess && shopsRes.data) {
          setShops(shopsRes.data);
          if (shopsRes.data.length > 0) {
            setGardenStoreId(shopsRes.data[0].id);
          }
        }
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
  }, []);

  // Set default SKU based on name if empty
  useEffect(() => {
    if (!itemSku && name) {
      const generatedSku =
        name
          .toUpperCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^A-Z0-9]/g, "")
          .slice(0, 8) + "-STD";
      setItemSku(generatedSku);
    }
  }, [name, itemSku]);

  // Image inputs helpers
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    await uploadImages(filesArray);
  };

  const uploadImages = async (files: File[]) => {
    for (const file of files) {
      const tempId = Math.random().toString(36).substring(2, 9);
      setImages((prev) => [
        ...prev,
        {
          id: tempId,
          url: URL.createObjectURL(file),
          sortOrder: prev.length + 1,
          uploading: true,
        },
      ]);

      try {
        const res = await uploadFile(file);
        // Cast res.data as any to retrieve the image URL string
        const uploadedUrl = (res.data as any)?.data || (res.data as any)?.url || res.data;
        if (uploadedUrl && typeof uploadedUrl === "string") {
          setImages((prev) =>
            prev.map((img) =>
              img.id === tempId ? { ...img, url: uploadedUrl, uploading: false } : img,
            ),
          );
        } else {
          throw new Error("Failed to get URL string from upload response");
        }
      } catch (err) {
        console.error(err);
        toast.error(`Lỗi khi tải lên file ${file.name}`);
        setImages((prev) =>
          prev.map((img) => (img.id === tempId ? { ...img, error: true, uploading: false } : img)),
        );
      }
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleAddManualUrl = () => {
    if (!manualUrl.trim()) return;
    setImages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        url: manualUrl.trim(),
        sortOrder: prev.length + 1,
      },
    ]);
    setManualUrl("");
    setShowManualUrlInput(false);
  };

  // Category selection handler
  const handleCategoryToggle = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id],
    );
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gardenStoreId) {
      toast.error("Vui lòng chọn cửa hàng");
      return;
    }
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm");
      return;
    }
    if (itemPrice < 0) {
      toast.error("Giá tiền không hợp lệ");
      return;
    }
    if (itemStock < 0) {
      toast.error("Số lượng kho không hợp lệ");
      return;
    }

    if (images.some((img) => img.uploading)) {
      toast.warning("Vui lòng đợi các hình ảnh tải lên hoàn tất");
      return;
    }

    setSubmitting(true);
    try {
      // Filter empty image URLs
      const validImages = images
        .filter((img) => img.url && !img.error)
        .map((img, idx) => ({ url: img.url, sortOrder: idx + 1 }));

      const payload = {
        gardenStoreId,
        name: name.trim(),
        description: description.trim(),
        items: [
          {
            name: itemName.trim() || "Tiêu chuẩn",
            price: Number(itemPrice),
            stock: Number(itemStock),
            sku: itemSku.trim() || "SKU-DEFAULT",
            weightGram: Number(itemWeight),
            lengthCm: Number(itemLength),
            widthCm: Number(itemWidth),
            heightCm: Number(itemHeight),
          },
        ],
        images: validImages,
        categoryIds: selectedCategoryIds,
        isActive,
        // Phong thủy gửi luôn khi tạo → sản phẩm thành ứng viên gợi ý ngay
        primaryElement: fengShui.primaryElement,
        secondaryElements: fengShui.secondaryElements,
        sizeClass: fengShui.sizeClass,
        vibes: fengShui.vibes,
        styles: fengShui.styles,
      };

      const productRes = await productApi.createProduct(payload);

      if (productRes.data.isSuccess && productRes.data.data) {
        toast.success("Đã tạo sản phẩm mới thành công");
        navigate("/manager/products");
      } else {
        toast.error(productRes.data.message || "Tạo sản phẩm thất bại");
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi khi tạo sản phẩm");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 cursor-pointer transition-colors"
          title="Quay lại"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Thêm sản phẩm mới</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Tạo sản phẩm, liên kết danh mục, hình ảnh và phong thủy.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Left Side (Form inputs) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Basic Info */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Info size={18} className="text-primary" />
              <h2 className="text-base font-bold text-gray-950">Thông tin cơ bản</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên sản phẩm (ví dụ: Cây Trầu Bà Thanh Xuân)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Cửa hàng vườn *</label>
                <select
                  value={gardenStoreId}
                  onChange={(e) => setGardenStoreId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Trạng thái bán</label>
                <div className="flex h-[42px] items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {isActive ? "Đang bán" : "Ngừng bán"}
                    </span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Mô tả sản phẩm</label>
                <div className="rounded-xl overflow-hidden border border-gray-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
                  <ReactQuill
                    theme="snow"
                    value={description}
                    onChange={setDescription}
                    placeholder="Nhập mô tả chi tiết về sản phẩm này..."
                    className="bg-white [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-200 [&_.ql-toolbar]:bg-gray-50 [&_.ql-container]:border-none [&_.ql-container]:text-sm [&_.ql-container]:text-gray-700 [&_.ql-editor]:min-h-[150px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Default Variant */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <DollarSign size={18} className="text-primary" />
              <h2 className="text-base font-bold text-gray-950">Phân loại & Biến thể mặc định</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Tên phân loại *</label>
                <input
                  type="text"
                  required
                  placeholder="ví dụ: Tiêu chuẩn, Chậu đất nung, Chậu sứ..."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Giá bán (VNĐ) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={1000}
                  value={itemPrice}
                  onChange={(e) => setItemPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Số lượng kho *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={itemStock}
                  onChange={(e) => setItemStock(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Mã SKU *</label>
                <input
                  type="text"
                  required
                  placeholder="Mã phân loại sản phẩm"
                  value={itemSku}
                  onChange={(e) => setItemSku(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Trọng lượng (gram) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={itemWeight}
                  onChange={(e) => setItemWeight(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Kích thước (Dài x Rộng x Cao) cm *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="Dài"
                    value={itemLength}
                    onChange={(e) => setItemLength(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 px-2 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="Rộng"
                    value={itemWidth}
                    onChange={(e) => setItemWidth(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 px-2 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="Cao"
                    value={itemHeight}
                    onChange={(e) => setItemHeight(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 px-2 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Images */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Image size={18} className="text-primary" />
                <h2 className="text-base font-bold text-gray-950">Hình ảnh sản phẩm</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowManualUrlInput(!showManualUrlInput)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors cursor-pointer"
              >
                {showManualUrlInput ? "Ẩn nhập URL" : "Nhập URL thủ công"}
              </button>
            </div>

            {/* Manual URL Input (Optional toggle) */}
            {showManualUrlInput && (
              <div className="flex gap-2 bg-gray-50 p-3 rounded-xl ring-1 ring-gray-200 animate-fadeIn">
                <input
                  type="url"
                  placeholder="Nhập URL hình ảnh (ví dụ: https://...)"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddManualUrl}
                  disabled={!manualUrl.trim()}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark cursor-pointer disabled:opacity-50"
                >
                  Thêm
                </button>
              </div>
            )}

            {/* Dropzone File Upload */}
            <div
              onClick={() => document.getElementById("file-upload-input")?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault();
                if (e.dataTransfer.files) {
                  await uploadImages(Array.from(e.dataTransfer.files));
                }
              }}
              className="border-2 border-dashed border-gray-200 hover:border-primary hover:bg-primary/5 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 group"
            >
              <input
                id="file-upload-input"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Upload size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-750">
                  Chọn hoặc kéo thả hình ảnh vào đây
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Hỗ trợ JPG, PNG, WEBP. Chọn được nhiều ảnh cùng lúc.
                </p>
              </div>
            </div>

            {/* Images Grid Preview */}
            {images.length > 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Danh sách hình ảnh ({images.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((img, idx) => (
                    <div
                      key={img.id}
                      className="relative group rounded-xl overflow-hidden bg-gray-50 ring-1 ring-gray-150 flex flex-col items-center p-2"
                    >
                      <div className="aspect-square w-full overflow-hidden flex items-center justify-center rounded-lg bg-white relative">
                        <img
                          src={img.url}
                          alt="product preview"
                          className={`max-h-full max-w-full object-contain transition-all ${
                            img.uploading ? "blur-[2px] opacity-60" : ""
                          }`}
                        />

                        {/* Loading Overlay */}
                        {img.uploading && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 gap-1.5">
                            <RefreshCw size={18} className="animate-spin text-primary" />
                            <span className="text-[10px] font-bold text-primary">
                              Đang tải lên...
                            </span>
                          </div>
                        )}

                        {/* Error Overlay */}
                        {img.error && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/80 gap-1 text-center p-1">
                            <span className="text-[10px] font-bold text-red-650">Lỗi tải lên</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 w-full flex items-center justify-between px-1">
                        <span className="text-[10px] text-gray-400 font-bold">
                          Thứ tự: {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.id)}
                          className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Xóa hình ảnh"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side (Categories/Tags & FengShui) */}
        <div className="space-y-6">
          {/* Card 4: Feng Shui */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Sparkles size={18} className="text-primary" />
              <h2 className="text-base font-bold text-gray-950">Thuộc tính phong thủy</h2>
            </div>
            <ProductFengShuiFields
              value={fengShui}
              onChange={setFengShui}
              vibeOptions={vibeOptions}
              styleOptions={styleOptions}
            />
          </div>

          {/* Card 5: Categories */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Layers size={18} className="text-primary" />
              <h2 className="text-base font-bold text-gray-950">Danh mục sản phẩm</h2>
            </div>

            {categories.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Đang tải danh mục...</p>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(cat.id)}
                      onChange={() => handleCategoryToggle(cat.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Submission Panel */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-primary-dark active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Đang tạo sản phẩm...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Lưu sản phẩm
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
