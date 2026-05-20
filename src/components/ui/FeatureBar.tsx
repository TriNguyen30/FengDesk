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
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4 lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:border lg:border-gray-200">
            {features.map((f, i) => (
                <div
                    key={i}
                    className="flex min-h-[72px] items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 sm:min-h-0 sm:px-4 sm:py-3 lg:rounded-none lg:border-0 lg:border-r lg:border-gray-100 lg:px-5 lg:py-4 lg:last:border-r-0"
                >
                    <span className="shrink-0 [&>svg]:size-6 sm:[&>svg]:size-7">{f.icon}</span>

                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{f.title}</p>
                        <p className="text-xs text-gray-500">{f.sub}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}