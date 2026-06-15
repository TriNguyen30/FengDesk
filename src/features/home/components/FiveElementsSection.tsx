import { Diamond, Leaf, Droplets, Flame, Mountain } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const elements = [
  {
    id: "metal",
    name: "Mệnh Kim",
    traits: "Quyết đoán & Tinh tế",
    color: "bg-slate-50",
    hoverColor: "hover:bg-slate-100",
    textColor: "text-slate-800",
    iconColor: "text-slate-500",
    overlayColor: "#64748b",
    overlayText: "text-white",
    icon: <Diamond size={32} strokeWidth={1.5} />,
    largeIcon: <Diamond size={80} strokeWidth={1.5} />,
    image: "https://i.ex-cdn.com/danviet.vn/files/content/2026/01/01/031026tai-voi-lai-cay-canh-a-0222.jpg",
  },
  {
    id: "wood",
    name: "Mệnh Mộc",
    traits: "Sáng tạo & Linh hoạt",
    color: "bg-green-50",
    hoverColor: "hover:bg-green-100",
    textColor: "text-green-800",
    iconColor: "text-green-600",
    overlayColor: "#16a34a",
    overlayText: "text-white",
    icon: <Leaf size={32} strokeWidth={1.5} />,
    largeIcon: <Leaf size={80} strokeWidth={1.5} />,
    image: "https://i.ex-cdn.com/danviet.vn/files/content/2025/12/30/025751ngoc-bich-cay-canh-a2-0254.jpg",
  },
  {
    id: "water",
    name: "Mệnh Thủy",
    traits: "Thông thái & Thích nghi",
    color: "bg-blue-50",
    hoverColor: "hover:bg-blue-100",
    textColor: "text-blue-800",
    iconColor: "text-blue-600",
    overlayColor: "#1d4ed8",
    overlayText: "text-white",
    icon: <Droplets size={32} strokeWidth={1.5} />,
    largeIcon: <Droplets size={80} strokeWidth={1.5} />,
    image: "https://tapchivietnamhuongsac.vn/stores/news_dataimages/2026/042026/06/09/capture20260406090848.jpg?rt=20260406090850",
  },
  {
    id: "fire",
    name: "Mệnh Hỏa",
    traits: "Nhiệt huyết & Đam mê",
    color: "bg-red-50",
    hoverColor: "hover:bg-red-100",
    textColor: "text-red-800",
    iconColor: "text-red-600",
    overlayColor: "#dc2626",
    overlayText: "text-white",
    icon: <Flame size={32} strokeWidth={1.5} />,
    largeIcon: <Flame size={80} strokeWidth={1.5} />,
    image: "https://i.ex-cdn.com/danviet.vn/files/content/2026/01/01/031026tai-voi-lai-cay-canh-a-0222.jpg",
  },
  {
    id: "earth",
    name: "Mệnh Thổ",
    traits: "Kiên định & Đáng tin",
    color: "bg-amber-50",
    hoverColor: "hover:bg-amber-100",
    textColor: "text-amber-800",
    iconColor: "text-amber-600",
    overlayColor: "#b45309",
    overlayText: "text-white",
    icon: <Mountain size={32} strokeWidth={1.5} />,
    largeIcon: <Mountain size={80} strokeWidth={1.5} />,
    image: "https://i.ex-cdn.com/danviet.vn/files/content/2025/12/30/025751ngoc-bich-cay-canh-a2-0254.jpg",
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;   // acceleration x
  ay: number;   // acceleration y
  size: number;
  life: number;
  maxLife: number;
  hue: number;
  sat: number;
  lit: number;
  alpha: number;
  angle: number;
  spin: number;
  type: "fire" | "water" | "wood" | "metal" | "earth";
  // per-type extra state
  wobble: number;
  phase: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const lerpFn = (a: number, b: number, t: number) => a * (1 - t) + b * t;

// ─── Canvas particle overlay ──────────────────────────────────────────────────
export function ElementCanvas({ elementId }: { elementId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const W = () => canvas.width;
    const H = () => canvas.height;

    // ── Spawn factories ───────────────────────────────────────────────────────
    const spawnParticle = (): Particle => {
      const base: Partial<Particle> = {
        life: 0,
        ax: 0,
        ay: 0,
        wobble: 0,
        phase: rand(0, Math.PI * 2),
        spin: 0,
        angle: 0,
      };

      switch (elementId) {
        case "fire": {
          // Embers rise from bottom in clusters
          const clusterX = rand(0.1, 0.9) * W();
          const size = rand(6, 22);
          return {
            ...base,
            type: "fire",
            x: clusterX + rand(-30, 30),
            y: H() + rand(0, 20),
            vx: rand(-1.2, 1.2),
            vy: rand(-7, -4),
            ax: 0,
            ay: -0.06,        // buoyancy
            size,
            maxLife: rand(70, 130),
            hue: rand(0, 45),  // red → orange → yellow
            sat: 95,
            lit: 60,
            alpha: 1,
            wobble: rand(0.03, 0.07),
            spin: rand(-0.05, 0.05),
          } as Particle;
        }

        case "water": {
          // Droplets fall with realistic parabolic arcs; also surface ripples
          const isStream = Math.random() < 0.7;
          const size = isStream ? rand(4, 10) : rand(8, 14);
          return {
            ...base,
            type: "water",
            x: rand(0, W()),
            y: rand(-60, -10),
            vx: rand(-0.8, 0.8),
            vy: rand(2, 6),
            ax: 0,
            ay: 0.18,         // gravity
            size,
            maxLife: rand(80, 140),
            hue: rand(195, 220),
            sat: 80,
            lit: 65,
            alpha: 1,
            wobble: 0,
            spin: 0,
            phase: rand(0, 1),  // reuse as "has hit ground" flag (0 = airborne)
          } as Particle;
        }

        case "wood": {
          // Leaves tumble in with realistic flutter (varying aspect ratio + spin)
          const fromLeft = Math.random() > 0.5;
          const size = rand(10, 20);
          const speed = rand(1.5, 3.5);
          return {
            ...base,
            type: "wood",
            x: fromLeft ? rand(-40, -10) : rand(W() + 10, W() + 40),
            y: rand(-20, H() * 0.85),
            vx: fromLeft ? speed : -speed,
            vy: rand(-0.5, 1.5),
            ax: 0,
            ay: 0.012,        // very gentle gravity
            size,
            maxLife: rand(160, 260),
            hue: rand(90, 135),
            sat: rand(55, 75),
            lit: rand(35, 50),
            alpha: 1,
            wobble: rand(0.04, 0.09),  // flutter frequency
            spin: rand(-0.04, 0.04),
            angle: rand(0, Math.PI * 2),
          } as Particle;
        }

        case "metal": {
          // Sparks: burst from random points, decelerate, fall with gravity
          const cx = rand(0.2, 0.8) * W();
          const cy = rand(0.2, 0.7) * H();
          const speed = rand(3, 9);
          const dir = rand(0, Math.PI * 2);
          return {
            ...base,
            type: "metal",
            x: cx,
            y: cy,
            vx: Math.cos(dir) * speed,
            vy: Math.sin(dir) * speed,
            ax: 0,
            ay: 0.15,         // gravity
            size: rand(2, 5),
            maxLife: rand(40, 80),
            hue: rand(40, 55),  // gold/silver shimmer
            sat: rand(10, 60),
            lit: rand(75, 95),
            alpha: 1,
            wobble: 0,
            spin: 0,
            phase: 0,  // streak length multiplier
          } as Particle;
        }

        case "earth":
        default: {
          // Sand/dust grains: rise from bottom, drift, tumble, settle
          const size = rand(5, 18);
          return {
            ...base,
            type: "earth",
            x: rand(0, W()),
            y: H() + rand(0, 30),
            vx: rand(-2, 2),
            vy: rand(-3.5, -1),
            ax: rand(-0.02, 0.02),
            ay: 0.04,
            size,
            maxLife: rand(120, 200),
            hue: rand(25, 48),
            sat: rand(40, 65),
            lit: rand(55, 72),
            alpha: 1,
            wobble: rand(0.01, 0.04),
            spin: rand(-0.03, 0.03),
            angle: rand(0, Math.PI * 2),
          } as Particle;
        }
      }
    };

    // ── Draw routines ─────────────────────────────────────────────────────────
    const drawParticle = (ctx: CanvasRenderingContext2D, p: Particle) => {
      const progress = p.life / p.maxLife;

      // eased alpha: fade in over first 15%, fade out over last 25%
      let alpha = 1;
      if (progress < 0.15) alpha = progress / 0.15;
      else if (progress > 0.75) alpha = 1 - (progress - 0.75) / 0.25;
      alpha = Math.max(0, Math.min(1, alpha));

      ctx.save();

      switch (p.type) {
        case "fire": {
          // Softbox glow: two overlapping radial gradients (core + halo)
          const hue = p.hue + progress * 15;  // shift redder as particle rises and cools
          const r = p.size * (1 - progress * 0.55);

          // Outer halo
          const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.2);
          halo.addColorStop(0, `hsla(${hue + 30}, 100%, 72%, ${alpha * 0.25})`);
          halo.addColorStop(1, `hsla(${hue}, 90%, 50%, 0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = halo;
          ctx.fill();

          // Core teardrop (taller than wide, tapered upward)
          const grad = ctx.createRadialGradient(p.x, p.y + r * 0.15, r * 0.05, p.x, p.y, r);
          grad.addColorStop(0, `hsla(60, 100%, 96%, ${alpha})`);
          grad.addColorStop(0.25, `hsla(${hue + 25}, 100%, 82%, ${alpha})`);
          grad.addColorStop(0.6, `hsla(${hue + 5}, 100%, 58%, ${alpha * 0.9})`);
          grad.addColorStop(1, `hsla(${hue}, 100%, 40%, 0)`);
          ctx.beginPath();
          ctx.save();
          ctx.translate(p.x, p.y);
          // Wobble: subtle horizontal sway
          ctx.rotate(Math.sin(p.life * p.wobble + p.phase) * 0.18);
          ctx.scale(0.6, 1);         // squish horizontally for teardrop
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.restore();
          break;
        }

        case "water": {
          const r = p.size * 0.55;
          const haHitGround = p.y > H() - r * 2;

          if (!haHitGround) {
            // Airborne droplet: slightly elongated in direction of travel
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            const stretch = Math.min(2.4, 1 + speed * 0.06);
            const dropAngle = Math.atan2(p.vy, p.vx) + Math.PI / 2;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(dropAngle);
            ctx.scale(1, stretch);

            const grad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, 0, 0, 0, r);
            grad.addColorStop(0, `hsla(${p.hue - 10}, 70%, 90%, ${alpha * 0.95})`);
            grad.addColorStop(0.5, `hsla(${p.hue}, 80%, 65%, ${alpha * 0.85})`);
            grad.addColorStop(1, `hsla(${p.hue + 10}, 90%, 45%, 0)`);

            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            // Highlight
            ctx.beginPath();
            ctx.arc(-r * 0.3, -r * 0.3, r * 0.25, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${alpha * 0.65})`;
            ctx.fill();
            ctx.restore();
          } else {
            // Ground ripple splash
            const rippleProgress = Math.min(1, (p.y - (H() - r * 2)) / (r * 6));
            const rippleR = r * 2.5 * rippleProgress;
            ctx.beginPath();
            ctx.ellipse(p.x, H() - 4, rippleR, rippleR * 0.35, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${p.hue}, 75%, 68%, ${alpha * (1 - rippleProgress) * 0.6})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
          break;
        }

        case "wood": {
          // Leaf: bezier shape + midrib + veins, rotating on its travel axis
          const s = p.size;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          // "flutter": squish width sinusoidally to simulate tumbling in 3D
          const flutter = Math.abs(Math.cos(p.life * p.wobble + p.phase));
          ctx.scale(flutter * 0.9 + 0.1, 1);

          // Leaf body
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.bezierCurveTo(s * 0.85, -s * 0.3, s * 0.85, s * 0.45, 0, s * 0.85);
          ctx.bezierCurveTo(-s * 0.85, s * 0.45, -s * 0.85, -s * 0.3, 0, -s);
          ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.lit}%, ${alpha * 0.82})`;
          ctx.fill();

          // Midrib
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.quadraticCurveTo(s * 0.1, 0, 0, s * 0.85);
          ctx.strokeStyle = `hsla(${p.hue + 15}, ${p.sat - 10}%, ${p.lit - 15}%, ${alpha * 0.5})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Side veins
          const veinCount = 3;
          for (let i = 1; i <= veinCount; i++) {
            const t = i / (veinCount + 1);
            const vy2 = lerpFn(-s, s * 0.85, t);
            const sideX = s * 0.5 * (1 - Math.abs(t - 0.5) * 1.5);
            ctx.beginPath();
            ctx.moveTo(0, vy2);
            ctx.lineTo(sideX, vy2 + s * 0.15);
            ctx.moveTo(0, vy2);
            ctx.lineTo(-sideX, vy2 + s * 0.15);
            ctx.strokeStyle = `hsla(${p.hue + 15}, ${p.sat - 10}%, ${p.lit - 15}%, ${alpha * 0.28})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
          ctx.restore();
          break;
        }

        case "metal": {
          // Spark trail: draw a tapered line in velocity direction
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          const trailLen = speed * 3.5;
          const dir2 = Math.atan2(p.vy, p.vx);

          // Trail
          const trailGrad = ctx.createLinearGradient(
            p.x, p.y,
            p.x - Math.cos(dir2) * trailLen,
            p.y - Math.sin(dir2) * trailLen
          );
          trailGrad.addColorStop(0, `hsla(${p.hue}, ${p.sat}%, ${p.lit}%, ${alpha * 0.9})`);
          trailGrad.addColorStop(1, `hsla(${p.hue}, ${p.sat}%, ${p.lit}%, 0)`);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - Math.cos(dir2) * trailLen, p.y - Math.sin(dir2) * trailLen);
          ctx.strokeStyle = trailGrad;
          ctx.lineWidth = p.size * 0.9;
          ctx.lineCap = "round";
          ctx.stroke();

          // Bright head
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.9, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue + 10}, 20%, 98%, ${alpha})`;
          ctx.fill();
          break;
        }

        case "earth":
        default: {
          // Irregular dust grain: rotated ellipse
          const rw = p.size * rand(0.4, 0.7);
          const rh = p.size * rand(0.3, 0.6);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(rw, rh));
          grad.addColorStop(0, `hsla(${p.hue}, ${p.sat}%, ${p.lit + 10}%, ${alpha * 0.85})`);
          grad.addColorStop(0.6, `hsla(${p.hue - 5}, ${p.sat}%, ${p.lit}%, ${alpha * 0.7})`);
          grad.addColorStop(1, `hsla(${p.hue - 10}, ${p.sat - 10}%, ${p.lit - 10}%, 0)`);
          ctx.beginPath();
          ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.restore();
          break;
        }
      }

      ctx.restore();
    };

    // ── Spawn rates and burst logic ───────────────────────────────────────────
    const spawnConfig: Record<string, { rate: number; interval: number; burst?: number }> = {
      fire: { rate: 5, interval: 2, burst: 2 },
      water: { rate: 4, interval: 2 },
      wood: { rate: 2, interval: 4 },
      metal: { rate: 0, interval: 1, burst: 12 },  // burst every N frames
      earth: { rate: 3, interval: 3 },
    };

    const cfg = spawnConfig[elementId] ?? spawnConfig.earth;
    let burstTimer = 0;

    const tick = () => {
      ctx.clearRect(0, 0, W(), H());
      const frame = frameRef.current;

      // Spawning
      if (elementId === "metal") {
        burstTimer++;
        if (burstTimer % 55 === 0) {
          // Burst of sparks from a random point
          for (let i = 0; i < 18; i++) particlesRef.current.push(spawnParticle());
        }
      } else {
        if (frame % cfg.interval === 0) {
          for (let i = 0; i < cfg.rate; i++) particlesRef.current.push(spawnParticle());
        }
      }

      // Update + draw
      particlesRef.current = particlesRef.current.filter((p) => {
        p.life++;
        // Apply acceleration
        p.vx += p.ax;
        p.vy += p.ay;
        // Element-specific physics
        if (p.type === "fire") {
          p.vx += Math.sin(p.life * p.wobble + p.phase) * 0.35;
          p.vy -= 0.04;           // extra buoyancy as fire rises
          p.size *= 0.993;
          p.hue = Math.min(55, p.hue + 0.3);  // shift toward yellow as flame cools
        } else if (p.type === "water") {
          // drag
          p.vx *= 0.995;
        } else if (p.type === "wood") {
          // flutter spin + gentle drift
          p.angle += p.spin;
          p.vy += Math.sin(p.life * 0.07) * 0.04;
          p.vx *= 0.998;
        } else if (p.type === "metal") {
          // deceleration (air resistance)
          p.vx *= 0.96;
          p.vy *= 0.96;
        } else {
          // earth: tumble + air resistance
          p.angle += p.spin;
          p.vx += Math.sin(p.life * p.wobble) * 0.08;
          p.vx *= 0.99;
        }

        p.x += p.vx;
        p.y += p.vy;

        drawParticle(ctx, p);
        return p.life < p.maxLife;
      });

      frameRef.current++;
      animFrameRef.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
      particlesRef.current = [];
      frameRef.current = 0;
    };
  }, [elementId]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: "screen" }}
    />
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function FiveElementsSection() {
  const navigate = useNavigate();
  const [animatingElement, setAnimatingElement] = useState<string | null>(null);

  const handleElementClick = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    setAnimatingElement(elementId);
    setTimeout(() => {
      navigate(`/products?element=${elementId}`);
      setTimeout(() => setAnimatingElement(null), 100);
    }, 1200);
  };

  const activeElem = elements.find((el) => el.id === animatingElement);

  return (
    <section className="mt-8 sm:mt-12 relative">
      <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row sm:mb-8">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-gray-900 sm:text-2xl">
            FengDesk AI - Ngũ Hành Trọng Không Gian
          </h2>
          <p className="mt-1 text-sm text-gray-500 sm:text-base">
            Khám phá cây phong thủy phù hợp với bản mệnh của bạn để tối ưu sinh khí và tài lộc.
          </p>
        </div>
        <Link
          to="/products"
          className="shrink-0 rounded-full bg-primary/10 px-5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          Trải nghiệm AI ngay
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {elements.map((element) => (
          <a
            key={element.id}
            href={`/products?element=${element.id}`}
            onClick={(e) => handleElementClick(e, element.id)}
            className={`group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl p-6 text-center transition-all duration-300 ${element.color} ${element.hoverColor} hover:-translate-y-1 hover:shadow-lg cursor-pointer`}
          >
            <div
              className="absolute inset-0 opacity-[0.03] mix-blend-multiply transition-opacity duration-300 group-hover:opacity-[0.08]"
              style={{
                backgroundImage: `url(${element.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div
              className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 group-hover:scale-110 ${element.iconColor}`}
            >
              {element.icon}
            </div>
            <h3 className={`text-lg font-bold ${element.textColor}`}>{element.name}</h3>
            <p className="mt-1 text-xs font-medium text-gray-500 sm:text-sm">{element.traits}</p>
            <span
              className={`mt-4 rounded-full bg-white/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${element.textColor} backdrop-blur-sm transition-colors group-hover:bg-white`}
            >
              Khám phá
            </span>
          </a>
        ))}
      </div>

      {/* ── Full-screen elemental animation overlay ── */}
      <AnimatePresence>
        {animatingElement && activeElem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] overflow-hidden"
            style={{ backgroundColor: activeElem.overlayColor }}
          >
            {/* Radial vignette so particles pop */}
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.55) 100%)`,
              }}
            />

            {/* Canvas particle system */}
            <ElementCanvas elementId={animatingElement} />

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <motion.div
                initial={{ scale: 0.4, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.6, type: "spring", bounce: 0.35 }}
                className={`flex flex-col items-center gap-5 ${activeElem.overlayText}`}
              >
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="drop-shadow-2xl"
                >
                  {activeElem.largeIcon}
                </motion.div>
                <h1 className="text-5xl font-black tracking-tight drop-shadow-lg sm:text-7xl">
                  {activeElem.name}
                </h1>
                <p className="text-lg font-medium opacity-90 drop-shadow sm:text-2xl">
                  Khám phá năng lượng {activeElem.traits}
                </p>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "8rem" }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="h-0.5 rounded-full bg-white/60"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}