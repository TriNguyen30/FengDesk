import { ArrowRight, HelpCircle } from "lucide-react";

/**
 * "Zen Collection" bento-grid promo section for the HomePage.
 *
 * Layout (desktop):
 *  ┌─────────────────────────────┬──────────────┐
 *  │   Deep Focus Bundle (wide)   │              │
 *  │                               │ New Arrival  │
 *  ├───────────────┬──────────────┤   (tall)     │
 *  │  The Minimalist│  AI Consult  │              │
 *  └───────────────┴──────────────┴──────────────┘
 *
 * Stacks to a single column on mobile.
 *
 * NOTE: image URLs below are placeholders — swap in real product/lifestyle
 * photography before shipping.
 */

const FOCUS_BUNDLE_IMG =
    "https://www.invaluable.com/blog/wp-content/uploads/sites/77/2018/05/workspace-hero.jpg";
const NEW_ARRIVAL_IMG =
    "https://growtropicals.com/cdn/shop/files/DSC06940-Edit.jpg?v=1773245220&width=900";
const MINIMALIST_IMG =
    "https://www.houseplant.co.uk/cdn/shop/articles/18239961635024519242_897516d3-2d44-4531-ae3e-dfece1326e06.jpg?v=1759063148&width=1100";

export default function ZenCollectionSection() {
    return (
        <section className="py-10 sm:py-14">
            {/* Header */}
            <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
                <div>
                    <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
                        Bộ Sưu Tập An Nhiên
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 sm:text-base">
                        Những cặp ghép cây cảnh được tuyển chọn cho không gian làm việc hiện đại.
                    </p>
                </div>
                <a
                    href="/collections/an-nhien"
                    className="group hidden shrink-0 items-center gap-1.5 text-sm font-medium text-emerald-800 sm:flex"
                >
                    Xem tất cả
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
            </div>

            {/* Bento grid */}
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3 md:grid-rows-2 md:h-[560px]">
                {/* Deep Focus Bundle — wide hero card */}
                <a
                    href="/collections/deep-focus-bundle"
                    className="group relative min-h-[280px] overflow-hidden rounded-3xl md:col-span-2 md:row-span-1 md:min-h-0"
                >
                    <img
                        src={FOCUS_BUNDLE_IMG}
                        alt="Góc làm việc với cây xanh giúp tập trung"
                        loading="eager"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                    <div className="relative flex h-full flex-col justify-end gap-3 p-6 sm:p-8">
                        <h3 className="text-xl font-semibold text-white sm:text-2xl">
                            Bộ Tập Trung Sâu
                        </h3>
                        <p className="max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
                            Thiết kế giúp giảm cortisol và tăng khả năng tập trung trong những giờ
                            code hoặc sáng tạo kéo dài.
                        </p>
                        <span className="mt-1 inline-flex w-fit items-center rounded-full bg-[#dbe9c9] px-4 py-2 text-sm font-medium text-[#1f3a24] transition-colors group-hover:bg-[#cde0b4]">
                            Mua Bộ Sản Phẩm
                        </span>
                    </div>
                </a>

                {/* New Arrival — tall right column */}
                <a
                    href="/products/fengdesk-grow-light"
                    className="group relative min-h-[280px] overflow-hidden rounded-3xl bg-[#0e1a14] md:col-start-3 md:row-span-2 md:min-h-0"
                >
                    <span className="absolute left-4 top-4 z-10 rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-900 shadow-sm">
                        Mới Ra Mắt
                    </span>
                    <img
                        src={NEW_ARRIVAL_IMG}
                        alt="Đèn trồng cây thông minh FengDesk AI"
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                        <span className="text-sm font-medium text-white">Đèn Trồng Cây AI</span>
                        <ArrowRight className="h-4 w-4 text-white transition-transform group-hover:translate-x-0.5" />
                    </div>
                </a>

                {/* The Minimalist */}
                <a
                    href="/collections/toi-gian"
                    className="group relative min-h-[260px] overflow-hidden rounded-3xl md:col-start-1 md:row-start-2 md:min-h-0"
                >
                    <img
                        src={MINIMALIST_IMG}
                        alt="Sen đá và xương rồng mini phong cách tối giản"
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="relative flex h-full flex-col justify-end gap-2 p-6">
                        <span className="h-px w-8 bg-white/70" />
                        <h3 className="text-lg font-semibold text-white">Tối Giản</h3>
                        <p className="text-sm text-white/80">Ít chăm sóc, hiệu ứng cao.</p>
                    </div>
                </a>

                {/* Personal AI Consult */}
                <a
                    href="/ai-consult"
                    className="group relative flex min-h-[260px] flex-col items-center justify-center rounded-3xl bg-[#173226] p-7 text-center transition-colors hover:bg-[#1c3b2d] md:col-start-2 md:row-start-2 md:min-h-0"
                >
                    <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                        <HelpCircle className="h-6 w-6 text-[#cde0b4]" />
                    </span>
                    <h3 className="text-lg font-semibold text-white">Tư Vấn AI Cá Nhân</h3>
                    <p className="mt-2 max-w-[220px] text-sm leading-relaxed text-white/70">
                        Để AI phân tích ánh sáng và năng lượng không gian, gợi ý cây phù hợp
                        riêng cho bạn.
                    </p>
                    <span className="mt-4 inline-flex items-center rounded-full bg-[#cde0b4] px-4 py-2 text-sm font-medium text-[#1f3a24] transition-colors group-hover:bg-[#bdd49f]">
                        Bắt Đầu Quét
                    </span>
                </a>
            </div>

            {/* Mobile "view all" */}
            <a
                href="/collections/an-nhien"
                className="mt-5 flex items-center justify-center gap-1.5 text-sm font-medium text-emerald-800 sm:hidden"
            >
                Xem tất cả
                <ArrowRight className="h-4 w-4" />
            </a>
        </section>
    );
}