import { useEffect, useRef, useState } from "react";
import { FluidSolver } from "@/utils/asciiFluid";
import { useClouds, useFluidDrift } from "@/utils/appearance";

/** Số mảng mây — mỗi mảng là một class .fd-cloud-N trong index.css. */
const CLOUD_LAYERS = [1, 2, 3, 4, 5, 6];

/** Kích thước một ô lưới (px CSS) — ô càng lớn thì càng ít ký tự phải vẽ. */
const CELL_SIZE = 20;
/** Cỡ chữ so với ô lưới; quá 0.9 là các ký tự bắt đầu dính nhau. */
const GLYPH_SCALE = 0.86;
/** Bậc đậm nhạt: nhạt → đậm. */
const RAMP = ["·", "-", "+", "*"] as const;
/** Ngưỡng mật độ tương ứng từng ký tự trong RAMP. */
const RAMP_STOPS = [0.05, 0.14, 0.32, 0.6] as const;
/** Số mức alpha rời rạc — gom nét vẽ theo mức để đổi fillStyle ít lần nhất. */
const ALPHA_STEPS = 5;
const MIN_ALPHA = 0.18;
const MAX_ALPHA = 0.62;

/** Phần vận tốc / mật độ còn lại sau mỗi giây (dùng luỹ thừa theo dt). */
const VELOCITY_RETENTION = 0.5;
/**
 * Mực tiêu tán theo độ đậm chứ không đồng loạt: ô nhạt (ký tự "·") giữ lại
 * nhiều nên sống dai, ô đậm (ký tự "*") tan nhanh hơn. Ô có độ đậm ở giữa thì
 * nội suy tuyến tính giữa hai mốc này.
 */
const DENSITY_RETENTION_FAINT = 0.58;
const DENSITY_RETENTION_DENSE = 0.12;

const POINTER_MAX_SPEED = 55; // ô/giây
const POINTER_FORCE_GAIN = 1;
const SPLAT_RADIUS = 1.4;

/** Click → vòng lực toả tròn: số nhánh và tốc độ bắn ra (ô/giây). */
const BURST_ARMS = 8;
const BURST_SPEED = 26;
/**
 * Cụm fluid trôi nổi ngẫu nhiên. Khác vệt chuột ở chỗ mực được bơm DẦN theo
 * bao hình attack → hold → release thay vì đổ một lần, cộng vận tốc gần bằng 0
 * nên cụm hiện lên nhẹ nhàng và tan chậm thay vì bị kéo thành vệt.
 */
const DRIFT_RADIUS = [3.5, 5] as const; // ô lưới (vệt chuột chỉ ~2.2)
const DRIFT_ATTACK = [0.4, 0.6] as const; // giây hiện dần
const DRIFT_HOLD = [0, 0] as const; // giây giữ nguyên độ đậm
const DRIFT_RELEASE = [2, 2.8] as const; // giây ngừng bơm để tự tan
const DRIFT_SPEED = 6; // ô/giây — chỉ đủ để cụm lững lờ trôi
/**
 * Mực bơm mỗi giây ở đỉnh bao hình. Vì tâm cụm là vùng đậm nên nó tiêu tán theo
 * DENSITY_RETENTION_DENSE: mật độ cân bằng ≈ FEED / |ln(DENSITY_RETENTION_DENSE)|,
 * và luôn bị chặn ở trần cứng 1.6 trong FluidSolver.splat().
 */
const DRIFT_FEED = 5.8;
/** Số cụm sống đồng thời ứng với 1 bậc cường độ (bậc 0 = tắt hẳn). */
const DRIFT_PUFFS_PER_LEVEL = 3;

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
  const cloudsOn = useClouds();
  const drift = useFluidDrift();

  // Đọc qua ref để đổi cường độ không phải dựng lại toàn bộ mô phỏng.
  const driftRef = useRef(drift);

  useEffect(() => {
    driftRef.current = drift;
  }, [drift]);

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
      solver = new FluidSolver(
        Math.max(8, Math.ceil(width / cellPx) + 2),
        Math.max(8, Math.ceil(height / cellPx) + 2),
      );

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${Math.round(cellPx * GLYPH_SCALE)}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    };

    const onPointerMove = (event: PointerEvent) => {
      // Ô lưới thứ 1 nằm ở tâm px 0.5*cellPx (viền lưới rộng hơn màn hình 1 ô mỗi bên).
      pointer.x = event.clientX / cellPx + 0.5;
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

    /** Rải vệt mực dọc quãng chuột đã đi trong frame để nét không bị đứt. */
    const emitFromPointer = (dt: number) => {
      if (!pointer.seen) return;

      const dx = pointer.x - pointer.prevX;
      const dy = pointer.y - pointer.prevY;
      const distance = Math.hypot(dx, dy);

      // Vẫn cập nhật vị trí trước khi thoát, để lúc kích hoạt không vẽ vệt nhảy cóc.
      pointer.prevX = pointer.x;
      pointer.prevY = pointer.y;

      if (!trailActive || distance < 0.02) return;

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
    };

    /** Nội suy ngẫu nhiên trong khoảng [min, max]. */
    const between = (range: readonly [number, number]) =>
      range[0] + Math.random() * (range[1] - range[0]);

    const spawnPuff = (): DriftPuff => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * DRIFT_SPEED;

      return {
        x: 2 + Math.random() * (solver.cols - 5),
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
     */
    const updateDrift = (dt: number) => {
      const level = driftRef.current;

      if (level <= 0) {
        puffs.length = 0;

        return;
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
    };

    const render = () => {
      const { cols, rows, density } = solver;

      ctx.clearRect(0, 0, cssWidth, cssHeight);

      for (const bucket of buckets) bucket.length = 0;

      for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          const i = x + y * cols;
          const d = density[i];

          if (d < RAMP_STOPS[0]) continue;

          let tier = 0;

          while (tier < RAMP.length - 1 && d >= RAMP_STOPS[tier + 1]) tier++;

          const level = Math.min(ALPHA_STEPS - 1, Math.floor(d * ALPHA_STEPS));

          buckets[tier * ALPHA_STEPS + level].push(i);
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

            ctx.fillText(glyph, (x - 0.5) * cellPx, (y - 0.5) * cellPx);
          }
        }
      }
    };

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);

      const dt = Math.min((now - last) / 1000, 1 / 30);

      last = now;

      if (document.hidden || dt <= 0) return;

      pointer.idle += dt;

      updateDrift(dt);
      emitFromPointer(dt);
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
  }, [fluidEnabled]);

  return (
    <div aria-hidden className={`fd-ambient pointer-events-none fixed inset-0 -z-10 ${className}`}>
      {cloudsOn
        ? CLOUD_LAYERS.map((layer) => <span key={layer} className={`fd-cloud fd-cloud-${layer}`} />)
        : null}

      {fluidEnabled ? <canvas ref={canvasRef} className="absolute inset-0" /> : null}

      <span ref={railRef} className="fd-rail" />
    </div>
  );
}
