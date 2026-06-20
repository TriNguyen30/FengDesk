import { useState, useEffect, useCallback } from "react";
import { Store, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  getProvinces,
  getDistrictsByProvinceId,
  getWardsByDistrictId,
} from "@/features/users/api/location.api";
import type { Provinces, District, Ward } from "@/features/users/types/location";
import {
  getAllShopRequest,
  getShopRequestById,
  createShopRequest,
  updateShopRequest,
  deleteShopRequest,
  hardDeleteShopRequest,
  createShopAddressRequest,
  updateShopAddressRequest,
  deleteShopAddressRequest,
  hardDeleteShopAddressRequest,
  getShopStaffRequest,
  addShopStaffRequest,
  removeShopStaffRequest,
} from "@/features/shop/api/shop.api";
import type { Shop, StoreAddress, StoreStaff } from "@/features/shop/types/shop";
import {
  StoreList,
  StoreDetailCard,
  StoreModal,
  DeleteStoreModal,
  StoreAddressModal,
} from "@/features/manager/components";

export default function ManageStoresPage() {
  // Lists
  const [stores, setStores] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Shop | null>(null);
  const [selectedStoreDetails, setSelectedStoreDetails] = useState<Shop | null>(null);
  const [staff, setStaff] = useState<StoreStaff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Tabs for Selected Store details: 'info' | 'staff'
  const [activeTab, setActiveTab] = useState<"info" | "staff">("info");

  // Store Modals
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Shop | null>(null);
  const [storeForm, setStoreForm] = useState({
    ownerUserId: "",
    name: "",
    description: "",
    hotline: "",
    openingHours: "",
    isActive: true,
    address: "",
  });
  const [submittingStore, setSubmittingStore] = useState(false);

  // Delete Store Modal
  const [deleteStoreId, setDeleteStoreId] = useState<string | null>(null);
  const [deleteStoreName, setDeleteStoreName] = useState("");
  const [isHardDelete, setIsHardDelete] = useState(false);
  const [deletingStore, setDeletingStore] = useState(false);

  // Address Modals / Forms (Store Address)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<StoreAddress | null>(null);
  const [addressForm, setAddressForm] = useState({
    wardId: "",
    streetAddress: "",
    recipientName: "",
    recipientPhone: "",
    latitude: 0,
    longitude: 0,
    isDefault: true,
    label: "Cửa hàng",
  });
  const [submittingAddress, setSubmittingAddress] = useState(false);

  // Address Location Dropdowns
  const [provinces, setProvinces] = useState<Provinces[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");

  // Address Deletion
  const [deletingAddress, setDeletingAddress] = useState(false);

  // Staff Form
  const [staffUserId, setStaffUserId] = useState("");
  const [staffRole, setStaffRole] = useState("staff");
  const [submittingStaff, setSubmittingStaff] = useState(false);

  // Staff Deletion
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);

  // Fetch all stores
  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllShopRequest();
      if (response.isSuccess && response.data) {
        setStores(response.data);
        // If a store was already selected, update its reference
        if (selectedStore) {
          const updated = response.data.find((s) => s.id === selectedStore.id);
          if (updated) {
            setSelectedStore(updated);
          }
        }
      } else {
        toast.error("Không thể tải danh sách cửa hàng");
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi khi tải danh sách cửa hàng");
    } finally {
      setLoading(false);
    }
  }, [selectedStore]);

  useEffect(() => {
    fetchStores();
  }, []);

  // Fetch detailed store info (to get nested address if any) and staff
  const fetchStoreDetails = async (storeId: string) => {
    try {
      const response = await getShopRequestById(storeId);
      if (response.isSuccess && response.data) {
        setSelectedStoreDetails(response.data);
      }
    } catch (err) {
      console.error("Failed to load store details", err);
    }
  };

  const fetchStaff = async (storeId: string) => {
    setLoadingStaff(true);
    try {
      const response = await getShopStaffRequest(storeId);
      if (response.isSuccess && response.data) {
        setStaff(response.data);
      } else {
        setStaff([]);
      }
    } catch (err) {
      console.error("Failed to load store staff", err);
      setStaff([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    if (selectedStore) {
      fetchStoreDetails(selectedStore.id);
      fetchStaff(selectedStore.id);
    } else {
      setSelectedStoreDetails(null);
      setStaff([]);
    }
  }, [selectedStore]);

  // Load provinces on opening Address Modal
  useEffect(() => {
    if (isAddressModalOpen) {
      getProvinces()
        .then((data) => setProvinces(data || []))
        .catch((err) => console.error("Error fetching provinces", err));
    }
  }, [isAddressModalOpen]);

  // Districts based on province
  useEffect(() => {
    if (selectedProvinceId) {
      getDistrictsByProvinceId(selectedProvinceId)
        .then((data) => {
          setDistricts(data || []);
          setSelectedDistrictId("");
          setWards([]);
        })
        .catch((err) => console.error("Error fetching districts", err));
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [selectedProvinceId]);

  // Wards based on district
  useEffect(() => {
    if (selectedDistrictId) {
      getWardsByDistrictId(selectedDistrictId)
        .then((data) => setWards(data || []))
        .catch((err) => console.error("Error fetching wards", err));
    } else {
      setWards([]);
    }
  }, [selectedDistrictId]);

  // Handle store form open
  const handleOpenStoreModal = (store: Shop | null = null) => {
    if (store) {
      setEditingStore(store);
      setStoreForm({
        ownerUserId: store.ownerUserId || "",
        name: store.name || "",
        description: store.description || "",
        hotline: store.hotline || "",
        openingHours: store.openingHours || "",
        isActive: store.isActive ?? true,
        address: store.address || "",
      });
    } else {
      setEditingStore(null);
      setStoreForm({
        ownerUserId: "",
        name: "",
        description: "",
        hotline: "",
        openingHours: "",
        isActive: true,
        address: "",
      });
    }
    setIsStoreModalOpen(true);
  };

  // Submit store create/edit
  const handleSubmitStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeForm.name.trim() || !storeForm.hotline.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }

    setSubmittingStore(true);
    try {
      if (editingStore) {
        const res = await updateShopRequest(editingStore.id, storeForm);
        if (res.isSuccess) {
          toast.success("Cập nhật cửa hàng thành công");
          fetchStores();
          setIsStoreModalOpen(false);
        } else {
          toast.error(res.message || "Lỗi khi cập nhật cửa hàng");
        }
      } else {
        const res = await createShopRequest(storeForm);
        if (res.isSuccess) {
          toast.success("Tạo cửa hàng mới thành công");
          fetchStores();
          setIsStoreModalOpen(false);
        } else {
          toast.error(res.message || "Lỗi khi tạo cửa hàng mới");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi hệ thống");
    } finally {
      setSubmittingStore(false);
    }
  };

  // Handle delete store click
  const handleDeleteStoreClick = (store: Shop, hard: boolean = false) => {
    setDeleteStoreId(store.id);
    setDeleteStoreName(store.name);
    setIsHardDelete(hard);
  };

  // Confirm delete store
  const handleConfirmDeleteStore = async () => {
    if (!deleteStoreId) return;
    setDeletingStore(true);
    try {
      let res;
      if (isHardDelete) {
        res = await hardDeleteShopRequest(deleteStoreId);
      } else {
        res = await deleteShopRequest(deleteStoreId);
      }

      if (res.isSuccess) {
        toast.success(
          isHardDelete
            ? "Đã xóa vĩnh viễn cửa hàng thành công"
            : "Đã tạm dừng hoạt động/xóa mềm cửa hàng thành công",
        );
        if (selectedStore?.id === deleteStoreId) {
          setSelectedStore(null);
        }
        fetchStores();
        setDeleteStoreId(null);
      } else {
        toast.error(res.message || "Lỗi khi xóa cửa hàng");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi gửi yêu cầu xóa cửa hàng");
    } finally {
      setDeletingStore(false);
    }
  };

  // Handle address modal open
  const handleOpenAddressModal = (addr: StoreAddress | null = null) => {
    if (addr) {
      setEditingAddress(addr);
      setAddressForm({
        wardId: addr.wardId || "",
        streetAddress: addr.streetAddress || "",
        recipientName: addr.recipientName || "",
        recipientPhone: addr.recipientPhone || "",
        latitude: addr.latitude || 0,
        longitude: addr.longitude || 0,
        isDefault: addr.isDefault ?? true,
        label: addr.label || "Cửa hàng",
      });
      setSelectedProvinceId("");
      setSelectedDistrictId("");
    } else {
      setEditingAddress(null);
      setAddressForm({
        wardId: "",
        streetAddress: "",
        recipientName: selectedStore?.name || "",
        recipientPhone: selectedStore?.hotline || "",
        latitude: 10.8231, // Default coordinates (HCMC)
        longitude: 106.6297,
        isDefault: true,
        label: "Cửa hàng",
      });
      setSelectedProvinceId("");
      setSelectedDistrictId("");
    }
    setIsAddressModalOpen(true);
  };

  // Submit address create/edit
  const handleSubmitAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;
    if (
      !addressForm.streetAddress.trim() ||
      !addressForm.recipientName.trim() ||
      !addressForm.recipientPhone.trim()
    ) {
      toast.error("Vui lòng nhập đầy đủ thông tin liên hệ và số nhà");
      return;
    }
    if (!addressForm.wardId) {
      toast.error("Vui lòng chọn đầy đủ Phường/Xã");
      return;
    }

    setSubmittingAddress(true);
    try {
      if (editingAddress) {
        const res = await updateShopAddressRequest(selectedStore.id, addressForm);
        if (res.isSuccess) {
          toast.success("Cập nhật địa chỉ thành công");
          fetchStoreDetails(selectedStore.id);
          setIsAddressModalOpen(false);
        } else {
          toast.error(res.message || "Lỗi khi cập nhật địa chỉ");
        }
      } else {
        const res = await createShopAddressRequest(selectedStore.id, addressForm);
        if (res.isSuccess) {
          toast.success("Thêm địa chỉ cửa hàng thành công");
          fetchStoreDetails(selectedStore.id);
          setIsAddressModalOpen(false);
        } else {
          toast.error(res.message || "Lỗi khi thêm địa chỉ");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi hệ thống khi cập nhật địa chỉ");
    } finally {
      setSubmittingAddress(false);
    }
  };

  // Address deletion (soft/hard)
  const handleDeleteAddress = async (hard: boolean = false) => {
    if (!selectedStore) return;
    if (
      !window.confirm(
        hard
          ? "Bạn có chắc chắn muốn xóa vĩnh viễn địa chỉ này?"
          : "Bạn có chắc chắn muốn xóa mềm địa chỉ này?",
      )
    )
      return;

    setDeletingAddress(true);
    try {
      let res;
      if (hard) {
        res = await hardDeleteShopAddressRequest(selectedStore.id);
      } else {
        res = await deleteShopAddressRequest(selectedStore.id);
      }

      if (res.isSuccess) {
        toast.success("Xóa địa chỉ cửa hàng thành công");
        fetchStoreDetails(selectedStore.id);
      } else {
        toast.error(res.message || "Lỗi khi xóa địa chỉ");
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi");
    } finally {
      setDeletingAddress(false);
    }
  };

  // Add staff member
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;
    if (!staffUserId.trim()) {
      toast.error("Vui lòng nhập Mã người dùng (User ID)");
      return;
    }

    setSubmittingStaff(true);
    try {
      const res = await addShopStaffRequest(selectedStore.id, {
        userId: staffUserId.trim(),
        role: staffRole,
      });

      if (res.isSuccess) {
        toast.success("Thêm nhân viên thành công");
        setStaffUserId("");
        fetchStaff(selectedStore.id);
      } else {
        toast.error(res.message || "Lỗi khi thêm nhân viên");
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi hệ thống khi thêm nhân viên");
    } finally {
      setSubmittingStaff(false);
    }
  };

  // Delete staff assignment
  const handleRemoveStaff = async (assignmentId: string) => {
    if (!selectedStore) return;
    if (!window.confirm("Bạn có chắc chắn muốn gỡ nhân viên này ra khỏi cửa hàng?")) return;

    setDeletingStaffId(assignmentId);
    try {
      const res = await removeShopStaffRequest(selectedStore.id, assignmentId);
      if (res.isSuccess) {
        toast.success("Đã gỡ nhân viên thành công");
        fetchStaff(selectedStore.id);
      } else {
        toast.error(res.message || "Lỗi khi gỡ nhân viên");
      }
    } catch (err) {
      console.error(err);
      toast.error("Đã xảy ra lỗi hệ thống khi gỡ nhân viên");
    } finally {
      setDeletingStaffId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Quản lý cửa hàng</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các cơ sở, chi nhánh cửa hàng, phân phối nhân viên, địa chỉ của hệ thống.
          </p>
        </div>
        <button
          onClick={() => handleOpenStoreModal(null)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-dark active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          Thêm cửa hàng
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* ── Left Column: Store list ────────────────────────────────────────── */}
        <StoreList
          stores={stores}
          selectedStore={selectedStore}
          onSelectStore={setSelectedStore}
          onEditStore={handleOpenStoreModal}
          onDeleteStore={handleDeleteStoreClick}
          loading={loading}
        />

        {/* ── Right Column: Selected Store Details & Management ──────────────── */}
        <div className="lg:col-span-2">
          {selectedStore ? (
            <StoreDetailCard
              selectedStore={selectedStore}
              selectedStoreDetails={selectedStoreDetails}
              staff={staff}
              loadingStaff={loadingStaff}
              activeTab={activeTab}
              onActiveTabChange={setActiveTab}
              onOpenAddressModal={handleOpenAddressModal}
              onDeleteAddress={handleDeleteAddress}
              deletingAddress={deletingAddress}
              staffUserId={staffUserId}
              onStaffUserIdChange={setStaffUserId}
              staffRole={staffRole}
              onStaffRoleChange={setStaffRole}
              onAddStaff={handleAddStaff}
              submittingStaff={submittingStaff}
              onRemoveStaff={handleRemoveStaff}
              deletingStaffId={deletingStaffId}
            />
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
              <Store size={40} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-gray-900">Chưa chọn cửa hàng nào</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                Chọn một chi nhánh từ danh sách bên trái để quản lý chi tiết địa chỉ giao nhận và
                danh sách nhân viên trực thuộc.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Create/Edit Store ───────────────────────────────────────── */}
      <StoreModal
        open={isStoreModalOpen}
        editingStore={editingStore}
        onClose={() => setIsStoreModalOpen(false)}
        storeForm={storeForm}
        onFormChange={setStoreForm}
        onSubmit={handleSubmitStore}
        submitting={submittingStore}
      />

      {/* ── Modal: Delete Confirmation ─────────────────────────────────────── */}
      <DeleteStoreModal
        open={deleteStoreId !== null}
        storeName={deleteStoreName}
        isHardDelete={isHardDelete}
        onClose={() => setDeleteStoreId(null)}
        onConfirm={handleConfirmDeleteStore}
        deleting={deletingStore}
      />

      {/* ── Modal: Create/Edit Store Address ───────────────────────────────── */}
      <StoreAddressModal
        open={isAddressModalOpen}
        editingAddress={editingAddress}
        onClose={() => setIsAddressModalOpen(false)}
        addressForm={addressForm}
        onFormChange={setAddressForm}
        onSubmit={handleSubmitAddress}
        submitting={submittingAddress}
        provinces={provinces}
        districts={districts}
        wards={wards}
        selectedProvinceId={selectedProvinceId}
        onProvinceChange={setSelectedProvinceId}
        selectedDistrictId={selectedDistrictId}
        onDistrictChange={setSelectedDistrictId}
      />
    </div>
  );
}
