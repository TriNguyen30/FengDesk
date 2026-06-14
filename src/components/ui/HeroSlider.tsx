import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";

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
}

interface HeroSliderProps {
  slides: HeroSlide[];
}

export default function HeroSlider({ slides }: HeroSliderProps) {
  return (
    <Splide
      className="hero-splide mt-3 sm:mt-4"
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
                  {slide.title} <span className="text-green-400">{slide.highlight}</span>
                </h2>

                <p className="mb-1 line-clamp-2 text-xs text-white/80 sm:text-sm">{slide.desc1}</p>
                <p className="mb-4 line-clamp-2 text-xs text-white/80 sm:mb-8 sm:text-sm">
                  {slide.desc2}
                </p>

                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <button
                    type="button"
                    className="min-h-11 w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-primary-dark sm:w-auto sm:min-h-0 sm:px-6"
                  >
                    {slide.primaryBtn}
                  </button>
                  <button
                    type="button"
                    className="min-h-11 w-full rounded-lg border border-white/40 bg-white/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30 sm:w-auto sm:min-h-0 sm:px-6"
                  >
                    {slide.secondaryBtn}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </SplideSlide>
      ))}
    </Splide>
  );
}
