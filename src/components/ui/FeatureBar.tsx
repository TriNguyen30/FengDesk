import { Truck, RefreshCw, ShieldCheck, Clock } from "lucide-react";

const features = [
  {
    icon: <Truck size={28} className="text-primary" />,
    title: "Miễn phí vận chuyển",
    sub: "Cho đơn từ 500.000đ",
  },
  {
    icon: <RefreshCw size={28} className="text-primary" />,
    title: "Đổi trả dễ dàng",
    sub: "Trong vòng 7 ngày",
  },
  {
    icon: <ShieldCheck size={28} className="text-primary" />,
    title: "Thanh toán an toàn",
    sub: "Bảo mật 100%",
  },
  {
    icon: <Clock size={28} className="text-primary" />,
    title: "Hỗ trợ 24/7",
    sub: "1900 1234",
  },
];

export default function FeatureBar() {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4 lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:border lg:border-gray-200">
      {features.map((f, i) => (
        <div
          key={i}
          className="flex min-h-[68px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 sm:min-h-[72px] sm:gap-3 sm:px-4 sm:py-3 lg:min-h-0 lg:rounded-none lg:border-0 lg:border-r lg:border-gray-100 lg:px-5 lg:py-4 lg:last:border-r-0"
        >
          <span className="shrink-0 [&>svg]:size-5 sm:[&>svg]:size-7">{f.icon}</span>

          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-800 sm:text-sm">{f.title}</p>
            <p className="text-[10px] text-gray-500 sm:text-xs">{f.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
