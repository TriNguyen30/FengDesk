import { Truck, Sparkles, ShieldCheck, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function FeatureBar() {
  const { t } = useTranslation();

  const features = [
    {
      icon: <Sparkles size={36} strokeWidth={1.2} className="text-primary" />,
      title: t("feature_bar.feature1.title"),
      sub: t("feature_bar.feature1.sub"),
    },
    {
      icon: <Truck size={36} strokeWidth={1.2} className="text-primary" />,
      title: t("feature_bar.feature2.title"),
      sub: t("feature_bar.feature2.sub"),
    },
    {
      icon: <ShieldCheck size={36} strokeWidth={1.2} className="text-primary" />,
      title: t("feature_bar.feature3.title"),
      sub: t("feature_bar.feature3.sub"),
    },
    {
      icon: <Clock size={36} strokeWidth={1.2} className="text-primary" />,
      title: t("feature_bar.feature4.title"),
      sub: t("feature_bar.feature4.sub"),
    },
  ];

  return (
    <>
      {/* Desktop Version - Skewed Parallelogram layout */}
      <div className="mt-10 hidden lg:block overflow-visible pb-6 px-4">
        <div className="relative mx-auto max-w-6xl">
          {/* Skewed Background to avoid blurring the text */}
          <div
            className="absolute inset-0 bg-white shadow-[0_5px_20px_rgba(0,0,0,0.05)] border border-gray-100/50"
            style={{ transform: "skewX(-12deg)", borderRadius: "10px" }}
          />
          
          <div className="relative z-10 flex w-full items-center justify-between px-6 py-8">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex flex-1 flex-col items-center justify-center text-center px-4"
              >
                <div className="mb-4">{f.icon}</div>
                <h3 className="mb-1.5 text-[15px] font-extrabold uppercase tracking-wide text-gray-900">
                  {f.title}
                </h3>
                <p className="text-[13px] font-medium text-gray-700">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Version - Standard Grid */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:hidden">
        {features.map((f, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center rounded-xl bg-white p-4 text-center shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-50"
          >
            <div className="mb-2">{f.icon}</div>
            <h3 className="mb-1 text-xs sm:text-sm font-extrabold uppercase tracking-tight text-gray-900">
              {f.title}
            </h3>
            <p className="text-[10px] sm:text-xs font-medium text-gray-600">{f.sub}</p>
          </div>
        ))}
      </div>
    </>
  );
}

