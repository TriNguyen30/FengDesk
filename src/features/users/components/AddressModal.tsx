import { useState, useEffect, useCallback } from "react";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CreateAddressDto, UpdateAddressDto, Address } from "../types/address";
import { createAddress, updateAddress, setDefaultAddress } from "../api/address.api";
import { getProvinces, getDistrictsByProvinceId, getWardsByDistrictId } from "../api/location.api";
import { Provinces, District, Ward } from "../types/location";
import { toast } from "sonner";
import AddressLocationFields from "./AddressLocationFields";
import { geocodeLocation } from "../api/geocoding";
import { resolveLocationFromCoordinates, loadSelectionForWard } from "../utils/location-autofill";

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  address?: Address | null; // If passed, it's edit mode
}

export default function AddressModal({ isOpen, onClose, onSuccess, address }: AddressModalProps) {
  const [formData, setFormData] = useState({
    recipientName: "",
    recipientPhone: "",
    streetAddress: "",
    wardId: "",
    label: "Nhà riêng",
    isDefault: false,
    latitude: 0,
    longitude: 0,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Location states
  const [provinces, setProvinces] = useState<Provinces[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  const [selectedWardId, setSelectedWardId] = useState<string>("");

  // Bidirectional sync states
  const [zoomToLocation, setZoomToLocation] = useState<{
    lat: number;
    lng: number;
    zoom: number;
  } | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isLoadingRegion, setIsLoadingRegion] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProvinces();
    }
  }, [isOpen]);

  const fetchProvinces = async () => {
    try {
      const data = await getProvinces();
      setProvinces(data || []);
    } catch (error) {
      console.error("Error fetching provinces", error);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    if (!address) {
      // Reset form on new add
      setFormData({
        recipientName: "",
        recipientPhone: "",
        streetAddress: "",
        wardId: "",
        label: "Nhà riêng",
        isDefault: false,
        latitude: 0,
        longitude: 0,
      });
      setSelectedProvinceId("");
      setSelectedDistrictId("");
      setSelectedWardId("");
      return;
    }

    setFormData({
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      streetAddress: address.streetAddress,
      wardId: address.wardId || "",
      label: address.label || "Nhà riêng",
      isDefault: address.isDefault,
      latitude: address.latitude || 0,
      longitude: address.longitude || 0,
    });

    // Bản ghi chỉ lưu wardId → tra ngược để 3 dropdown hiện đúng khu vực cũ.
    // Bỏ qua nếu modal đã đóng/đổi bản ghi trước khi request về.
    let stale = false;
    setSelectedProvinceId("");
    setSelectedDistrictId("");
    setSelectedWardId("");
    setIsLoadingRegion(true);
    loadSelectionForWard(address.wardId || "").then((selection) => {
      if (stale) return;
      setIsLoadingRegion(false);
      if (!selection) return;
      setProvinces(selection.provinces);
      setDistricts(selection.districts);
      setWards(selection.wards);
      setSelectedProvinceId(selection.provinceId);
      setSelectedDistrictId(selection.districtId);
      setSelectedWardId(selection.wardId);
    });
    return () => {
      stale = true;
    };
  }, [address, isOpen]);

  // Cascade Tỉnh → Quận: chỉ xoá lựa chọn cũ khi nó KHÔNG thuộc danh sách mới.
  // Không dùng cờ "thay đổi này đến từ bản đồ" nữa — cờ đó phụ thuộc thời điểm
  // effect chạy so với lúc autofill kết thúc, nên lúc được lúc không.
  useEffect(() => {
    if (selectedProvinceId) {
      getDistrictsByProvinceId(selectedProvinceId).then((data) => {
        const list = data || [];
        setDistricts(list);
        setSelectedDistrictId((prev) => (list.some((d) => d.id === prev) ? prev : ""));
      });
    } else {
      setDistricts([]);
      setWards([]);
      setSelectedDistrictId("");
      setSelectedWardId("");
    }
  }, [selectedProvinceId]);

  useEffect(() => {
    if (selectedDistrictId) {
      getWardsByDistrictId(selectedDistrictId).then((data) => {
        const list = data || [];
        setWards(list);
        setSelectedWardId((prev) => (list.some((w) => w.id === prev) ? prev : ""));
      });
    } else {
      setWards([]);
      setSelectedWardId("");
    }
  }, [selectedDistrictId]);


  // ── Dropdown → Map: geocode selected location and zoom map ────────────
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

  // Trigger geocode when province changes (user-driven only)
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

  // Trigger geocode when district changes (user-driven only)
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

  // Trigger geocode when ward changes (user-driven only)
  const handleWardChange = useCallback(
    (wardId: string) => {
      setSelectedWardId(wardId);
      const province = provinces.find((p) => p.id === selectedProvinceId);
      const district = districts.find((d) => d.id === selectedDistrictId);
      const ward = wards.find((w) => w.id === wardId);
      if (province && district && ward) {
        handleDropdownGeocode(province.name, district.name, ward.name);
      }
    },
    [provinces, districts, wards, selectedProvinceId, selectedDistrictId, handleDropdownGeocode],
  );

  // ── Map → Dropdown: reverse geocode and auto-fill dropdowns ───────────
  const handleMapLocationChange = useCallback(
    async (lat: number, lng: number) => {
      setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
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
        setFormData((prev) => ({
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

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2,
      },
    },
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedWardId) {
      toast.error("Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã");
      return;
    }

    // Dropdown là nguồn sự thật duy nhất cho wardId — tránh gửi phường cũ trong
    // khi khu vực hiển thị đã đổi (đơn GHN sẽ về sai quận/phường).
    const payload = { ...formData, wardId: selectedWardId };

    setIsLoading(true);

    try {
      if (address) {
        await updateAddress(address.id, payload as UpdateAddressDto);
        if (formData.isDefault && !address.isDefault) {
          await setDefaultAddress(address.id);
        }
        toast.success("Cập nhật địa chỉ thành công");
      } else {
        const newAddress = await createAddress(payload as CreateAddressDto);
        if (formData.isDefault) {
          await setDefaultAddress(newAddress.id);
        }
        toast.success("Thêm địa chỉ thành công");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(address ? "Lỗi khi cập nhật địa chỉ" : "Lỗi khi thêm địa chỉ");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-[101] w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 sticky top-0 bg-white z-[500]">
          <h2 className="text-lg font-bold text-gray-900">
            {address ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Họ tên người nhận
              </label>
              <input
                type="text"
                name="recipientName"
                required
                value={formData.recipientName}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Nhập họ tên"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Số điện thoại
              </label>
              <input
                type="tel"
                name="recipientPhone"
                required
                value={formData.recipientPhone}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Nhập số điện thoại"
              />
            </div>

            {/* Location Section — khi sửa, khu vực cũ được nạp sẵn từ wardId đã lưu */}
            <AddressLocationFields
              streetAddress={formData.streetAddress}
              wardId={selectedWardId}
              latitude={formData.latitude}
              longitude={formData.longitude}
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
                setFormData((prev) => ({ ...prev, streetAddress: value }))
              }
              zoomToLocation={zoomToLocation}
              onMapLocationChange={handleMapLocationChange}
              isReverseGeocoding={isReverseGeocoding}
              areaTitle="Khu vực"
              streetLabel="Địa chỉ cụ thể"
              streetPlaceholder="Số nhà, tên đường..."
              mapLabel="Vị trí trên bản đồ"
              mapNote="Chạm vào bản đồ để chọn vị trí chính xác của địa chỉ nhận hàng"
            />
            {isLoadingRegion && (
              <p className="text-xs text-gray-400">Đang tải khu vực của địa chỉ...</p>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Loại địa chỉ</label>
              <select
                name="label"
                value={formData.label}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="Nhà riêng">Nhà riêng</option>
                <option value="Công ty">Công ty</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isDefault"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
              <label
                htmlFor="isDefault"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                Đặt làm địa chỉ mặc định
              </label>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isLoading ? "Đang lưu..." : "Lưu địa chỉ"}
            </button>
          </div>
        </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
