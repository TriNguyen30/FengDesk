import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { Clock, Loader2, MapPin, Pencil, Phone, Power, Store, X } from "lucide-react";
import { Shop } from "../types/shop";
import { updateShopRequest } from "../api/shop.api";
import { joinOpeningHours, normalizeOpeningHours, splitOpeningHours } from "../utils/opening-hours";
import AddressLocationFields from "@/features/users/components/AddressLocationFields";
import {
  getProvinces,
  getDistrictsByProvinceId,
  getWardsByDistrictId,
} from "@/features/users/api/location.api";
import { geocodeLocation, reverseGeocode, findBestMatch } from "@/features/users/api/geocoding";
import type { Provinces, District, Ward } from "@/features/users/types/location";

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
  const initialHours = splitOpeningHours(shop.openingHours);
  const [openTime, setOpenTime] = useState(initialHours.open);
  const [closeTime, setCloseTime] = useState(initialHours.close);
  const [streetAddress, setStreetAddress] = useState("");
  const [provinces, setProvinces] = useState<Provinces[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedWardId, setSelectedWardId] = useState("");
  const [zoomToLocation, setZoomToLocation] = useState<{
    lat: number;
    lng: number;
    zoom: number;
  } | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isActive, setIsActive] = useState(shop.isActive);
  const [submitting, setSubmitting] = useState(false);
  const isMapTriggeredRef = useRef(false);

  useEffect(() => {
    setStreetAddress(typeof shop.address === "string" ? shop.address : "");
  }, [shop.address]);

  useEffect(() => {
    getProvinces()
      .then((data) => setProvinces(data || []))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (selectedProvinceId) {
      getDistrictsByProvinceId(selectedProvinceId)
        .then((data) => {
          setDistricts(data || []);
          if (!isMapTriggeredRef.current) {
            setSelectedDistrictId("");
            setWards([]);
            setSelectedWardId("");
          }
        })
        .catch((err) => console.error(err));
    } else {
      setDistricts([]);
      setWards([]);
      setSelectedDistrictId("");
      setSelectedWardId("");
    }
  }, [selectedProvinceId]);

  useEffect(() => {
    if (selectedDistrictId) {
      getWardsByDistrictId(selectedDistrictId)
        .then((data) => {
          setWards(data || []);
          if (!isMapTriggeredRef.current) {
            setSelectedWardId("");
          }
        })
        .catch((err) => console.error(err));
    } else {
      setWards([]);
      setSelectedWardId("");
    }
  }, [selectedDistrictId]);

  const handleDropdownGeocode = useCallback(
    async (provinceName: string, districtName: string, wardName: string) => {
      if (isMapTriggeredRef.current) return;
      let query = "";
      let zoom = 11;
      if (wardName) {
        query = `${wardName}, ${districtName}, ${provinceName}, Việt Nam`;
        zoom = 15;
      } else if (districtName) {
        query = `${districtName}, ${provinceName}, Việt Nam`;
        zoom = 13;
      } else if (provinceName) {
        query = `${provinceName}, Việt Nam`;
        zoom = 11;
      }
      if (!query) return;
      try {
        const result = await geocodeLocation(query);
        if (result) setZoomToLocation({ lat: result.lat, lng: result.lng, zoom });
      } catch (err) {
        console.error(err);
      }
    },
    [],
  );

  const handleProvinceChange = useCallback(
    (provinceId: string) => {
      isMapTriggeredRef.current = false;
      setSelectedProvinceId(provinceId);
      const province = provinces.find((p) => p.id === provinceId);
      if (province) handleDropdownGeocode(province.name, "", "");
    },
    [provinces, handleDropdownGeocode],
  );

  const handleDistrictChange = useCallback(
    (districtId: string) => {
      isMapTriggeredRef.current = false;
      setSelectedDistrictId(districtId);
      const province = provinces.find((p) => p.id === selectedProvinceId);
      const district = districts.find((d) => d.id === districtId);
      if (province && district) handleDropdownGeocode(province.name, district.name, "");
    },
    [provinces, districts, selectedProvinceId, handleDropdownGeocode],
  );

  const handleWardChange = useCallback(
    (wardId: string) => {
      isMapTriggeredRef.current = false;
      setSelectedWardId(wardId);
      const province = provinces.find((p) => p.id === selectedProvinceId);
      const district = districts.find((d) => d.id === selectedDistrictId);
      const ward = wards.find((w) => w.id === wardId);
      if (province && district && ward)
        handleDropdownGeocode(province.name, district.name, ward.name);
    },
    [provinces, districts, wards, selectedProvinceId, selectedDistrictId, handleDropdownGeocode],
  );

  const handleMapLocationChange = useCallback(
    async (lat: number, lng: number) => {
      setIsReverseGeocoding(true);
      isMapTriggeredRef.current = true;
      try {
        const result = await reverseGeocode(lat, lng);
        if (!result) return;
        let currentProvinces = provinces;
        if (currentProvinces.length === 0) {
          currentProvinces = await getProvinces();
          setProvinces(currentProvinces || []);
        }
        const matchedProvinceId = findBestMatch(currentProvinces, result.province);
        if (matchedProvinceId) {
          setSelectedProvinceId(matchedProvinceId);
          const districtData = await getDistrictsByProvinceId(matchedProvinceId);
          setDistricts(districtData || []);
          const matchedDistrictId = findBestMatch(districtData || [], result.district);
          if (matchedDistrictId) {
            setSelectedDistrictId(matchedDistrictId);
            const wardData = await getWardsByDistrictId(matchedDistrictId);
            setWards(wardData || []);
            const matchedWardId = findBestMatch(wardData || [], result.ward);
            if (matchedWardId) setSelectedWardId(matchedWardId);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        isMapTriggeredRef.current = false;
        setIsReverseGeocoding(false);
      }
    },
    [provinces],
  );

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
    if (openTime && closeTime && openTime >= closeTime) {
      toast.error("Giờ đóng cửa phải sau giờ mở cửa");
      return;
    }

    setSubmitting(true);
    try {
      const normalizedOpeningHours = normalizeOpeningHours(joinOpeningHours(openTime, closeTime));
      const computedAddress = [
        streetAddress.trim(),
        wards.find((w) => w.id === selectedWardId)?.name,
        districts.find((d) => d.id === selectedDistrictId)?.name,
        provinces.find((p) => p.id === selectedProvinceId)?.name,
      ]
        .filter(Boolean)
        .join(", ");
      const res = await updateShopRequest(shop.id, {
        ownerUserId: shop.ownerUserId,
        name: name.trim(),
        description: description.trim(),
        hotline: hotline.trim(),
        openingHours: normalizedOpeningHours,
        isActive,
        address: computedAddress || (typeof shop.address === "string" ? shop.address : ""),
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[92dvh] sm:max-h-[90dvh]">
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

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm overscroll-contain">
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

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Giờ mở cửa">
              <input
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </Field>
            <Field label="Giờ đóng cửa">
              <input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </Field>
          </div>
          <p className="text-[11px] text-gray-400">
            Dùng bộ chọn giờ để nhập thời gian mở và đóng cửa, hệ thống sẽ lưu thành một chuỗi giờ
            hoạt động.
          </p>

          <div className="space-y-3 rounded-lg bg-gray-50 p-3 border border-gray-200">
            <div>
              <p className="text-sm font-semibold text-gray-900">Địa chỉ cửa hàng</p>
              <p className="text-xs text-gray-500">
                Chọn khu vực hoặc chạm lên bản đồ để cập nhật địa chỉ hiển thị.
              </p>
            </div>
            <AddressLocationFields
              streetAddress={streetAddress}
              wardId={selectedWardId}
              latitude={0}
              longitude={0}
              provinces={provinces}
              districts={districts}
              wards={wards}
              selectedProvinceId={selectedProvinceId}
              selectedDistrictId={selectedDistrictId}
              selectedWardId={selectedWardId}
              onProvinceChange={handleProvinceChange}
              onDistrictChange={handleDistrictChange}
              onWardChange={handleWardChange}
              onStreetAddressChange={setStreetAddress}
              zoomToLocation={zoomToLocation}
              onMapLocationChange={handleMapLocationChange}
              isReverseGeocoding={isReverseGeocoding}
              areaTitle="Khu vực"
              streetLabel="Địa chỉ cụ thể"
              streetPlaceholder="Số nhà, tên đường..."
              mapLabel="Vị trí trên bản đồ"
              mapNote="Chạm vào bản đồ để chọn vị trí chính xác của cửa hàng."
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Power size={16} className={isActive ? "text-emerald-600" : "text-gray-400"} />
              <div>
                <p className="text-xs font-semibold text-gray-700">Trạng thái cửa hàng</p>
                <p className="text-[11px] text-gray-500">
                  {isActive
                    ? "Đang hoạt động — khách thấy được."
                    : "Tạm ngừng — ẩn khỏi danh sách."}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive((v) => !v)}
              disabled={submitting}
              className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                isActive ? "bg-primary" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  isActive ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <p className="text-xs text-gray-400">
            Màn này cập nhật thông tin liên hệ, giờ hoạt động và trạng thái của cửa hàng.
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
