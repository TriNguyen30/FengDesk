import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import Product3DViewer from "@/components/ui/3DSection";
import { useProductList } from "@/features/products/hooks/useProducts";
import type { Product } from "@/features/products/types/product";
import { useAiAssistant } from "@/features/chatbox/hooks/useAiAssistant";

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
 * Ô "New Arrival" hiển thị model 3D của một sản phẩm ngẫu nhiên (xem NewArrivalTile);
 * ba ô còn lại dùng ảnh lifestyle tĩnh.
 */

const FOCUS_BUNDLE_IMG =
  "https://www.invaluable.com/blog/wp-content/uploads/sites/77/2018/05/workspace-hero.jpg";
const NEW_ARRIVAL_IMG =
  "https://growtropicals.com/cdn/shop/files/DSC06940-Edit.jpg?v=1773245220&width=900";
const MINIMALIST_IMG =
  "https://www.houseplant.co.uk/cdn/shop/articles/18239961635024519242_897516d3-2d44-4531-ae3e-dfece1326e06.jpg?v=1759063148&width=1100";

export default function ZenCollectionSection() {
  const { t } = useTranslation();
  const { open: openAiAssistant } = useAiAssistant();

  return (
    <section className="py-5">
      {/* Bento grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3 md:grid-rows-2 md:h-[560px]">
        {/* Deep Focus Bundle — wide hero card. Mộc = cây xanh/sinh khí, hành hợp với "tập trung sâu". */}
        <Link
          to="/products?element=Moc"
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
              {t("image_collections.deep_focus.title")}
            </h3>
            <p className="max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
              {t("image_collections.deep_focus.desc")}
            </p>
            <span className="mt-1 inline-flex w-fit items-center rounded-full bg-[#dbe9c9] px-4 py-2 text-sm font-medium text-[#1f3a24] transition-colors group-hover:bg-[#cde0b4]">
              {t("image_collections.deep_focus.btn")}
            </span>
          </div>
        </Link>

        {/* New Arrival — tall right column, model 3D ngẫu nhiên */}
        <NewArrivalTile />

        {/* The Minimalist — Kim: kim loại/gốm sứ, tạo hình gọn gàng đúng tinh thần tối giản. */}
        <Link
          to="/products?element=Kim"
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
            <h3 className="text-lg font-semibold text-white">
              {t("image_collections.minimalist.title")}
            </h3>
            <p className="text-sm text-white/80">{t("image_collections.minimalist.desc")}</p>
          </div>
        </Link>

        {/* Personal AI Consult — mở drawer trợ lý AI (cùng nút Bot trên Navbar). */}
        <button
          type="button"
          onClick={openAiAssistant}
          className="group relative flex min-h-[260px] flex-col items-center justify-center rounded-3xl bg-[#173226] p-7 text-center transition-colors hover:bg-[#1c3b2d] cursor-pointer md:col-start-2 md:row-start-2 md:min-h-0"
        >
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <HelpCircle className="h-6 w-6 text-[#cde0b4]" />
          </span>
          <h3 className="text-lg font-semibold text-white">
            {t("image_collections.ai_consult.title")}
          </h3>
          <p className="mt-2 max-w-[220px] text-sm leading-relaxed text-white/70">
            {t("image_collections.ai_consult.desc")}
          </p>
          <span className="mt-4 inline-flex items-center rounded-full bg-[#cde0b4] px-4 py-2 text-sm font-medium text-[#1f3a24] transition-colors group-hover:bg-[#bdd49f]">
            {t("image_collections.ai_consult.btn")}
          </span>
        </button>
      </div>

      {/* Mobile "view all" */}
      <Link
        to="/products"
        className="mt-5 flex items-center justify-center gap-1.5 text-sm font-medium text-emerald-800 sm:hidden"
      >
        {t("image_collections.view_all")}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

/** Khung ô "Mới Ra Mắt" — dùng chung cho cả nhánh có model 3D lẫn nhánh ảnh tĩnh. */
const ARRIVAL_TILE_CLASS =
  "group relative min-h-[280px] overflow-hidden rounded-3xl bg-[#0e1a14] md:col-start-3 md:row-span-2 md:min-h-0";

/**
 * Thanh tên ở đáy ô, kèm lớp gradient làm nền cho chữ.
 * `to` chỉ truyền khi bản thân thanh này phải là liên kết (ô 3D không bọc <Link> ở ngoài, vì thẻ
 * <a> bao quanh sẽ nuốt thao tác kéo-xoay model).
 */
function ArrivalNameBar({ label, to }: { label: string; to?: string }) {
  const barClass =
    "absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between gap-3 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm transition-colors hover:bg-white/20";
  const content = (
    <>
      <span className="truncate text-sm font-medium text-white">{label}</span>
      <ArrowRight className="h-4 w-4 shrink-0 text-white transition-transform group-hover:translate-x-0.5" />
    </>
  );

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      {to ? (
        <Link to={to} className={barClass}>
          {content}
        </Link>
      ) : (
        <div className={barClass}>{content}</div>
      )}
    </>
  );
}

/**
 * Ô "Mới Ra Mắt": bốc NGẪU NHIÊN một sản phẩm có model 3D xem được.
 * Chưa có sản phẩm nào (hoặc đang tải) thì rơi về ảnh tĩnh + tiêu đề mặc định.
 */
function NewArrivalTile() {
  const { t } = useTranslation();
  const { products, loading } = useProductList({ hasModel3D: true, pageSize: 20 });

  // Math.random() không phải hàm thuần nên không được gọi thẳng trong useMemo — React có quyền chạy
  // lại và đổi kết quả giữa chừng. Bốc số đúng một lần lúc mount rồi chỉ quy ra chỉ số.
  const [seed] = useState(Math.random);

  const featured = useMemo(() => {
    const withModel = products.filter((p) => p.model3DUrl);
    if (withModel.length === 0) return undefined;
    return withModel[Math.floor(seed * withModel.length)];
  }, [products, seed]);

  if (featured) {
    // key theo id: đổi sản phẩm là dựng lại ô từ đầu, khỏi phải reset thủ công chuỗi hiệu ứng.
    return <ArrivalModelTile key={featured.id} product={featured} />;
  }

  return (
    <Link to="/products" className={ARRIVAL_TILE_CLASS}>
      <span className="absolute left-4 top-4 z-30 rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-900 shadow-sm">
        {t("image_collections.new_arrival.badge")}
      </span>
      <img
        src={NEW_ARRIVAL_IMG}
        alt={t("image_collections.new_arrival.title")}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <ArrivalNameBar
        label={
          loading
            ? t("image_collections.new_arrival.loading")
            : t("image_collections.new_arrival.title")
        }
      />
    </Link>
  );
}

/**
 * Ô có model 3D thật. Ảnh sản phẩm luôn nằm dưới làm lớp nền an toàn: model chỉ được lộ ra sau khi
 * đã vẽ được pixel, và quay lại ảnh nếu GLB hỏng / WebGL context bị thu hồi — nhờ vậy ô không bao
 * giờ rơi vào trạng thái trắng rỗng.
 * Cả ô là link sang trang sản phẩm; riêng công tắc 3D chặn sự kiện để không kéo theo điều hướng.
 */
/** Chờ hero + Ngũ Hành chạy xong hiệu ứng vào trang trước khi xin nhịp rảnh để dựng WebGL. */
const AUTO_REVEAL_DELAY_MS = 1400;

/**
 * Cờ ở tầm module (không phải state): 3D chỉ tự bật MỘT lần cho mỗi lần tải trang. Điều hướng
 * trong SPA rồi quay lại trang chủ sẽ remount ô này, nhưng cờ vẫn còn nên không loang lại từ đầu;
 * chỉ khi F5 (module nạp lại) mới chạy lượt mới.
 */
let autoRevealDone = false;

function ArrivalModelTile({ product }: { product: Product }) {
  const { t } = useTranslation();

  /**
   * "poster"  — đang hiện ảnh 2D (chưa vẽ được model, hoặc người dùng đã tắt 3D).
   * "reveal"  — model đã có pixel: giọt nước loang ra, ảnh nằm dưới.
   * "model"   — loang xong, gỡ ảnh khỏi DOM.
   * "hiding"  — người dùng tắt 3D: loang ngược, thu về tâm rồi trả lại ảnh.
   * "failed"  — GLB hỏng hoặc mất WebGL context: ở lại ảnh vĩnh viễn.
   */
  const [phase, setPhase] = useState<"poster" | "reveal" | "model" | "hiding" | "failed">("poster");
  // Tách khỏi phase: lúc đang loang ngược thì công tắc đã tắt nhưng viewer vẫn phải còn sống.
  // Mở trang ở 2D: dựng WebGL ngay lúc trang đang tải làm nặng thêm đúng lúc bận nhất.
  const [enabled, setEnabled] = useState(autoRevealDone);

  // Tự bật 3D một lần cho mỗi lần tải trang, sau khi phần còn lại của trang đã lắng.
  useEffect(() => {
    if (autoRevealDone) return;

    let idleHandle: number | undefined;
    // Chờ tối thiểu để hero + Ngũ Hành chạy xong hiệu ứng vào trang, rồi mới xin một nhịp rảnh.
    const delayHandle = window.setTimeout(() => {
      const start = () => {
        autoRevealDone = true;
        setEnabled(true);
        setPhase("poster");
      };
      // requestIdleCallback: chỉ dựng WebGL khi main thread thật sự rảnh; timeout để máy yếu
      // (không bao giờ rảnh) vẫn bật được thay vì kẹt mãi ở 2D.
      idleHandle = window.requestIdleCallback
        ? window.requestIdleCallback(start, { timeout: 1200 })
        : window.setTimeout(start, 300);
    }, AUTO_REVEAL_DELAY_MS);

    return () => {
      window.clearTimeout(delayHandle);
      if (idleHandle === undefined) return;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idleHandle);
      else window.clearTimeout(idleHandle);
    };
  }, []);

  const handleReady = useCallback(() => {
    setPhase((current) => (current === "poster" ? "reveal" : current));
  }, []);

  const handleUnavailable = useCallback(() => setPhase("failed"), []);

  /** Kết thúc một lượt loang: xuôi thì gỡ ảnh, ngược thì gỡ hẳn viewer. */
  const handleRevealEnd = useCallback((event: React.AnimationEvent<HTMLDivElement>) => {
    // Bỏ qua animation nổi lên từ phần tử con bên trong viewer.
    if (event.target !== event.currentTarget) return;
    setPhase((current) => {
      if (current === "reveal") return "model";
      if (current === "hiding") return "poster";
      return current;
    });
  }, []);

  // Đang loang (xuôi hoặc ngược) thì khoá nút: bấm giữa lượt sẽ đổi class animation ngay giữa chừng,
  // vòng tròn nhảy về đầu và trông giật cục.
  const busy = phase === "reveal" || phase === "hiding";

  // Trạng thái NHÌN THẤY của nút phải bám theo thứ đang hiện trên ô, không phải theo mỗi cờ enabled:
  // khi model hỏng (phase "failed") ô rơi về ảnh 2D nên nút cũng phải xám, nếu không người dùng
  // thấy nút xanh mà ô lại 2D và phải bấm thừa một lần cho hai bên khớp nhau.
  const active = enabled && phase !== "failed";

  const toggle3D = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    if (active) {
      setEnabled(false);
      // Chỉ loang ngược khi model đang thực sự hiện; còn ở ảnh thì tắt luôn cho gọn.
      setPhase((current) => (current === "model" || current === "reveal" ? "hiding" : "poster"));
    } else {
      // Từ "failed" thì đây là lượt thử lại: dựng lại viewer từ đầu.
      setEnabled(true);
      setPhase("poster");
    }
  };

  const posterUrl = product.primaryImageUrl || product.model3DThumbnailUrl || NEW_ARRIVAL_IMG;
  // Viewer sống khi 3D đang bật, hoặc khi vừa tắt và còn đang loang ngược.
  const showViewer = phase !== "failed" && (enabled || phase === "hiding");
  const showPoster = phase !== "model";
  const rippleClass =
    phase === "reveal" ? "fd-arrival-ripple" : phase === "hiding" ? "fd-arrival-ripple-in" : "";
  const modelAnimClass =
    phase === "poster"
      ? "opacity-0"
      : phase === "reveal"
        ? "fd-arrival-model-in"
        : phase === "hiding"
          ? "fd-arrival-model-out"
          : "";
  const toggleLabel = t("image_collections.new_arrival.toggle_3d");

  return (
    // CỐ Ý là <div> chứ không phải <Link> bọc cả ô: vùng 3D nằm trong thẻ <a> thì thao tác kéo bị
    // trình duyệt hiểu là kéo-thả liên kết, OrbitControls không xoay được. Link chỉ đặt ở thanh tên.
    <div className={ARRIVAL_TILE_CLASS}>
      <style>{RIPPLE_REVEAL_CSS}</style>

      {/* Badge "Mới Ra Mắt" + nút 3D dính liền bên phải; tắt thì nút chuyển xám.
          Lúc đang loang, nút trượt sang trái nấp sau viên pill trắng (z thấp hơn) — vừa báo "chưa
          bấm được", vừa tự đẩy ra lại khi xong nên không cần thêm chỉ báo loading nào khác. */}
      <div className="absolute left-4 top-4 z-30 flex items-center">
        <span className="relative z-10 rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-900 shadow-sm">
          {t("image_collections.new_arrival.badge")}
        </span>
        <button
          type="button"
          aria-pressed={active}
          aria-label={toggleLabel}
          title={toggleLabel}
          disabled={busy}
          onClick={toggle3D}
          // Tailwind v4 đặt -translate-x-full qua thuộc tính CSS `translate` (không phải `transform`),
          // nên phải transition đúng `translate` — transition `transform` sẽ không chạy, nút biến mất
          // rồi hiện lại chứ không thò thụt.
          // -translate-x-9 (36px) thay vì -translate-x-full (45px): nút chỉ nhô ra khỏi viên pill
          // 33px, dịch đúng chừng đó thì gần như cả quãng đường đều nhìn thấy được. Đường cong
          // đối xứng để nhịp thò/thụt đều, không dồn hết vào đoạn đầu.
          className={`-ml-3 rounded-r-full py-1 pl-4 pr-3 text-xs font-bold tracking-wide text-white transition-[translate,background-color,box-shadow] duration-[350ms] ease-[cubic-bezier(.45,.05,.55,.95)] ${
            busy ? "-translate-x-9 cursor-default shadow-none" : "cursor-pointer shadow-sm"
          } ${active ? "bg-primary hover:bg-primary-dark" : "bg-neutral-400 hover:bg-neutral-500"}`}
        >
          3D
        </button>
      </div>

      {/* Ảnh sản phẩm giữ nguyên tại chỗ tới khi model thật sự vẽ được — không có khoảng trắng ở giữa.
          Lúc loang ngược ảnh đứng yên ở opacity 1, vòng tròn model co lại để lộ dần nó ra. */}
      {showPoster && (
        <img
          src={posterUrl}
          alt={product.name}
          draggable={false}
          loading="eager"
          className={`absolute inset-0 h-full w-full object-cover ${
            phase === "reveal" ? "fd-arrival-poster-out" : ""
          }`}
        />
      )}

      {showViewer && (
        <div onAnimationEnd={handleRevealEnd} className={`absolute inset-0 ${modelAnimClass}`}>
          <Product3DViewer
            modelUrl={product.model3DUrl!}
            thumbnailUrl={product.model3DThumbnailUrl}
            backgroundImageUrl={product.primaryImageUrl}
            showHint={false}
            onModelReady={handleReady}
            onModelUnavailable={handleUnavailable}
          />
        </div>
      )}

      {/* Vòng sóng nước: lan ra khi lộ model, thu vào tâm khi tắt 3D. */}
      {rippleClass && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
          <span className={rippleClass} />
          <span className={`${rippleClass} fd-arrival-ripple--delayed`} />
        </div>
      )}

      <ArrivalNameBar label={product.name} to={`/products/${product.id}`} />
    </div>
  );
}

const RIPPLE_REVEAL_CSS = `
@keyframes fd-arrival-model-in {
  from { clip-path: circle(0% at 50% 45%); opacity: .45; }
  45%  { opacity: 1; }
  /* 120%: đủ phủ kín ô ở mọi tỉ lệ khung (bán kính % của circle() tính theo nửa đường chéo). */
  to   { clip-path: circle(120% at 50% 45%); opacity: 1; }
}
@keyframes fd-arrival-poster-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}
@keyframes fd-arrival-model-out {
  from { clip-path: circle(120% at 50% 45%); opacity: 1; }
  55%  { opacity: 1; }
  to   { clip-path: circle(0% at 50% 45%); opacity: .45; }
}
@keyframes fd-arrival-ripple {
  from { transform: scale(.12); opacity: .6; border-width: 3px; }
  to   { transform: scale(2.2); opacity: 0; border-width: 1px; }
}
@keyframes fd-arrival-ripple-in {
  from { transform: scale(2.2); opacity: 0; border-width: 1px; }
  35%  { opacity: .6; }
  to   { transform: scale(.1); opacity: 0; border-width: 3px; }
}
/* Đường cong dịu, gần đều ở đoạn giữa: easeOut gắt làm vòng loang xong trong 0.3s rồi đứng im. */
.fd-arrival-model-in {
  animation: fd-arrival-model-in .9s cubic-bezier(.45,.05,.35,1) both;
}
.fd-arrival-model-out {
  animation: fd-arrival-model-out .75s cubic-bezier(.45,.05,.35,1) both;
}
.fd-arrival-poster-out {
  animation: fd-arrival-poster-out .9s cubic-bezier(.45,.05,.35,1) both;
}
.fd-arrival-ripple, .fd-arrival-ripple-in {
  grid-area: 1 / 1;
  width: 60%;
  aspect-ratio: 1;
  border-radius: 9999px;
  border: 3px solid rgba(255,255,255,.75);
}
.fd-arrival-ripple    { animation: fd-arrival-ripple 1s cubic-bezier(.35,.1,.3,1) both; }
.fd-arrival-ripple-in { animation: fd-arrival-ripple-in .8s cubic-bezier(.35,.1,.3,1) both; }
.fd-arrival-ripple--delayed { animation-delay: .16s; }
@media (prefers-reduced-motion: reduce) {
  .fd-arrival-model-in, .fd-arrival-model-out, .fd-arrival-poster-out { animation-duration: .01ms; }
  .fd-arrival-ripple, .fd-arrival-ripple-in { display: none; }
}
`;
