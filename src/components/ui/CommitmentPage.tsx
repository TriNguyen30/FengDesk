import { useState } from "react";
import { ShieldCheck, Leaf, Truck, HeartHandshake, Plus, Minus } from "lucide-react";

const commitments = [
    {
        icon: <Leaf className="text-green-600" size={24} strokeWidth={1.5} />,
        title: "100% Cây Khỏe Mạnh & Tuyển Chọn Khắt Khe",
        description:
            "Mỗi chậu cây đều trải qua quy trình 5 bước kiểm tra chất lượng từ vườn ươm. Chúng tôi cam kết không giao cây có dấu hiệu sâu bệnh, héo úa hoặc hư hỏng. Cây luôn đạt trạng thái sinh trưởng tốt nhất khi đến tay bạn.",
    },
    {
        icon: <ShieldCheck className="text-green-600" size={24} strokeWidth={1.5} />,
        title: "Bảo Hành Sinh Trưởng & Đổi Trả Miễn Phí",
        description:
            "Sự an tâm của bạn là ưu tiên hàng đầu. FengDesk bảo hành 1 đổi 1 trong vòng 7 ngày đầu tiên nếu cây có bất kỳ dấu hiệu suy yếu nào do nguyên nhân khách quan hoặc do quá trình vận chuyển.",
    },
    {
        icon: <HeartHandshake className="text-green-600" size={24} strokeWidth={1.5} />,
        title: "Đồng Hành & Tư Vấn Tận Tâm Trọn Đời",
        description:
            "Bạn không chỉ mua một cái cây, bạn nhận được sự đồng hành. Đội ngũ chuyên gia phong thủy và kỹ sư nông nghiệp của chúng tôi luôn sẵn sàng hỗ trợ bạn cách chăm sóc cây phù hợp với từng không gian sống.",
    },
    {
        icon: <Truck className="text-green-600" size={24} strokeWidth={1.5} />,
        title: "Đóng Gói Tiêu Chuẩn & Giao Hàng An Toàn",
        description:
            "Hệ thống đóng gói độc quyền với nhiều lớp bảo vệ giúp cố định chậu và cành lá. Chúng tôi đảm bảo cây luôn an toàn, không dập nát, gãy cành hay đổ đất trong suốt chặng đường vận chuyển.",
    },
];

export default function CommitmentPage() {
    const [openIndices, setOpenIndices] = useState<number[]>([]);

    const toggleAccordion = (idx: number) => {
        setOpenIndices((prev) =>
            prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
        );
    };

    return (
        <section className="my-2 px-4">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8 text-center">
                    <h2 className="mb-3 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                        Cam Kết Từ <span className="text-green-600">FengDesk</span>
                    </h2>
                    <p className="mx-auto max-w-2xl text-xm text-gray-600">
                        Chúng tôi tin rằng mỗi chậu cây không chỉ là một vật trang trí, mà còn là một người bạn đồng hành mang lại may mắn và năng lượng tích cực cho bạn.
                    </p>
                </div>

                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm divide-y divide-gray-100">
                    {commitments.map((item, idx) => {
                        const isOpen = openIndices.includes(idx);

                        return (
                            <div
                                key={idx}
                                className={`transition-colors duration-300 ${isOpen ? "bg-white" : "bg-white hover:bg-gray-50/50"}`}
                            >
                                <button
                                    onClick={() => toggleAccordion(idx)}
                                    className="flex items-center justify-between w-full p-5 text-left focus:outline-none cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isOpen ? "bg-green-100" : "bg-gray-50"
                                            }`}>
                                            {item.icon}
                                        </div>
                                        <h3 className={`text-xs sm:text-sm lg:text-[15px] font-extrabold uppercase tracking-tight lg:tracking-wide transition-colors ${isOpen ? "text-green-800" : "text-gray-900"
                                            }`}>
                                            {item.title}
                                        </h3>
                                    </div>
                                    <div className="relative w-6 h-6 flex-shrink-0">
                                        <Plus
                                            className={`absolute inset-0 transition-all duration-300 ${isOpen ? "rotate-90 opacity-0 text-green-600" : "rotate-0 opacity-100 text-gray-400"
                                                }`}
                                        />
                                        <Minus
                                            className={`absolute inset-0 transition-all duration-300 ${isOpen ? "rotate-0 opacity-100 text-green-600" : "-rotate-90 opacity-0 text-gray-400"
                                                }`}
                                        />
                                    </div>
                                </button>

                                <div
                                    className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                        }`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="p-5 pt-0 pl-[4.5rem] text-gray-600 lg:text-gray-700 font-medium leading-relaxed text-[10px] sm:text-xs lg:text-[13px]">
                                            {item.description}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
