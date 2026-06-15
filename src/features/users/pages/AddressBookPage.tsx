import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { getAddresses, deleteAddress } from "../api/address.api";
import { Address } from "../types/address";
import { toast } from "sonner";
import AddressModal from "../components/AddressModal";

export default function AddressBookPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const data = await getAddresses();
      setAddresses(data || []);
    } catch (error) {
      toast.error("Không thể tải danh sách địa chỉ");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedAddress(null);
    setIsModalOpen(true);
  };

  const handleEdit = (address: Address) => {
    setSelectedAddress(address);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
      try {
        await deleteAddress(id);
        toast.success("Xóa địa chỉ thành công");
        fetchAddresses();
      } catch (error) {
        toast.error("Không thể xóa địa chỉ");
        console.error(error);
      }
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Địa chỉ của tôi</h1>
        <button 
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <Plus size={16} />
          Thêm địa chỉ mới
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      ) : addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-12 text-center">
          <div className="mb-4 rounded-full bg-gray-50 p-3 text-gray-400">
            <Plus size={24} />
          </div>
          <h3 className="text-sm font-medium text-gray-900">Chưa có địa chỉ nào</h3>
          <p className="mt-1 text-sm text-gray-500">
            Thêm địa chỉ để nhận hàng thuận tiện hơn
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="relative flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    {address.recipientName}
                  </span>
                  {address.isDefault && (
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      Mặc định
                    </span>
                  )}
                  {address.label && (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                      {address.label}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  <p>Số điện thoại: {address.recipientPhone}</p>
                  <p className="mt-1">{address.streetAddress}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                <button 
                  onClick={() => handleEdit(address)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 cursor-pointer"
                >
                  <Edit2 size={14} />
                  Cập nhật
                </button>
                {!address.isDefault && (
                  <button 
                    onClick={() => handleDelete(address.id)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    Xóa
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAddresses}
        address={selectedAddress}
      />
    </div>
  );
}
