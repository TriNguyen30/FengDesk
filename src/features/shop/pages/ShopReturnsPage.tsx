import { useParams } from "react-router-dom";
import ShopReturnsView from "../components/ShopReturnsView";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function ShopReturnsPage() {
  const { storeId = "" } = useParams<{ storeId: string }>();

  return (
    <div className="mx-auto max-w-6xl py-4">
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link
          to={`/stores/${storeId}`}
          className="inline-flex items-center gap-1 hover:text-primary"
        >
          <ArrowLeft size={14} />
          Cửa hàng của tôi
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Quản lý đơn giao</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Yêu cầu trả hàng</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Quản lý các yêu cầu trả hàng, hoàn tiền hoặc đổi hàng của khách hàng.
        </p>
      </div>
      <ShopReturnsView storeId={storeId} />
    </div>
  );
}
