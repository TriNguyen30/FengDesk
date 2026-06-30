import { useState, useEffect, useRef, useCallback } from "react";
import { X, Loader2 } from "lucide-react";
import { CreateAddressDto, UpdateAddressDto, Address } from "../types/address";
import { createAddress, updateAddress } from "../api/address.api";
import { getProvinces, getDistrictsByProvinceId, getWardsByDistrictId } from "../api/location.api";
import { Provinces, District, Ward } from "../types/location";
import { toast } from "sonner";
import LocationPickerMap from "./LocationPickerMap";
import { geocodeLocation, reverseGeocode, findBestMatch } from "../api/geocoding";

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

  const [changeLocation, setChangeLocation] = useState(false); // Used in edit mode to toggle location change

  // Bidirectional sync states
  const [zoomToLocation, setZoomToLocation] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const isMapTriggeredRef = useRef(false); // Prevents infinite loop: map→dropdown→geocode→map

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
    if (address && isOpen) {
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
      setSelectedProvinceId("");
      setSelectedDistrictId("");
      setSelectedWardId("");
      setChangeLocation(false);
    } else if (isOpen) {
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
      setChangeLocation(true); // Always true for new address
    }
  }, [address, isOpen]);

  useEffect(() => {
    if (selectedProvinceId) {
      getDistrictsByProvinceId(selectedProvinceId).then((data) => {
        setDistricts(data || []);
        if (!isMapTriggeredRef.current) {
          setSelectedDistrictId("");
          setWards([]);
          setSelectedWardId("");
        }
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
        setWards(data || []);
        if (!isMapTriggeredRef.current) {
          setSelectedWardId("");
        }
      });
    } else {
      setWards([]);
      setSelectedWardId("");
    }
  }, [selectedDistrictId]);

  useEffect(() => {
    if (selectedWardId) {
      setFormData((prev) => ({ ...prev, wardId: selectedWardId }));
    } else if (changeLocation && !address) {
      setFormData((prev) => ({ ...prev, wardId: "" }));
    }
  }, [selectedWardId, changeLocation, address]);

  // ── Dropdown → Map: geocode selected location and zoom map ────────────
  const handleDropdownGeocode = useCallback(async (provinceName: string, districtName: string, wardName: string) => {
    if (isMapTriggeredRef.current) return; // Skip if change came from map click

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
  }, []);

  // Trigger geocode when province changes (user-driven only)
  const handleProvinceChange = useCallback((provinceId: string) => {
    isMapTriggeredRef.current = false;
    setSelectedProvinceId(provinceId);
    const province = provinces.find((p) => p.id === provinceId);
    if (province) {
      handleDropdownGeocode(province.name, "", "");
    }
  }, [provinces, handleDropdownGeocode]);

  // Trigger geocode when district changes (user-driven only)
  const handleDistrictChange = useCallback((districtId: string) => {
    isMapTriggeredRef.current = false;
    setSelectedDistrictId(districtId);
    const province = provinces.find((p) => p.id === selectedProvinceId);
    const district = districts.find((d) => d.id === districtId);
    if (province && district) {
      handleDropdownGeocode(province.name, district.name, "");
    }
  }, [provinces, districts, selectedProvinceId, handleDropdownGeocode]);

  // Trigger geocode when ward changes (user-driven only)
  const handleWardChange = useCallback((wardId: string) => {
    isMapTriggeredRef.current = false;
    setSelectedWardId(wardId);
    const province = provinces.find((p) => p.id === selectedProvinceId);
    const district = districts.find((d) => d.id === selectedDistrictId);
    const ward = wards.find((w) => w.id === wardId);
    if (province && district && ward) {
      handleDropdownGeocode(province.name, district.name, ward.name);
    }
  }, [provinces, districts, wards, selectedProvinceId, selectedDistrictId, handleDropdownGeocode]);

  // ── Map → Dropdown: reverse geocode and auto-fill dropdowns ───────────
  const handleMapLocationChange = useCallback(async (lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));

    if (!changeLocation) return; // Don't reverse geocode in edit mode without changing location

    setIsReverseGeocoding(true);
    isMapTriggeredRef.current = true;

    try {
      const result = await reverseGeocode(lat, lng);
      if (!result) {
        isMapTriggeredRef.current = false;
        setIsReverseGeocoding(false);
        return;
      }

      // Ensure provinces are loaded
      let currentProvinces = provinces;
      if (currentProvinces.length === 0) {
        currentProvinces = await getProvinces();
        setProvinces(currentProvinces || []);
      }

      // Match province
      const matchedProvinceId = findBestMatch(currentProvinces, result.province);
      if (matchedProvinceId) {
        setSelectedProvinceId(matchedProvinceId);

        // Fetch and match district
        const districtData = await getDistrictsByProvinceId(matchedProvinceId);
        setDistricts(districtData || []);

        const matchedDistrictId = findBestMatch(districtData || [], result.district);
        if (matchedDistrictId) {
          setSelectedDistrictId(matchedDistrictId);

          // Fetch and match ward
          const wardData = await getWardsByDistrictId(matchedDistrictId);
          setWards(wardData || []);

          const matchedWardId = findBestMatch(wardData || [], result.ward);
          if (matchedWardId) {
            setSelectedWardId(matchedWardId);
            setFormData((prev) => ({ ...prev, wardId: matchedWardId }));
          }
        }
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    } finally {
      isMapTriggeredRef.current = false;
      setIsReverseGeocoding(false);
    }
  }, [provinces, changeLocation]);

  if (!isOpen) return null;

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

    if (changeLocation && !selectedWardId) {
      toast.error("Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã");
      return;
    }

    // In edit mode, if not changing location, wardId remains the original one
    if (!formData.wardId) {
      toast.error("Thiếu thông tin Phường/Xã");
      return;
    }

    setIsLoading(true);

    try {
      if (address) {
        await updateAddress(address.id, formData as UpdateAddressDto);
        toast.success("Cập nhật địa chỉ thành công");
      } else {
        await createAddress(formData as CreateAddressDto);
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
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

            {/* Location Section */}
            {address && !changeLocation ? (
              <div className="rounded-lg bg-gray-50 p-3 border border-gray-200">
                <p className="text-sm text-gray-700 mb-2">Đang sử dụng khu vực của địa chỉ cũ.</p>
                <button
                  type="button"
                  onClick={() => setChangeLocation(true)}
                  className="text-sm font-medium text-primary hover:underline cursor-pointer"
                >
                  Thay đổi khu vực (Tỉnh/Thành, Quận/Huyện)
                </button>
              </div>
            ) : (
              <div className="space-y-3 rounded-lg bg-gray-50 p-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Khu vực</h3>
                  {isReverseGeocoding && (
                    <span className="flex items-center gap-1.5 text-xs text-primary">
                      <Loader2 size={12} className="animate-spin" />
                      Đang xác định địa chỉ...
                    </span>
                  )}
                </div>

                <select
                  value={selectedProvinceId}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="">Chọn Tỉnh/Thành</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedDistrictId}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  disabled={!selectedProvinceId}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100 disabled:opacity-70 cursor-pointer"
                >
                  <option value="">Chọn Quận/Huyện</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedWardId}
                  onChange={(e) => handleWardChange(e.target.value)}
                  disabled={!selectedDistrictId}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100 disabled:opacity-70 cursor-pointer"
                >
                  <option value="">Chọn Phường/Xã</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>

                {address && (
                  <button
                    type="button"
                    onClick={() => {
                      setChangeLocation(false);
                      setFormData((prev) => ({ ...prev, wardId: address.wardId }));
                    }}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 mt-2 block cursor-pointer"
                  >
                    Hủy thay đổi khu vực
                  </button>
                )}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Địa chỉ cụ thể
              </label>
              <input
                type="text"
                name="streetAddress"
                required
                value={formData.streetAddress}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Số nhà, tên đường..."
              />
            </div>

            <div className="relative">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Vị trí trên bản đồ
              </label>
              <LocationPickerMap
                latitude={formData.latitude}
                longitude={formData.longitude}
                onChange={handleMapLocationChange}
                zoomToLocation={zoomToLocation}
              />
              <p className="mt-1 text-xs text-gray-500">
                Chạm vào bản đồ để chọn vị trí chính xác của địa chỉ nhận hàng
              </p>
            </div>

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
      </div>
    </div>
  );
}
