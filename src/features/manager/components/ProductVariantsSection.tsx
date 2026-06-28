import React, { useState } from "react";
import { Plus, Edit, Trash2, RefreshCw } from "lucide-react";
import { productApi } from "@/features/products/api/product.api";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import type { ProductItem } from "@/features/products/types/product";

interface ProductVariantsSectionProps {
  productId: string;
  productName: string;
  items: ProductItem[];
  onRefreshProduct: () => void;
}

function formatVnd(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

export function ProductVariantsSection({
  productId,
  productName,
  items,
  onRefreshProduct,
}: ProductVariantsSectionProps) {
  // Modal states
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null);
  const [variantName, setVariantName] = useState("");
  const [variantPrice, setVariantPrice] = useState<number>(0);
  const [variantStock, setVariantStock] = useState<number>(0);
  const [variantSku, setVariantSku] = useState("");
  const [variantWeight, setVariantWeight] = useState<number>(0);
  const [variantLength, setVariantLength] = useState<number>(0);
  const [variantWidth, setVariantWidth] = useState<number>(0);
  const [variantHeight, setVariantHeight] = useState<number>(0);
  const [savingVariant, setSavingVariant] = useState(false);

  const [deleteItemOpen, setDeleteItemOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ProductItem | null>(null);
  const [deletingVariant, setDeletingVariant] = useState(false);

  // Variant Modal helpers
  const handleOpenItemModal = (item?: ProductItem) => {
    if (item) {
      setSelectedItem(item);
      setVariantName(item.name);
      setVariantPrice(item.price);
      setVariantStock(item.stock);
      setVariantSku(item.sku);
      setVariantWeight(item.weightGram || 0);
      setVariantLength(item.lengthCm || 0);
      setVariantWidth(item.widthCm || 0);
      setVariantHeight(item.heightCm || 0);
    } else {
      setSelectedItem(null);
      setVariantName("");
      setVariantPrice(0);
      setVariantStock(10);
      setVariantWeight(0);
      setVariantLength(0);
      setVariantWidth(0);
      setVariantHeight(0);
      // Auto generate SKU prefix
      const prefix =
        productName
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
    if (!productId) return;
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
        res = await productApi.updateProductItem(productId, selectedItem.id, {
          name: variantName.trim(),
          price: variantPrice,
          stock: variantStock,
          sku: variantSku.trim(),
          weightGram: variantWeight,
          lengthCm: variantLength,
          widthCm: variantWidth,
          heightCm: variantHeight,
        });
      } else {
        // Create
        res = await productApi.createProductItem(productId, {
          name: variantName.trim(),
          price: variantPrice,
          stock: variantStock,
          sku: variantSku.trim(),
          weightGram: variantWeight,
          lengthCm: variantLength,
          widthCm: variantWidth,
          heightCm: variantHeight,
        });
      }

      if (res.data.isSuccess) {
        toast.success(selectedItem ? "Đã cập nhật biến thể" : "Đã thêm biến thể mới");
        setItemModalOpen(false);
        onRefreshProduct();
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
    if (!productId || !itemToDelete) return;
    if (items.length <= 1) {
      toast.error("Sản phẩm phải có ít nhất một biến thể/phân loại");
      setDeleteItemOpen(false);
      return;
    }

    setDeletingVariant(true);
    try {
      const res = await productApi.deleteProductItem(productId, itemToDelete.id);
      if (res.data.isSuccess) {
        toast.success(`Đã xóa biến thể ${itemToDelete.name}`);
        setDeleteItemOpen(false);
        onRefreshProduct();
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Danh sách phân loại sản phẩm (Biến thể)</h2>
        <button
          type="button"
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
            {items.map((item) => (
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
                      type="button"
                      onClick={() => handleOpenItemModal(item)}
                      className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
                      title="Sửa biến thể"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
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

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Trọng lượng (gram) *</label>
            <input
              type="number"
              required
              min={0}
              value={variantWeight}
              onChange={(e) => setVariantWeight(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none"
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
                value={variantLength}
                onChange={(e) => setVariantLength(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 px-2 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none"
              />
              <input
                type="number"
                required
                min={0}
                placeholder="Rộng"
                value={variantWidth}
                onChange={(e) => setVariantWidth(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 px-2 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none"
              />
              <input
                type="number"
                required
                min={0}
                placeholder="Cao"
                value={variantHeight}
                onChange={(e) => setVariantHeight(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 px-2 py-2.5 text-sm text-gray-700 focus:border-primary focus:outline-none"
              />
            </div>
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
              type="button"
              onClick={() => setDeleteItemOpen(false)}
              disabled={deletingVariant}
              className="flex-1 rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleDeleteItemConfirm}
              disabled={deletingVariant}
              className="flex-1 rounded-xl bg-red-650 py-2.5 text-sm font-semibold text-white hover:bg-red-750 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {deletingVariant && <RefreshCw size={14} className="animate-spin" />}
              Xóa bỏ
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
