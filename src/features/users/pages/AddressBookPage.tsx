import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, CheckCircle } from "lucide-react";
import { getAddresses, deleteAddress, setDefaultAddress } from "../api/address.api";
import { Address } from "../types/address";
import { toast } from "sonner";
import AddressModal from "../components/AddressModal";
import Modal from "@/components/ui/Modal";
import { useTranslation } from "react-i18next";

export default function AddressBookPage() {
  const { t } = useTranslation();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const data = await getAddresses();
      setAddresses(data || []);
    } catch (error) {
      toast.error(t("address_book.toast.load_error"));
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

  const handleDeleteClick = (id: string) => {
    setAddressToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!addressToDelete) return;
    try {
      await deleteAddress(addressToDelete);
      toast.success(t("address_book.toast.delete_success"));
      fetchAddresses();
    } catch (error) {
      toast.error(t("address_book.toast.delete_error"));
      console.error(error);
    } finally {
      setIsDeleteModalOpen(false);
      setAddressToDelete(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      toast.success(t("address_book.toast.set_default_success"));
      fetchAddresses();
    } catch (error) {
      toast.error(t("address_book.toast.set_default_error"));
      console.error(error);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">{t("address_book.title")}</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {t("address_book.subtitle")}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <Plus size={16} />
          {t("address_book.add_new")}
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
          <h3 className="text-sm font-medium text-gray-900">{t("address_book.empty.title")}</h3>
          <p className="mt-1 text-sm text-gray-500">{t("address_book.empty.desc")}</p>
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
                  <span className="font-semibold text-gray-900">{address.recipientName}</span>
                  {address.isDefault && (
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {t("address_book.item.default_badge")}
                    </span>
                  )}
                  {address.label && (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                      {address.label}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  <p>{t("address_book.item.phone")} {address.recipientPhone}</p>
                  <p className="mt-1">{address.streetAddress}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                <button
                  onClick={() => handleEdit(address)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 cursor-pointer"
                >
                  <Edit2 size={14} />
                  {t("address_book.actions.update")}
                </button>
                {!address.isDefault && (
                  <>
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-green-600 transition-colors hover:bg-green-50 cursor-pointer"
                    >
                      <CheckCircle size={14} />
                      {t("address_book.actions.set_default")}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(address.id)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 size={14} />
                      {t("address_book.actions.delete")}
                    </button>
                  </>
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

      <Modal
        open={isDeleteModalOpen}
        title={t("address_book.delete_modal.title")}
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t("address_book.delete_modal.desc")}
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
            >
              {t("address_book.delete_modal.cancel", t("address_book.actions.cancel"))}
            </button>
            <button
              onClick={handleConfirmDelete}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 cursor-pointer"
            >
              {t("address_book.delete_modal.confirm")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
