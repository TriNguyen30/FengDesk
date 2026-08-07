import { useEffect, useRef, useState } from "react";
import { FluidSolver } from "@/utils/asciiFluid";
import { useEffectSettings } from "@/utils/appearance";

/** Số mảng mây — mỗi mảng là một class .fd-cloud-N trong index.css. */
const CLOUD_LAYERS = [1, 2, 3, 4, 5, 6];

/** Kích thước một ô lưới (px CSS) — ô càng lớn thì càng ít ký tự phải vẽ. */
const CELL_SIZE = 15;
/** Cỡ chữ so với ô lưới; quá 0.9 là các ký tự bắt đầu dính nhau. */
const GLYPH_SCALE = 1;
/** Bậc đậm nhạt: nhạt → đậm. */
const RAMP = ["-", "·", "+", "*"] as const;
/** Ngưỡng mật độ tương ứng từng ký tự trong RAMP. */
const RAMP_STOPS = [0.05, 0.14, 0.32, 0.6] as const;
/** Số mức alpha rời rạc — gom nét vẽ theo mức để đổi fillStyle ít lần nhất. */
const ALPHA_STEPS = 5;
const MIN_ALPHA = 0.44;
const MAX_ALPHA = 0.68;

/** Phần vận tốc / mật độ còn lại sau mỗi giây (dùng luỹ thừa theo dt). */
const VELOCITY_RETENTION = 0.5;
/**
 * Mực tiêu tán theo độ đậm chứ không đồng loạt: ô nhạt (ký tự "·") giữ lại
 * nhiều nên sống dai, ô đậm (ký tự "*") tan nhanh hơn. Ô có độ đậm ở giữa thì
 * nội suy tuyến tính giữa hai mốc này.
 */
const DENSITY_RETENTION_FAINT = 0.52;
const DENSITY_RETENTION_DENSE = 0.1;

const POINTER_MAX_SPEED = 55; // ô/giây
const POINTER_FORCE_GAIN = 1;
const SPLAT_RADIUS = 1.3;


/** Click → vòng lực toả tròn: số nhánh và tốc độ bắn ra (ô/giây). */
const BURST_ARMS = 26;
const BURST_SPEED = 56;
/**
 * Cụm fluid trôi nổi ngẫu nhiên. Khác vệt chuột ở chỗ mực được bơm DẦN theo
 * bao hình attack → hold → release thay vì đổ một lần, cộng vận tốc gần bằng 0
 * nên cụm hiện lên nhẹ nhàng và tan chậm thay vì bị kéo thành vệt.
 */
const DRIFT_RADIUS = [2.8, 4] as const; // ô lưới (vệt chuột chỉ ~2.2)
const DRIFT_ATTACK = [0.8, 1.8] as const; // giây hiện dần
const DRIFT_HOLD = [0.0, 0.0] as const; // giây giữ nguyên độ đậm
const DRIFT_RELEASE = [2.8, 3.4] as const; // giây ngừng bơm để tự tan
const DRIFT_SPEED = 13; // ô/giây — chỉ đủ để cụm lững lờ trôi
/**
 * Mực bơm mỗi giây ở đỉnh bao hình. Vì tâm cụm là vùng đậm nên nó tiêu tán theo
 * DENSITY_RETENTION_DENSE: mật độ cân bằng ≈ FEED / |ln(DENSITY_RETENTION_DENSE)|,
 * và luôn bị chặn ở trần cứng 1.6 trong FluidSolver.splat().
 */
const DRIFT_FEED = 6.2;
/** Số cụm sống đồng thời ứng với 1 bậc cường độ (bậc 0 = tắt hẳn). */
const DRIFT_PUFFS_PER_LEVEL = 4;

/**
 * Chế độ "chừa dải": cho fluid vẽ lấn thêm bấy nhiêu ô vào TRONG dải nội dung.
 *
 * Cắt đúng mép thì thấy rõ một đường biên thẳng tắp — mắt đọc ra ngay là bị xén.
 * Lấn vào vài ô, dưới lớp đục 78% của dải, thì phần lấn chỉ còn mờ mờ và trông
 * như fluid chui xuống dưới dải.
 */
const RAIL_BLEED_CELLS = 0;

type Rgb = [number, number, number];

type DriftPuff = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  age: number;
  attack: number;
  hold: number;
  release: number;
};

const FALLBACK_INK: Rgb = [125, 143, 105];
const FALLBACK_TINT: Rgb = [166, 138, 100];

function readThemeColor(variable: string, fallback: Rgb): Rgb {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();

  if (/^#[0-9a-f]{6}$/i.test(raw)) {
    return [
      parseInt(raw.slice(1, 3), 16),
      parseInt(raw.slice(3, 5), 16),
      parseInt(raw.slice(5, 7), 16),
    ];
  }

  const rgb = raw.match(/\d+(\.\d+)?/g);

  if (rgb && rgb.length >= 3) {
    return [Number(rgb[0]), Number(rgb[1]), Number(rgb[2])];
  }

  return fallback;
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/**
 * Nền động: các mảng mây trôi chậm (CSS) + một lớp fluid vẽ bằng ký tự ASCII.
 *
 * Vệt bám theo chuột chỉ bật sau cú click đầu tiên; các cú "nhảy" ngẫu nhiên
 * chạy độc lập theo cường độ cài trong Hồ sơ (0 = tắt).
 *
 * Cố tình không dùng WebGL: mô phỏng chạy trên lưới thô và mỗi frame chỉ vẽ
 * những ô còn "mực", nên tải render thấp hơn hẳn so với màn khói full-screen —
 * đồng thời ký tự thưa cũng đỡ chói mắt hơn nền mờ đặc.
 */
export default function AsciiFluidBackground({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const railRef = useRef<HTMLSpanElement | null>(null);
  const [fluidEnabled, setFluidEnabled] = useState(false);
  const { fluidFps, fluidDrift, fluidRail, cloudMode, railSurface } = useEffectSettings();

  // Đọc qua ref để đổi thông số không phải dựng lại toàn bộ mô phỏng.
  const knobs = useRef({ fluidFps, fluidDrift, fluidRail });

  useEffect(() => {
    knobs.current = { fluidFps, fluidDrift, fluidRail };
  }, [fluidFps, fluidDrift, fluidRail]);

  // Chỉ bật mô phỏng khi có chuột thật và người dùng không yêu cầu giảm chuyển động.
  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => setFluidEnabled(finePointer.matches && !reduceMotion.matches);

    sync();
    finePointer.addEventListener("change", sync);
    reduceMotion.addEventListener("change", sync);

    return () => {
      finePointer.removeEventListener("change", sync);
      reduceMotion.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!fluidEnabled || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });

    if (!ctx) return;

    let solver = new FluidSolver(1, 1);
    let cellPx = CELL_SIZE;
    let cssWidth = window.innerWidth;
    let cssHeight = window.innerHeight;
    let inkColors: string[][] = [];

    const buckets: number[][] = Array.from(
      { length: RAMP.length * ALPHA_STEPS },
      () => [] as number[],
    );

    const pointer = { x: 0, y: 0, prevX: 0, prevY: 0, seen: false, idle: 0 };
    /** Vệt bám chuột: mặc định tắt, bật/tắt bằng cách bấm ra ngoài dải nội dung. */
    let trailActive = false;

    const puffs: DriftPuff[] = [];
    let spawnTimer = 0.3;

    /** Số ô đã vẽ ở lượt render gần nhất — 0 nghĩa là màn hình đang trống. */
    let painted = 0;
    /** Vòng lặp đang ngủ: không step, không render, không clearRect. */
    let idle = false;

    // ── Hình dạng lưới (do layoutGrid dựng) ──────────────────────────────────
    /** Số cột thuộc lề TRÁI ở chế độ nối mép; 0 = lưới trải đều cả màn. */
    let leftCols = 0;
    /** x trên màn của cột đầu tiên thuộc lề phải (chế độ nối mép). */
    let rightOriginX = 0;
    /** Khoảng cột bị dải nội dung che — bỏ vẽ (chế độ cắt vẽ). */
    let hiddenFrom = Number.POSITIVE_INFINITY;
    let hiddenTo = Number.NEGATIVE_INFINITY;
    /** Các dải màn hình thực sự có thể thấy fluid: [x, width][]. */
    let bands: Array<[number, number]> = [[0, window.innerWidth]];

    /** Bảng màu: mực nhạt ngả nâu ấm, mực đậm ngả xanh sage của brand. */
    const buildPalette = () => {
      const ink = readThemeColor("--color-primary-dark", FALLBACK_INK);
      const tint = readThemeColor("--color-secondary", FALLBACK_TINT);

      inkColors = RAMP.map((_, tier) => {
        const [r, g, b] = mix(tint, ink, RAMP.length > 1 ? tier / (RAMP.length - 1) : 1);

        return Array.from({ length: ALPHA_STEPS }, (_, level) => {
          const alpha = MIN_ALPHA + ((MAX_ALPHA - MIN_ALPHA) * (level + 1)) / ALPHA_STEPS;

          return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
        });
      });
    };

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      cssWidth = width;
      cssHeight = height;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      cellPx = width < 768 ? CELL_SIZE * 1.25 : CELL_SIZE;

      layoutGrid(width, height);

      // Lưới mới hoàn toàn trống — để vòng lặp tự đánh giá lại thay vì kẹt ở
      // trạng thái ngủ/thức của kích thước cũ.
      painted = 0;
      idle = false;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${Math.round(cellPx * GLYPH_SCALE)}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    };

    /**
     * Dựng lưới và bảng ánh xạ cột ↔ toạ độ màn hình.
     *
     * Ba hình dạng, tuỳ dải nội dung (.fd-rail) đang che gì:
     *
     * - **Đầy** — dải trong suốt (rail = none) hoặc màn hẹp hơn 80rem nên không
     *   còn lề. Lưới phủ kín màn, vẽ hết.
     * - **Cắt vẽ** — dải đục màu che khuất phần giữa. Vẫn MÔ PHỎNG toàn lưới
     *   (mực phải chảy từ lề này luồn dưới dải sang lề kia đúng như cũ), chỉ bỏ
     *   phần VẼ và thu clearRect về hai dải lề.
     * - **Nối mép (teleport)** — bỏ hẳn phần giữa khỏi lưới, cột cuối của lề
     *   trái nằm ngay cạnh cột đầu của lề phải. Không cần đụng gì vào
     *   FluidSolver: chỉ là một lưới hẹp hơn, hiệu ứng "hất sóng bên trái thì
     *   bên phải bật ra" tự nảy sinh từ chính hình dạng lưới.
     */
    const layoutGrid = (width: number, height: number) => {
      const rows = Math.max(8, Math.ceil(height / cellPx) + 2);
      const rail = railRef.current?.getBoundingClientRect();
      const mode = knobs.current.fluidRail;

      // Lề hẹp hơn 3 ô (màn nhỏ hơn 80rem) thì cắt/nối chỉ tổ méo hình mà chẳng
      // tiết kiệm được gì — rơi về lưới đầy.
      const usableRail = rail && rail.left >= cellPx * 3 && width - rail.right >= cellPx * 3;

      if (!usableRail || mode === "full") {
        leftCols = 0;
        hiddenFrom = Number.POSITIVE_INFINITY;
        hiddenTo = Number.NEGATIVE_INFINITY;
        bands = [[0, width]];
        solver = new FluidSolver(Math.max(8, Math.ceil(width / cellPx) + 2), rows);

        return;
      }

      rightOriginX = rail.right;

      if (mode === "stitch") {
        leftCols = Math.max(1, Math.ceil(rail.left / cellPx));
        hiddenFrom = Number.POSITIVE_INFINITY;
        hiddenTo = Number.NEGATIVE_INFINITY;
        // Nới mỗi dải ra một ô: ký tự vẽ theo TÂM ô nên nét của cột ngoài cùng
        // tràn ra khoảng nửa ô. Không nới thì phần tràn nằm ngoài vùng clearRect
        // và không bao giờ được xoá — để lại một vệt bẩn dọc mép dải.
        setBands(width, rail.left + cellPx, rail.right - cellPx);
        solver = new FluidSolver(
          leftCols + Math.max(1, Math.ceil((width - rail.right) / cellPx)) + 2,
          rows,
        );

        return;
      }

      // Cắt vẽ: lưới vẫn đầy, chỉ đánh dấu khoảng cột bị dải che.
      //
      // Ô thứ `col` vẽ ở tâm `(col - 0.5) * cellPx`, nên ô đầu tiên nằm TRỌN
      // trong dải là ô đầu tiên có tâm vượt qua mép — ceil(mép/cellPx + 0.5).
      // Công thức cũ (floor + 1) làm tròn ngược nên giấu thừa một cột, để lại
      // khe trống thấy rõ giữa fluid và mép dải.
      //
      // Rồi cho ăn thêm RAIL_BLEED_CELLS ô vào TRONG dải: dải chỉ đục 78% nên
      // phần lấn vào chỉ còn mờ mờ, và mắt đọc ra là fluid chui xuống dưới dải
      // chứ không phải bị cắt cụt ở mép.
      leftCols = 0;
      hiddenFrom = Math.ceil(rail.left / cellPx + 0.5) + RAIL_BLEED_CELLS;
      hiddenTo = Math.floor(rail.right / cellPx + 0.5) - RAIL_BLEED_CELLS;

      const bleed = (RAIL_BLEED_CELLS + 1) * cellPx;

      setBands(width, rail.left + bleed, rail.right - bleed);
      solver = new FluidSolver(Math.max(8, Math.ceil(width / cellPx) + 2), rows);
    };

    /** Hai dải lề cần xoá mỗi khung hình, cắt tại `leftEdge` / `rightEdge`. */
    const setBands = (width: number, leftEdge: number, rightEdge: number) => {
      bands = [
        [0, leftEdge],
        [rightEdge, width - rightEdge],
      ];
    };

    /** Tâm ô (cột lưới) → x trên màn, px CSS. */
    const colToX = (col: number) =>
      leftCols > 0 && col > leftCols
        ? rightOriginX + (col - leftCols - 0.5) * cellPx
        : (col - 0.5) * cellPx;

    /** x trên màn → cột lưới (số thực). Nghịch đảo của colToX. */
    const xToCol = (px: number) =>
      leftCols > 0 && px >= rightOriginX
        ? (px - rightOriginX) / cellPx + leftCols + 0.5
        : px / cellPx + 0.5;

    const onPointerMove = (event: PointerEvent) => {
      // Ô lưới thứ 1 nằm ở tâm px 0.5*cellPx (viền lưới rộng hơn màn hình 1 ô mỗi bên).
      pointer.x = xToCol(event.clientX);
      pointer.y = event.clientY / cellPx + 0.5;
      pointer.idle = 0;

      if (!pointer.seen) {
        pointer.prevX = pointer.x;
        pointer.prevY = pointer.y;
        pointer.seen = true;
      }
    };

    /** Vòng lực toả đều ra mọi hướng — dùng cho cú click và cho các cú "nhảy". */
    const burst = (cx: number, cy: number, power: number) => {
      const offset = Math.random() * Math.PI * 2;

      solver.splat(cx, cy, 0, 0, 0.5 * power, SPLAT_RADIUS * 1.5 * power);

      for (let k = 0; k < BURST_ARMS; k++) {
        const angle = offset + (k / BURST_ARMS) * Math.PI * 2;
        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle);
        const reach = SPLAT_RADIUS * 1.1 * power;

        solver.splat(
          cx + dirX * reach,
          cy + dirY * reach,
          dirX * BURST_SPEED * power,
          dirY * BURST_SPEED * power,
          0.34 * power,
          SPLAT_RADIUS * power,
        );
      }
    };

    /** Chỉ tính vùng lề hai bên dải nội dung — bấm vào nội dung thì bỏ qua. */
    const isOutsideRail = (clientX: number) => {
      const rail = railRef.current;

      if (!rail) return false;

      const rect = rail.getBoundingClientRect();

      return clientX < rect.left || clientX > rect.right;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!isOutsideRail(event.clientX)) return;

      onPointerMove(event);
      trailActive = !trailActive;

      if (trailActive) burst(pointer.x, pointer.y, 1.35);
    };

    /**
     * Rải vệt mực dọc quãng chuột đã đi trong frame để nét không bị đứt.
     * Trả về true nếu có bơm mực — vòng lặp dùng để biết khi nào được phép ngủ.
     */
    const emitFromPointer = (dt: number) => {
      if (!pointer.seen) return false;

      const dx = pointer.x - pointer.prevX;
      const dy = pointer.y - pointer.prevY;
      const distance = Math.hypot(dx, dy);

      // Vẫn cập nhật vị trí trước khi thoát, để lúc kích hoạt không vẽ vệt nhảy cóc.
      pointer.prevX = pointer.x;
      pointer.prevY = pointer.y;

      if (!trailActive || distance < 0.02) return false;

      const speed = Math.min(distance / dt, POINTER_MAX_SPEED);
      const steps = Math.min(10, Math.ceil(distance / 0.7));
      const fx = (dx / distance) * speed * POINTER_FORCE_GAIN;
      const fy = (dy / distance) * speed * POINTER_FORCE_GAIN;
      // Lượng mực tính theo từng điểm rải (không chia đều) → vệt dài vẫn đậm như vệt ngắn.
      const amount = Math.min(0.34, 0.14 + speed * 0.004);

      for (let s = 1; s <= steps; s++) {
        const t = s / steps;

        solver.splat(
          pointer.prevX - dx * (1 - t),
          pointer.prevY - dy * (1 - t),
          fx,
          fy,
          amount,
          SPLAT_RADIUS,
        );
      }

      return true;
    };

    /** Nội suy ngẫu nhiên trong khoảng [min, max]. */
    const between = (range: readonly [number, number]) =>
      range[0] + Math.random() * (range[1] - range[0]);

    /**
     * Cột sinh cụm mới. Ở chế độ cắt vẽ thì tránh dải bị che — cụm sinh ra ở đó
     * vẫn tốn công mô phỏng mà không ai nhìn thấy. Bốc lại tối đa vài lần thay
     * vì tính phân phối cho chuẩn: xác suất trúng vốn đã thấp.
     */
    const spawnCol = () => {
      for (let attempt = 0; attempt < 4; attempt++) {
        const col = 2 + Math.random() * (solver.cols - 5);

        if (col < hiddenFrom || col > hiddenTo) return col;
      }

      return 2 + Math.random() * (solver.cols - 5);
    };

    const spawnPuff = (): DriftPuff => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * DRIFT_SPEED;

      return {
        x: spawnCol(),
        y: 2 + Math.random() * (solver.rows - 5),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: between(DRIFT_RADIUS),
        age: 0,
        attack: between(DRIFT_ATTACK),
        hold: between(DRIFT_HOLD),
        release: between(DRIFT_RELEASE),
      };
    };

    /** Bao hình mượt: hiện dần → giữ → ngừng bơm cho tự tan. */
    const envelopeOf = (puff: DriftPuff) => {
      if (puff.age < puff.attack) {
        const t = puff.age / puff.attack;

        return t * t * (3 - 2 * t);
      }

      const held = puff.age - puff.attack;

      if (held < puff.hold) return 1;

      const t = (held - puff.hold) / puff.release;

      return t >= 1 ? 0 : 1 - t * t * (3 - 2 * t);
    };

    /**
     * Cụm trôi nổi: bơm mực dần theo bao hình nên hiện lên nhẹ nhàng, bán kính
     * lớn gấp 2–4 lần vệt chuột, và vì được nuôi liên tục suốt vòng đời nên tồn
     * tại lâu hơn hẳn vệt chuột (thứ chỉ đổ mực một lần rồi tiêu tán).
     *
     * Trả về true nếu có bơm mực — vòng lặp dùng để biết khi nào được phép ngủ.
     */
    const updateDrift = (dt: number) => {
      const level = knobs.current.fluidDrift;

      if (level <= 0) {
        puffs.length = 0;

        return false;
      }

      const maxPuffs = Math.max(1, Math.round(level * DRIFT_PUFFS_PER_LEVEL));

      spawnTimer -= dt;

      if (spawnTimer <= 0 && puffs.length < maxPuffs) {
        puffs.push(spawnPuff());
        spawnTimer = (0.4 + Math.random()) / level;
      }

      for (let i = puffs.length - 1; i >= 0; i--) {
        const puff = puffs[i];

        puff.age += dt;

        if (puff.age >= puff.attack + puff.hold + puff.release) {
          puffs.splice(i, 1);

          continue;
        }

        puff.x += puff.vx * dt;
        puff.y += puff.vy * dt;

        solver.splat(
          puff.x,
          puff.y,
          puff.vx,
          puff.vy,
          DRIFT_FEED * envelopeOf(puff) * dt,
          puff.radius,
        );
      }

      return puffs.length > 0;
    };

    const render = () => {
      const { cols, rows, density } = solver;

      // Chỉ xoá những dải thực sự nhìn thấy fluid. Ở chế độ cắt vẽ / nối mép,
      // damage rect co lại còn ~1/3 màn hình → phần hợp thành cũng rẻ theo.
      for (const [x, w] of bands) ctx.clearRect(x, 0, w, cssHeight);

      for (const bucket of buckets) bucket.length = 0;

      painted = 0;

      for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          // Cột nằm sau dải nội dung: mực vẫn được mô phỏng bình thường ở đây,
          // chỉ là không ai nhìn thấy nên khỏi vẽ.
          if (x >= hiddenFrom && x <= hiddenTo) continue;

          const i = x + y * cols;
          const d = density[i];

          if (d < RAMP_STOPS[0]) continue;

          let tier = 0;

          while (tier < RAMP.length - 1 && d >= RAMP_STOPS[tier + 1]) tier++;

          const level = Math.min(ALPHA_STEPS - 1, Math.floor(d * ALPHA_STEPS));

          buckets[tier * ALPHA_STEPS + level].push(i);
          painted++;
        }
      }

      for (let tier = 0; tier < RAMP.length; tier++) {
        const glyph = RAMP[tier];

        for (let level = 0; level < ALPHA_STEPS; level++) {
          const bucket = buckets[tier * ALPHA_STEPS + level];

          if (bucket.length === 0) continue;

          ctx.fillStyle = inkColors[tier][level];

          for (const i of bucket) {
            const x = i % cols;
            const y = (i - x) / cols;

            ctx.fillText(glyph, colToX(x), (y - 0.5) * cellPx);
          }
        }
      }
    };

    let raf = 0;
    let last = performance.now();
    /** Thời gian đã dồn lại chưa được mô phỏng — dùng để chốt trần FPS. */
    let accum = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);

      const elapsed = (now - last) / 1000;

      last = now;

      if (document.hidden || elapsed <= 0) return;

      const fps = knobs.current.fluidFps;

      /**
       * Trần FPS. Từ 60 trở lên thì bỏ qua cổng hẳn: `1/60` so với chính nhịp
       * màn hình 60Hz là so hai số float gần bằng nhau, chỉ cần lệch một chút
       * là rớt oan một khung và hoá ra 30fps.
       */
      accum += elapsed;

      if (fps > 0 && fps < 60 && accum < 1 / fps) return;

      const dt = Math.min(accum, 1 / 30);

      accum = 0;

      pointer.idle += dt;

      // fps = 0 nghĩa là NGỪNG BƠM, không phải đóng băng: mực đang có vẫn được
      // mô phỏng cho tan hết rồi vòng lặp tự ngủ ở nhánh dưới. Đóng băng sẽ để
      // lại một vũng ký tự đứng im giữa màn hình, nhìn như lỗi render.
      const feeding = fps > 0;

      // Hai hàm này chỉ bơm mực vào lưới nên rất rẻ; phần đắt nằm ở step() + render().
      const drifted = feeding && updateDrift(dt);
      const trailed = feeding && emitFromPointer(dt);

      /**
       * Không có nguồn bơm mới VÀ lượt vẽ trước không còn ô nào → cả hệ đứng
       * yên vĩnh viễn: không bơm thì mực chỉ có thể giảm chứ không tự sinh, mà
       * đã dưới ngưỡng vẽ rồi thì không bao giờ vượt lên lại. Bỏ luôn step(),
       * render() và clearRect cho tới khi có mực mới.
       *
       * clearRect toàn màn hình mới là thứ đắt nhất ở đây — không phải phép
       * tính fluid. Nó làm bẩn cả lớp canvas mỗi khung hình, kéo theo một lượt
       * hợp thành lại của mọi thứ nằm trên, kể cả `backdrop-filter` của .fd-rail.
       * Đứng yên thật sự thì chi phí nền về gần 0.
       */
      if (!drifted && !trailed && painted === 0) {
        if (!idle) {
          // Xả trường vận tốc trước khi ngủ: ngừng gọi step() chỉ ĐÓNG BĂNG vận
          // tốc chứ không tắt dần, và lúc tỉnh lại nó sẽ hất mực mới đi một cú
          // không ăn nhập với gì cả.
          solver.reset();
          ctx.clearRect(0, 0, cssWidth, cssHeight);
          idle = true;
        }

        return;
      }

      idle = false;

      solver.step(
        dt,
        VELOCITY_RETENTION ** dt,
        DENSITY_RETENTION_FAINT ** dt,
        DENSITY_RETENTION_DENSE ** dt,
      );
      render();
    };

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    };

    const themeObserver = new MutationObserver(buildPalette);

    buildPalette();
    resize();
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      themeObserver.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
    };
    // fluidRail đổi hình dạng lưới nên phải dựng lại mô phỏng; fps/drift thì
    // không, chúng đi qua `knobs` để đổi giữa chừng mà không mất trạng thái.
  }, [fluidEnabled, fluidRail]);

  return (
    <div
      aria-hidden
      className={`fd-ambient pointer-events-none fixed inset-0 -z-10 ${
        cloudMode === "paused" ? "fd-clouds-paused" : ""
      } ${className}`}
    >
      {cloudMode !== "hidden"
        ? CLOUD_LAYERS.map((layer) => <span key={layer} className={`fd-cloud fd-cloud-${layer}`} />)
        : null}

      {fluidEnabled ? <canvas ref={canvasRef} className="absolute inset-0" /> : null}

      {/* layoutGrid đo dải này để biết hai lề nằm ở đâu, và các viền dọc
          ::before/::after cũng thuộc về nó. */}
      <span
        ref={railRef}
        className={`fd-rail ${railSurface === "blur" ? "fd-rail-blur" : "fd-rail-tint"}`}
      />
    </div>
  );
}
