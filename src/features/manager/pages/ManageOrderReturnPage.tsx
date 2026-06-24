import { useState, useEffect } from "react";
import { Loader2, PackageX } from "lucide-react";
import { toast } from "sonner";
import { returnApi } from "@/features/return/api/return.api";
import type { ReturnItem } from "@/features/return/types/return.d.ts";
import { formatVnd, formatOrderDate } from "@/features/orders/utils/orderUtils";
import { useQueryClient } from "@tanstack/react-query";

export default function ManageOrderReturnPage() {
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        setIsLoading(true);
        const response = await returnApi.getAllReturns({ Page: 1, PageSize: 50 });
        await queryClient.invalidateQueries({ queryKey: ["returns"] });
        if (response.data?.isSuccess) {
          setReturns(response.data.data.items);
        } else {
          toast.error(response.data?.message || "Lỗi khi tải danh sách trả hàng");
        }
      } catch (error) {
        console.error(error);
        toast.error("Có lỗi xảy ra khi tải danh sách trả hàng");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReturns();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Yêu cầu trả hàng</h1>
          <p className="text-gray-500 mt-1 text-sm">Xem và quản lý các yêu cầu trả hàng / hoàn tiền.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Đang tải danh sách...</p>
          </div>
        ) : returns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <PackageX className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="text-base font-semibold text-gray-900">Không có yêu cầu trả hàng nào</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Mã đơn</th>
                  <th className="p-4">Loại</th>
                  <th className="p-4">Lý do</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Số lượng</th>
                  <th className="p-4">Tiền hoàn</th>
                  <th className="p-4">Ngày yêu cầu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {returns.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="p-4 font-mono font-medium text-gray-900">
                      #{item.orderId.substring(0, 8)}
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-gray-800">{item.type}</span>
                    </td>
                    <td className="p-4 text-gray-600">{item.reason}</td>
                    <td className="p-4">
                      <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${
                        item.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        item.status === 'Approved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">{item.itemCount}</td>
                    <td className="p-4 font-bold text-gray-900">
                      {item.refundAmount > 0 ? formatVnd(item.refundAmount) : '-'}
                    </td>
                    <td className="p-4 text-xs text-gray-500">
                      {formatOrderDate(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}