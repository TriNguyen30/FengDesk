import { useState } from "react";
import { ShieldCheck, Leaf, Truck, HeartHandshake, Plus, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function CommitmentPage() {
    const { t } = useTranslation();
    const [openIndices, setOpenIndices] = useState<number[]>([]);

    const commitments = [
        {
            icon: <Leaf className="text-green-600" size={24} strokeWidth={1.5} />,
            title: t("commitment.c1.title"),
            description: t("commitment.c1.desc"),
        },
        {
            icon: <ShieldCheck className="text-green-600" size={24} strokeWidth={1.5} />,
            title: t("commitment.c2.title"),
            description: t("commitment.c2.desc"),
        },
        {
            icon: <HeartHandshake className="text-green-600" size={24} strokeWidth={1.5} />,
            title: t("commitment.c3.title"),
            description: t("commitment.c3.desc"),
        },
        {
            icon: <Truck className="text-green-600" size={24} strokeWidth={1.5} />,
            title: t("commitment.c4.title"),
            description: t("commitment.c4.desc"),
        },
    ];

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
                        {t("commitment.title1")} <span className="text-green-600">{t("commitment.title2")}</span>
                    </h2>
                    <p className="mx-auto max-w-2xl text-xm text-gray-600">
                        {t("commitment.desc")}
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
