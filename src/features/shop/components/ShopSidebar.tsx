import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Clock, Loader2, MapPin, Pencil, Phone, Store, X } from "lucide-react";
import { Shop } from "../types/shop";
import { updateShopRequest } from "../api/shop.api";

interface ShopSidebarProps {
  shop: Shop;
  shopAddressText: string;
  /** Cho phép owner-chính bấm "Sửa hồ sơ" (BE chỉ cho PUT /stores/{id} với owner-chính/admin). */
  canEdit?: boolean;
  /** Gọi lại với shop mới sau khi PUT thành công để parent đồng bộ state. */
  onShopUpdated?: (shop: Shop) => void;
}

export function ShopSidebar({
  shop,
  shopAddressText,
  canEdit = false,
  onShopUpdated,
}: ShopSidebarProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <aside className="lg:col-span-1 space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <Store size={16} className="text-primary" />
            Hồ sơ cửa hàng
          </h3>
          {canEdit && (
            <button
              onClick={() => setIsEditOpen(true)}
              title="Sửa hồ sơ cửa hàng"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition cursor-pointer"
            >
              <Pencil size={12} />
              Sửa
            </button>
          )}
        </div>

        <div className="space-y-4 text-sm text-gray-600">
          {shop.description && (
            <div className="space-y-1">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                Giới thiệu
              </p>
              <p className="text-gray-600 leading-relaxed text-xs whitespace-pre-line">
                {shop.description}
              </p>
            </div>
          )}

          <div className="flex items-start gap-3 pt-2">
            <Phone className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                Hotline liên hệ
              </p>
              <p className="font-semibold text-primary mt-0.5">{shop.hotline || "Chưa cập nhật"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                Giờ hoạt động
              </p>
              <p className="font-medium text-gray-800 mt-0.5">
                {shop.openingHours || "Chưa cập nhật"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                Địa chỉ cửa hàng
              </p>
              <p className="font-medium text-gray-800 mt-0.5 text-xs leading-relaxed">
                {shopAddressText}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isEditOpen && (
        <EditShopProfileModal
          shop={shop}
          onClose={() => setIsEditOpen(false)}
          onSaved={(updated) => {
            onShopUpdated?.(updated);
            setIsEditOpen(false);
          }}
        />
      )}
    </aside>
  );
}

interface EditShopProfileModalProps {
  shop: Shop;
  onClose: () => void;
  onSaved: (shop: Shop) => void;
}

function EditShopProfileModal({ shop, onClose, onSaved }: EditShopProfileModalProps) {
  const [name, setName] = useState(shop.name);
  const [description, setDescription] = useState(shop.description ?? "");
  const [hotline, setHotline] = useState(shop.hotline ?? "");
  const [openingHours, setOpeningHours] = useState(shop.openingHours ?? "");
  const [submitting, setSubmitting] = useState(false);

  // Esc đóng modal — giữ thói quen của các modal khác trong app.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submitting, onClose]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Tên cửa hàng không được để trống");
      return;
    }
    if (!hotline.trim()) {
      toast.error("Hotline không được để trống");
      return;
    }

    setSubmitting(true);
    try {
      const res = await updateShopRequest(shop.id, {
        ownerUserId: shop.ownerUserId,
        name: name.trim(),
        description: description.trim(),
        hotline: hotline.trim(),
        openingHours: openingHours.trim(),
        isActive: shop.isActive,
        // Địa chỉ tách qua /stores/{id}/address — giữ nguyên để PUT này không đụng tới.
        address: typeof shop.address === "string" ? shop.address : "",
      });
      if (res.isSuccess && res.data) {
        toast.success(res.message || "Cập nhật hồ sơ cửa hàng thành công");
        onSaved(res.data);
      } else {
        toast.error(res.message || "Không thể cập nhật hồ sơ cửa hàng");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi cập nhật hồ sơ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 bg-gray-50/50">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wide">
              Hồ sơ cửa hàng
            </span>
            <h3 className="text-base font-bold text-gray-900 mt-0.5">Sửa thông tin</h3>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 text-sm">
          <Field label="Tên cửa hàng" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </Field>

          <Field label="Giới thiệu">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 resize-none"
            />
          </Field>

          <Field label="Hotline" required>
            <input
              type="tel"
              value={hotline}
              onChange={(e) => setHotline(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </Field>

          <Field label="Giờ hoạt động">
            <input
              type="text"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              disabled={submitting}
              placeholder="Ví dụ: 7:00AM - 12:00PM"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </Field>

          <p className="text-xs text-gray-400">
            Địa chỉ cửa hàng cập nhật ở mục riêng — phần này chỉ sửa thông tin liên hệ.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting && <Loader2 size={13} className="animate-spin" />}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-gray-600">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
