import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";
import { Link } from "react-router-dom";

export interface HeroSlide {
  id: number;
  badge: string;
  title: string;
  highlight: string;
  desc1: string;
  desc2: string;
  image: string;
  primaryBtn: string;
  secondaryBtn: string;
  /** Đích của nút chính. Bỏ trống khi dùng onPrimaryClick (vd mở trợ lý AI). */
  primaryTo?: string;
  /** Hành động của nút chính thay cho điều hướng — ưu tiên hơn primaryTo. */
  onPrimaryClick?: () => void;
  secondaryTo: string;
}

interface HeroSliderProps {
  slides: HeroSlide[];
}

// Nút chính có thể là <button> (mở drawer AI) hoặc <Link> (điều hướng) → tách class ra dùng chung.
const PRIMARY_BTN_CLASS =
  "inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-primary-dark cursor-pointer sm:w-auto sm:min-h-0 sm:px-6";

const SECONDARY_BTN_CLASS =
  "inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-white/40 bg-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30 cursor-pointer sm:w-auto sm:min-h-0 sm:px-6";

export default function HeroSlider({ slides }: HeroSliderProps) {
  return (
    <Splide
      className="hero-splide"
      options={{
        type: "fade",
        rewind: true,
        autoplay: true,
        interval: 4000,
        pauseOnHover: true,
        arrows: true,
        pagination: true,
        speed: 800,
      }}
      aria-label="Hero Banner"
    >
      {slides.map((slide) => (
        <SplideSlide key={slide.id}>
          <div className="relative min-h-[220px] w-full overflow-hidden rounded-lg sm:min-h-[300px] sm:rounded-xl md:min-h-[380px]">
            {/* Full-size background image */}
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Dark overlay with low opacity */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Content — sits above image + overlay */}
            <div className="relative z-10 flex min-h-[220px] items-center px-4 py-8 sm:min-h-[300px] sm:px-10 sm:py-12 md:min-h-[380px] md:px-16 lg:px-20 lg:py-14">
              <div className="max-w-lg">
                {/* Badge */}
                <span className="mb-3 inline-block rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white sm:mb-4 sm:px-3 sm:text-xs">
                  {slide.badge}
                </span>

                <h2 className="mb-2 text-2xl font-black leading-tight text-white drop-shadow-md sm:mb-3 sm:text-4xl md:text-5xl">
                  {slide.title} <span className="text-primary-light">{slide.highlight}</span>
                </h2>

                <p className="mb-1 line-clamp-2 text-xs text-white/80 sm:text-sm">{slide.desc1}</p>
                <p className="mb-4 line-clamp-2 text-xs text-white/80 sm:mb-8 sm:text-sm">
                  {slide.desc2}
                </p>

                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                  {slide.onPrimaryClick ? (
                    <button
                      type="button"
                      onClick={slide.onPrimaryClick}
                      className={PRIMARY_BTN_CLASS}
                    >
                      {slide.primaryBtn}
                    </button>
                  ) : (
                    <Link to={slide.primaryTo ?? "/products"} className={PRIMARY_BTN_CLASS}>
                      {slide.primaryBtn}
                    </Link>
                  )}
                  <Link to={slide.secondaryTo} className={SECONDARY_BTN_CLASS}>
                    {slide.secondaryBtn}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </SplideSlide>
      ))}
    </Splide>
  );
}
