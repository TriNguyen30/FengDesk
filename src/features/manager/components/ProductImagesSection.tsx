import React, { useState } from "react";
import { Upload, RefreshCw, Trash2, Image as ImageIcon } from "lucide-react";
import { productApi } from "@/features/products/api/product.api";
import { toast } from "sonner";
import type { ProductDetail } from "@/features/products/types/product";

interface ProductImagesSectionProps {
  productId: string;
  images: ProductDetail["images"];
  onRefreshProduct: () => void;
}

export function ProductImagesSection({
  productId,
  images,
  onRefreshProduct,
}: ProductImagesSectionProps) {
  const [newImageSortOrder, setNewImageSortOrder] = useState(1);
  const [addingImage, setAddingImage] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  // Add Product Image (Direct File Upload)
  const handleAddImageFile = async (file: File) => {
    if (!productId) return;
    setAddingImage(true);
    try {
      const res = await productApi.addProductImage(productId, {
        file,
        sortOrder: Number(newImageSortOrder),
      });

      if (res.data.isSuccess) {
        toast.success(`Đã thêm hình ảnh ${file.name}`);
        setNewImageSortOrder((prev) => prev + 1);
        onRefreshProduct();
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
    if (!productId) return;
    setDeletingImageId(imageId);
    try {
      const res = await productApi.deleteProductImage(productId, imageId);
      if (res.data.isSuccess) {
        toast.success("Đã xóa hình ảnh");
        onRefreshProduct();
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

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Add image form */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 space-y-4 h-fit">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Upload size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-gray-900">Tải lên hình ảnh</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">
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

        {images?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
            <ImageIcon size={32} className="stroke-1 text-gray-300 mb-2" />
            <p className="text-sm">Không có hình ảnh nào cho sản phẩm này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images?.map((img) => (
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
                  <span className="text-xs text-gray-400 font-medium">Thứ tự: {img.sortOrder}</span>
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
  );
}
