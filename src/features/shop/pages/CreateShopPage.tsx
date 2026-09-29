import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Store, Phone, Clock, FileText, Loader2, Sparkles, Check } from "lucide-react";
import { createShopRequest, createShopAddressRequest } from "@/features/shop/api/shop.api";
import { createShopSchema, type CreateShopFormValues } from "@/features/shop/schemas/shop-schema";
import { refreshTokenRequest } from "@/features/auth/api/auth.api";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { clearSession, getRefreshToken } from "@/utils";
import { useAppDispatch } from "@/app/store";
import { logout } from "@/features/auth/store/authSlice";
import Modal from "@/components/ui/Modal";
import { joinOpeningHours } from "@/features/shop/utils/opening-hours";
import AddressLocationFields from "@/features/users/components/AddressLocationFields";
import {
  getProvinces,
  getDistrictsByProvinceId,
  getWardsByDistrictId,
} from "@/features/users/api/location.api";
import type { Provinces, District, Ward } from "@/features/users/types/location";
import { geocodeLocation } from "@/features/users/api/geocoding";
import { resolveLocationFromCoordinates } from "@/features/users/utils/location-autofill";

interface CreateShopAddressFormState {
  wardId: string;
  streetAddress: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  label: string;
}

const PERKS = [
  "Tự quản lý cửa hàng, sản phẩm và giá",
  "Nhận và xử lý đơn giao của shop",
  "Khai báo phong thủy để sản phẩm được AI gợi ý",
];

export default function CreateShopPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  // Hiện hộp thoại báo phải đăng nhập lại thay vì để request kế tiếp dính 401 rồi văng ra.
  const [needRelogin, setNeedRelogin] = useState(false);
  const { persistSession } = useAuthSession();
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [addressForm, setAddressForm] = useState<CreateShopAddressFormState>({
    wardId: "",
    streetAddress: "",
    latitude: 0,
    longitude: 0,
    isDefault: true,
    label: "Cửa hàng",
  });
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateShopFormValues>({
    resolver: zodResolver(createShopSchema),
    defaultValues: { name: "", hotline: "", description: "", openingHours: "" },
  });

  useEffect(() => {
    getProvinces()
      .then((data) => setProvinces(data || []))
      .catch((err) => console.error("Error fetching provinces", err));
  }, []);

  // Cascade Tỉnh → Quận → Phường: chỉ xoá lựa chọn cũ khi nó KHÔNG thuộc danh
  // sách mới. Cờ "thay đổi đến từ bản đồ" trước đây phụ thuộc thời điểm effect
  // chạy so với lúc autofill kết thúc nên xoá nhầm kết quả vừa điền.
  useEffect(() => {
    if (selectedProvinceId) {
      getDistrictsByProvinceId(selectedProvinceId)
        .then((data) => {
          const list = data || [];
          setDistricts(list);
          setSelectedDistrictId((prev) => (list.some((d) => d.id === prev) ? prev : ""));
        })
        .catch((err) => console.error("Error fetching districts", err));
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
          const list = data || [];
          setWards(list);
          setSelectedWardId((prev) => (list.some((w) => w.id === prev) ? prev : ""));
        })
        .catch((err) => console.error("Error fetching wards", err));
    } else {
      setWards([]);
      setSelectedWardId("");
    }
  }, [selectedDistrictId]);

  // wardId gửi lên BE luôn bám theo dropdown đang hiển thị — nếu giữ lại phường
  // cũ trong khi khu vực đã đổi thì đơn GHN sẽ về sai quận/phường.
  useEffect(() => {
    setAddressForm((prev) =>
      prev.wardId === selectedWardId ? prev : { ...prev, wardId: selectedWardId },
    );
  }, [selectedWardId]);

  const handleDropdownGeocode = useCallback(
    async (provinceName: string, districtName: string, wardName: string) => {
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
        if (result) {
          setZoomToLocation({ lat: result.lat, lng: result.lng, zoom });
        }
      } catch (error) {
        console.error("Geocoding error:", error);
      }
    },
    [],
  );

  const handleProvinceChange = useCallback(
    (provinceId: string) => {
      setSelectedProvinceId(provinceId);
      const province = provinces.find((p) => p.id === provinceId);
      if (province) {
        handleDropdownGeocode(province.name, "", "");
      }
    },
    [provinces, handleDropdownGeocode],
  );

  const handleDistrictChange = useCallback(
    (districtId: string) => {
      setSelectedDistrictId(districtId);
      const province = provinces.find((p) => p.id === selectedProvinceId);
      const district = districts.find((d) => d.id === districtId);
      if (province && district) {
        handleDropdownGeocode(province.name, district.name, "");
      }
    },
    [provinces, districts, selectedProvinceId, handleDropdownGeocode],
  );

  const handleWardChange = useCallback(
    (wardId: string) => {
      setSelectedWardId(wardId);
      setAddressForm((prev) => ({ ...prev, wardId }));
      const province = provinces.find((p) => p.id === selectedProvinceId);
      const district = districts.find((d) => d.id === selectedDistrictId);
      const ward = wards.find((w) => w.id === wardId);
      if (province && district && ward) {
        handleDropdownGeocode(province.name, district.name, ward.name);
      }
    },
    [provinces, districts, wards, selectedProvinceId, selectedDistrictId, handleDropdownGeocode],
  );

  const handleMapLocationChange = useCallback(
    async (lat: number, lng: number) => {
      setAddressForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
      setIsReverseGeocoding(true);

      try {
        const resolved = await resolveLocationFromCoordinates(lat, lng, provinces);
        if (!resolved) return;

        // Set một lượt: danh mục + lựa chọn cùng nằm trong một batch render nên
        // cascade effect luôn thấy id mới hợp lệ và giữ nguyên, không xoá ngược.
        if (resolved.provinces.length) setProvinces(resolved.provinces);
        setDistricts(resolved.districts);
        setWards(resolved.wards);
        setSelectedProvinceId(resolved.provinceId);
        setSelectedDistrictId(resolved.districtId);
        setSelectedWardId(resolved.wardId);
        setAddressForm((prev) => ({
          ...prev,
          streetAddress: resolved.street || prev.streetAddress,
        }));
      } catch (error) {
        console.error("Reverse geocoding error:", error);
      } finally {
        setIsReverseGeocoding(false);
      }
    },
    [provinces],
  );

  // Sau khi mở shop, BE cấp role GardenOwner: nó tăng TokenVersion và THU HỒI toàn bộ refresh token
  // của user, nên token đang cầm thành vô hiệu. Thử làm mới phiên trước — nếu được thì đi thẳng vào
  // kênh người bán, không được thì phải đăng nhập lại (hỏi ý người dùng, không đá ra giữa chừng).
  const refreshSession = async (): Promise<boolean> => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return false;
      const refreshed = await refreshTokenRequest({ refreshToken });
      if (refreshed.isSuccess && refreshed.data) {
        persistSession(refreshed.data);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Refresh session after shop creation failed", err);
      return false;
    }
  };

  // Người dùng bấm "Đăng nhập lại" ở hộp thoại — dọn phiên rồi đưa về trang chủ để đăng nhập.
  const handleRelogin = () => {
    clearSession();
    dispatch(logout());
    navigate("/", { replace: true });
  };

  const onSubmit = async (values: CreateShopFormValues) => {
    try {
      if (openTime && closeTime && openTime >= closeTime) {
        toast.error("Giờ đóng cửa phải sau giờ mở cửa");
        return;
      }

      const res = await createShopRequest({
        name: values.name,
        hotline: values.hotline,
        description: values.description || "",
        openingHours: joinOpeningHours(openTime, closeTime),
      });

      if (!res.isSuccess || !res.data) {
        toast.error(res.message || "Không thể tạo cửa hàng. Vui lòng thử lại.");
        return;
      }

      if (addressForm.streetAddress.trim() && addressForm.wardId) {
        await createShopAddressRequest(res.data.id, {
          wardId: addressForm.wardId,
          streetAddress: addressForm.streetAddress.trim(),
          latitude: addressForm.latitude || null,
          longitude: addressForm.longitude || null,
        });
      }

      toast.success("Tạo cửa hàng thành công! Bạn đã trở thành người bán.");
      if (await refreshSession()) {
        navigate("/seller");
        return;
      }
      setNeedRelogin(true);
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi hệ thống. Vui lòng thử lại.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_320px]">
        {/* ── Form ───────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Store size={22} />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">Mở cửa hàng</h1>
              <p className="text-sm text-gray-500">
                Tạo gian hàng phong thủy của riêng bạn chỉ trong một bước.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Tên cửa hàng */}
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-gray-700">
                Tên cửa hàng <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                placeholder="VD: Vườn Phong Thủy An Nhiên"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                {...register("name")}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Hotline */}
            <div>
              <label htmlFor="hotline" className="mb-1.5 block text-sm font-semibold text-gray-700">
                Hotline <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="hotline"
                  type="text"
                  placeholder="VD: 1900 1234 hoặc 0901234567"
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  {...register("hotline")}
                />
              </div>
              {errors.hotline && (
                <p className="mt-1 text-xs text-red-500">{errors.hotline.message}</p>
              )}
            </div>

            {/* Giờ mở cửa */}
            <div>
              <label
                htmlFor="openTime"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Giờ mở cửa
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <Clock
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    id="openTime"
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="relative">
                  <Clock
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    id="closeTime"
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-400">Nhập giờ mở và giờ đóng riêng biệt.</p>
            </div>

            {/* Địa chỉ cửa hàng */}
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Địa chỉ cửa hàng</p>
              </div>
              <AddressLocationFields
                streetAddress={addressForm.streetAddress}
                wardId={addressForm.wardId}
                latitude={addressForm.latitude}
                longitude={addressForm.longitude}
                provinces={provinces}
                districts={districts}
                wards={wards}
                selectedProvinceId={selectedProvinceId}
                selectedDistrictId={selectedDistrictId}
                selectedWardId={selectedWardId}
                onProvinceChange={handleProvinceChange}
                onDistrictChange={handleDistrictChange}
                onWardChange={handleWardChange}
                onStreetAddressChange={(value) =>
                  setAddressForm((prev) => ({ ...prev, streetAddress: value }))
                }
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

            {/* Mô tả */}
            <div>
              <label
                htmlFor="description"
                className="mb-1.5 block text-sm font-semibold text-gray-700"
              >
                Mô tả
              </label>
              <div className="relative">
                <FileText size={16} className="absolute left-3.5 top-3 text-gray-400" />
                <textarea
                  id="description"
                  rows={4}
                  placeholder="Giới thiệu ngắn về cửa hàng, sản phẩm chủ lực…"
                  className="w-full resize-none rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  {...register("description")}
                />
              </div>
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang tạo cửa hàng…
                </>
              ) : (
                <>
                  <Store size={16} />
                  Mở cửa hàng
                </>
              )}
            </button>

            <p className="text-xs text-gray-400">
              Bạn có thể cập nhật lại giờ hoạt động sau trong phần quản lý cửa hàng.
            </p>
          </form>
        </div>

        {/* ── Quyền lợi ──────────────────────────────────────────── */}
        <aside className="rounded-2xl border border-primary/15 bg-primary/5 p-6">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <Sparkles size={18} />
            <h2 className="text-sm font-bold">Khi trở thành người bán</h2>
          </div>
          <ul className="space-y-3">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5 text-sm text-gray-600">
                <Check size={16} className="mt-0.5 shrink-0 text-primary" />
                <span>{perk}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-primary/15 pt-4 text-xs text-gray-500">
            Tài khoản của bạn vẫn dùng để mua sắm như bình thường - chỉ được bổ sung thêm kênh người
            bán.
          </p>
        </aside>
      </div>

      {/* Bắt buộc đăng nhập lại: BE thu hồi refresh token khi cấp role GardenOwner. Hỏi rồi mới
          đăng xuất — không đóng được bằng Escape/nền để người dùng không bỏ lỡ thông báo. */}
      <Modal open={needRelogin} title="Cần đăng nhập lại" onClose={() => {}} size="max-w-md">
        <div className="space-y-4 pt-1">
          <p className="text-sm leading-relaxed text-gray-600">
            Cửa hàng của bạn đã được tạo. Tài khoản vừa được cấp thêm quyền <b>người bán</b>, nên bạn
            cần đăng nhập lại để bắt đầu sử dụng kênh người bán.
          </p>
          <button
            type="button"
            onClick={handleRelogin}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark cursor-pointer"
          >
            Đăng nhập lại
          </button>
        </div>
      </Modal>
    </div>
  );
}
