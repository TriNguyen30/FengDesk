import { Diamond, Leaf, Droplets, Flame, Mountain } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { useTranslation } from "react-i18next";

const elements = [
  {
    id: "Kim",
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
    image:
      "https://i.ex-cdn.com/danviet.vn/files/content/2026/01/01/031026tai-voi-lai-cay-canh-a-0222.jpg",
  },
  {
    id: "Moc",
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
    image:
      "https://i.ex-cdn.com/danviet.vn/files/content/2025/12/30/025751ngoc-bich-cay-canh-a2-0254.jpg",
  },
  {
    id: "Thuy",
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
    image:
      "https://tapchivietnamhuongsac.vn/stores/news_dataimages/2026/042026/06/09/capture20260406090848.jpg?rt=20260406090850",
  },
  {
    id: "Hoa",
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
    image:
      "https://i.ex-cdn.com/danviet.vn/files/content/2026/01/01/031026tai-voi-lai-cay-canh-a-0222.jpg",
  },
  {
    id: "Tho",
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
    image:
      "https://i.ex-cdn.com/danviet.vn/files/content/2025/12/30/025751ngoc-bich-cay-canh-a2-0254.jpg",
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────
type ElementType = "Hoa" | "Thuy" | "Moc" | "Kim" | "Tho";

interface Particle3D {
  active: boolean;
  obj: THREE.Object3D;
  type: ElementType;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  ax: number;
  ay: number;
  az: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
  sat: number;
  lit: number;
  angle: THREE.Euler;
  spin: THREE.Vector3;
  wobble: number;
  phase: number;
}

interface SharedAssets {
  glowTexture: THREE.Texture;
  ringTexture: THREE.Texture;
  sphereGeo: THREE.SphereGeometry;
  leafGeo: THREE.ExtrudeGeometry;
  rockGeo: THREE.IcosahedronGeometry;
  sparkGeo: THREE.CylinderGeometry;
  createVeins: () => THREE.Group;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const lerpFn = (a: number, b: number, t: number) => a * (1 - t) + b * t;

// ─── Procedural textures & geometries (built once, shared by every particle) ──
function createGlowTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createRingTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createLeafGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, -1);
  shape.bezierCurveTo(0.85, -0.3, 0.85, 0.45, 0, 0.85);
  shape.bezierCurveTo(-0.85, 0.45, -0.85, -0.3, 0, -1);
  return new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false });
}

function createVeinLines(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: 0x1f3d1f,
    transparent: true,
    opacity: 0.45,
  });

  // Midrib
  const midPoints: THREE.Vector3[] = [];
  for (let t = 0; t <= 1; t += 0.1) {
    midPoints.push(new THREE.Vector3(Math.sin(t * Math.PI) * 0.06, lerpFn(-1, 0.85, t), 0.03));
  }
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(midPoints), material));

  // Side veins
  for (let i = 1; i <= 3; i++) {
    const t = i / 4;
    const vy = lerpFn(-1, 0.85, t);
    const sideX = 0.5 * (1 - Math.abs(t - 0.5) * 1.5);
    [1, -1].forEach((dir) => {
      const pts = [new THREE.Vector3(0, vy, 0.03), new THREE.Vector3(sideX * dir, vy + 0.15, 0.03)];
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), material));
    });
  }
  return group;
}

function createSharedAssets(): SharedAssets {
  const sparkGeo = new THREE.CylinderGeometry(0.05, 0.015, 1, 6, 1, true);
  sparkGeo.translate(0, 0.5, 0); // pivot at the base so it can be aimed from the particle's origin
  return {
    glowTexture: createGlowTexture(),
    ringTexture: createRingTexture(),
    sphereGeo: new THREE.SphereGeometry(0.5, 12, 12),
    leafGeo: createLeafGeometry(),
    rockGeo: new THREE.IcosahedronGeometry(0.5, 0),
    sparkGeo,
    createVeins: createVeinLines,
  };
}

// ─── Pooled scene objects (one real Object3D per particle slot, reused) ───────
function createPooledObject(type: ElementType, shared: SharedAssets): THREE.Object3D {
  switch (type) {
    case "Hoa": {
      const mat = new THREE.SpriteMaterial({
        map: shared.glowTexture,
        color: new THREE.Color(),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.visible = false;
      return sprite;
    }

    case "Kim": {
      const group = new THREE.Group();
      const trailMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      group.add(new THREE.Mesh(shared.sparkGeo, trailMat));

      const headMat = new THREE.SpriteMaterial({
        map: shared.glowTexture,
        color: new THREE.Color(0xffffff),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      group.add(new THREE.Sprite(headMat));

      group.visible = false;
      return group;
    }

    case "Thuy": {
      const mat = new THREE.MeshPhongMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.8,
        shininess: 120,
        specular: 0xffffff,
      });
      const mesh = new THREE.Mesh(shared.sphereGeo, mat);
      mesh.visible = false;
      return mesh;
    }

    case "Moc": {
      const group = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({
        color: 0x4ade80,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        roughness: 0.6,
      });
      group.add(new THREE.Mesh(shared.leafGeo, mat));
      group.add(shared.createVeins());
      group.visible = false;
      return group;
    }

    case "Tho":
    default: {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xb45309,
        roughness: 0.9,
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(shared.rockGeo, mat);
      mesh.visible = false;
      return mesh;
    }
  }
}

function makeBlankParticle(obj: THREE.Object3D, type: ElementType): Particle3D {
  return {
    active: false,
    obj,
    type,
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    ax: 0,
    ay: 0,
    az: 0,
    size: 1,
    life: 0,
    maxLife: 1,
    hue: 0,
    sat: 0,
    lit: 0,
    angle: new THREE.Euler(),
    spin: new THREE.Vector3(),
    wobble: 0,
    phase: 0,
  };
}

// ─── Hover Particles ──────────────────────────────────────────────────────────
const HoverParticles = ({ type }: { type: ElementType }) => {
  const getIcon = () => {
    switch (type) {
      case "Moc":
        return <Leaf size={16} className="text-green-500/80 drop-shadow-sm" />;
      case "Thuy":
        return <Droplets size={16} className="text-blue-500/80 drop-shadow-sm" />;
      case "Hoa":
        return <Flame size={16} className="text-red-500/80 drop-shadow-sm" />;
      case "Kim":
        return <Diamond size={16} className="text-slate-500/80 drop-shadow-sm" />;
      case "Tho":
        return <Mountain size={16} className="text-amber-600/80 drop-shadow-sm" />;
      default:
        return null;
    }
  };

  const particles = [
    { delay: 0.1, duration: 3.5, xStart: -60, yStart: -90, xEnd: -80, yEnd: -140, rotEnd: 180 },
    { delay: 0.8, duration: 4.0, xStart: 60, yStart: -80, xEnd: 90, yEnd: -130, rotEnd: -180 },
    { delay: 1.5, duration: 3.2, xStart: -70, yStart: 70, xEnd: -110, yEnd: 110, rotEnd: 240 },
    { delay: 0.4, duration: 3.8, xStart: 70, yStart: 80, xEnd: 110, yEnd: 120, rotEnd: -240 },
    { delay: 2.1, duration: 4.5, xStart: -30, yStart: 100, xEnd: -50, yEnd: 150, rotEnd: 360 },
    { delay: 1.2, duration: 3.6, xStart: 30, yStart: 110, xEnd: 50, yEnd: 160, rotEnd: -360 },
    { delay: 2.5, duration: 3.9, xStart: 0, yStart: -110, xEnd: 10, yEnd: -170, rotEnd: 120 },
    { delay: 0.6, duration: 4.2, xStart: 90, yStart: 0, xEnd: 140, yEnd: -10, rotEnd: -120 },
  ];

  return (
    <div className="absolute inset-[-40px] z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2"
          initial={{
            x: p.xStart,
            y: p.yStart,
            scale: 0.5,
            opacity: 0,
            rotate: 0,
          }}
          animate={{
            y: [p.yStart, p.yEnd],
            x: [p.xStart, p.xEnd],
            scale: [0.5, 1, 0],
            opacity: [0, 1, 0],
            rotate: [0, p.rotEnd],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        >
          {getIcon()}
        </motion.div>
      ))}
    </div>
  );
};

// ─── Three.js scene overlay ─────────────────────────────────────────────────
export function ElementCanvas({ elementId }: { elementId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const type = elementId as ElementType;

    // ── renderer / scene / camera ──────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    const BASE_DISTANCE = 70;
    camera.position.set(0, 0, BASE_DISTANCE);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
    dirLight.position.set(20, 30, 40);
    scene.add(dirLight);

    const shared = createSharedAssets();

    // ── pixel <-> world-unit mapping, so spawn points line up with the screen ──
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const worldSizeAt = (z: number) => {
      const distance = camera.position.z - z;
      const vFov = (camera.fov * Math.PI) / 180;
      const height = 2 * Math.tan(vFov / 2) * distance;
      return { width: height * camera.aspect, height };
    };
    const pxToWorld = (px: number, py: number, z: number) => {
      const { width, height } = worldSizeAt(z);
      return {
        x: (px / W() - 0.5) * width,
        y: -(py / H() - 0.5) * height,
      };
    };
    const spawnDepth = () => rand(-18, 18);

    // ── particle pool (real Object3D instances, recycled instead of rebuilt) ──
    const poolSize = type === "Kim" ? 90 : type === "Thuy" ? 110 : 70;
    const pool: Particle3D[] = [];
    for (let i = 0; i < poolSize; i++) {
      const obj = createPooledObject(type, shared);
      scene.add(obj);
      pool.push(makeBlankParticle(obj, type));
    }

    const ripplePool: Particle3D[] = [];
    if (type === "Thuy") {
      for (let i = 0; i < 30; i++) {
        const mat = new THREE.SpriteMaterial({
          map: shared.ringTexture,
          color: new THREE.Color(0x60a5fa),
          transparent: true,
          depthWrite: false,
        });
        const sprite = new THREE.Sprite(mat);
        sprite.visible = false;
        scene.add(sprite);
        ripplePool.push(makeBlankParticle(sprite, "Thuy"));
      }
    }

    let cursor = 0;
    const acquire = (list: Particle3D[]) => {
      for (let i = 0; i < list.length; i++) {
        const idx = (cursor + i) % list.length;
        if (!list[idx].active) return list[idx];
      }
      return list[cursor++ % list.length]; // pool exhausted: steal the oldest slot
    };

    const spawn = () => {
      const p = acquire(pool);
      p.active = true;
      p.life = 0;
      p.z = spawnDepth();
      p.angle.set(0, 0, 0);
      p.obj.visible = true;

      switch (type) {
        case "Hoa": {
          const { x } = pxToWorld(rand(0.1, 0.9) * W() + rand(-20, 20), H(), p.z);
          p.x = x;
          p.y = pxToWorld(0, H(), p.z).y;
          p.vx = rand(-0.6, 0.6);
          p.vy = rand(2.2, 3.4);
          p.vz = rand(-0.2, 0.2);
          p.ax = 0;
          p.ay = 0.02; // buoyancy, world-up is +y
          p.az = 0;
          p.size = rand(2.2, 5.5);
          p.maxLife = rand(70, 130);
          p.hue = rand(0, 45);
          p.sat = 95;
          p.lit = 60;
          p.wobble = rand(0.03, 0.07);
          p.phase = rand(0, Math.PI * 2);
          break;
        }
        case "Thuy": {
          const { x } = pxToWorld(rand(0, W()), 0, p.z);
          p.x = x;
          p.y = pxToWorld(0, rand(-60, -10), p.z).y;
          p.vx = rand(-0.3, 0.3);
          p.vy = rand(-2.4, -1.4);
          p.vz = 0;
          p.ax = 0;
          p.ay = -0.07; // gravity
          p.az = 0;
          p.size = rand(0.7, 1.4);
          p.maxLife = rand(80, 140);
          p.hue = rand(195, 220);
          p.sat = 80;
          p.lit = 65;
          break;
        }
        case "Moc": {
          const fromLeft = Math.random() > 0.5;
          const start = pxToWorld(
            fromLeft ? rand(-40, -10) : rand(W() + 10, W() + 40),
            rand(-20, H() * 0.85),
            p.z,
          );
          p.x = start.x;
          p.y = start.y;
          const speed = rand(0.6, 1.3);
          p.vx = fromLeft ? speed : -speed;
          p.vy = rand(-0.5, 0.2);
          p.vz = rand(-0.15, 0.15);
          p.ax = 0;
          p.ay = -0.005; // gentle gravity
          p.az = 0;
          p.size = rand(0.7, 1.4);
          p.maxLife = rand(160, 260);
          p.hue = rand(90, 135);
          p.sat = rand(55, 75);
          p.lit = rand(35, 50);
          p.wobble = rand(0.04, 0.09);
          p.spin.set(rand(-0.05, 0.05), rand(-0.05, 0.05), rand(-0.03, 0.03));
          p.angle.set(rand(0, Math.PI * 2), rand(0, Math.PI * 2), rand(0, Math.PI * 2));
          break;
        }
        case "Kim": {
          const { x, y } = pxToWorld(rand(0.2, 0.8) * W(), rand(0.2, 0.7) * H(), p.z);
          p.x = x;
          p.y = y;
          const speed = rand(1.2, 3.4);
          const dir = rand(0, Math.PI * 2);
          const tilt = rand(-0.4, 0.4);
          p.vx = Math.cos(dir) * speed;
          p.vy = Math.sin(dir) * speed;
          p.vz = tilt * speed;
          p.ax = 0;
          p.ay = -0.06; // gravity
          p.az = 0;
          p.size = rand(0.06, 0.16);
          p.maxLife = rand(40, 80);
          p.hue = rand(40, 55);
          p.sat = rand(10, 60);
          p.lit = rand(75, 95);
          break;
        }
        case "Tho":
        default: {
          const { x } = pxToWorld(rand(0, W()), 0, p.z);
          p.x = x;
          p.y = pxToWorld(0, H(), p.z).y;
          p.vx = rand(-0.7, 0.7);
          p.vy = rand(1.0, 1.8);
          p.vz = rand(-0.3, 0.3);
          p.ax = rand(-0.01, 0.01);
          p.ay = -0.018; // gravity arcs it back down
          p.az = 0;
          p.size = rand(0.6, 1.5);
          p.maxLife = rand(120, 200);
          p.hue = rand(25, 48);
          p.sat = rand(40, 65);
          p.lit = rand(55, 72);
          p.wobble = rand(0.01, 0.04);
          p.spin.set(rand(-0.04, 0.04), rand(-0.04, 0.04), rand(-0.04, 0.04));
          p.angle.set(rand(0, Math.PI * 2), rand(0, Math.PI * 2), rand(0, Math.PI * 2));
          break;
        }
      }
    };

    const spawnRipple = (x: number, y: number, z: number, hue: number) => {
      const r = acquire(ripplePool);
      r.active = true;
      r.life = 0;
      r.x = x;
      r.y = y;
      r.z = z;
      r.maxLife = rand(30, 45);
      r.obj.visible = true;
      (r.obj as THREE.Sprite).material.color.setHSL(hue / 360, 0.75, 0.7);
    };

    // ── spawn cadence ──────────────────────────────────────────────────────
    const cadence: Record<ElementType, { rate: number; interval: number }> = {
      Hoa: { rate: 3, interval: 2 },
      Thuy: { rate: 3, interval: 2 },
      Moc: { rate: 1, interval: 4 },
      Kim: { rate: 0, interval: 1 },
      Tho: { rate: 2, interval: 3 },
    };
    const conf = cadence[type];
    let burstTimer = 0;
    let frame = 0;
    let animId = 0;

    const tmpVec = new THREE.Vector3();
    const tmpVec2 = new THREE.Vector3();
    const tmpQuat = new THREE.Quaternion();
    const tmpColor = new THREE.Color();
    const upAxis = new THREE.Vector3(0, 1, 0);

    const animate = () => {
      frame++;

      if (type === "Kim") {
        burstTimer++;
        if (burstTimer % 50 === 0) {
          for (let i = 0; i < 16; i++) spawn();
        }
      } else if (frame % conf.interval === 0) {
        for (let i = 0; i < conf.rate; i++) spawn();
      }

      const groundY = pxToWorld(0, H(), 0).y;

      for (const p of pool) {
        if (!p.active) continue;
        p.life++;

        p.vx += p.ax;
        p.vy += p.ay;
        p.vz += p.az;

        if (p.type === "Hoa") {
          p.vx += Math.sin(p.life * p.wobble + p.phase) * 0.05;
          p.vy += 0.015; // extra buoyancy as it rises
          p.size *= 0.993;
          p.hue = Math.min(55, p.hue + 0.3);
        } else if (p.type === "Moc") {
          p.angle.x += p.spin.x;
          p.angle.y += p.spin.y;
          p.angle.z += p.spin.z;
          p.vy += Math.sin(p.life * 0.07) * 0.01;
          p.vx *= 0.998;
        } else if (p.type === "Kim") {
          p.vx *= 0.96;
          p.vy *= 0.96;
          p.vz *= 0.96;
        } else if (p.type === "Tho") {
          p.angle.x += p.spin.x;
          p.angle.y += p.spin.y;
          p.angle.z += p.spin.z;
          p.vx += Math.sin(p.life * p.wobble) * 0.012;
          p.vx *= 0.99;
        } else if (p.type === "Thuy") {
          p.vx *= 0.995;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        let alpha = 1;
        const progress = p.life / p.maxLife;
        if (progress < 0.15) alpha = progress / 0.15;
        else if (progress > 0.75) alpha = 1 - (progress - 0.75) / 0.25;
        alpha = Math.max(0, Math.min(1, alpha));

        if (p.type === "Thuy" && p.y <= groundY + p.size) {
          spawnRipple(p.x, groundY, p.z, p.hue);
          p.active = false;
          p.obj.visible = false;
          continue;
        }
        if (p.life >= p.maxLife) {
          p.active = false;
          p.obj.visible = false;
          continue;
        }

        p.obj.position.set(p.x, p.y, p.z);

        if (p.type === "Hoa") {
          const sprite = p.obj as THREE.Sprite;
          sprite.scale.set(p.size * 1.4, p.size * 2.0, 1);
          tmpColor.setHSL(((p.hue + progress * 15) % 360) / 360, p.sat / 100, p.lit / 100);
          const mat = sprite.material as THREE.SpriteMaterial;
          mat.color.copy(tmpColor);
          mat.opacity = alpha * 0.9;
        } else if (p.type === "Thuy") {
          const mesh = p.obj as THREE.Mesh;
          mesh.scale.setScalar(p.size);
          const mat = mesh.material as THREE.MeshPhongMaterial;
          mat.opacity = alpha * 0.85;
          tmpColor.setHSL(p.hue / 360, p.sat / 100, p.lit / 100);
          mat.color.copy(tmpColor);
        } else if (p.type === "Moc") {
          const group = p.obj as THREE.Group;
          group.scale.setScalar(p.size);
          group.rotation.set(p.angle.x, p.angle.y, p.angle.z);
          const leafMesh = group.children[0] as THREE.Mesh;
          const mat = leafMesh.material as THREE.MeshStandardMaterial;
          mat.opacity = alpha * 0.92;
          tmpColor.setHSL(p.hue / 360, p.sat / 100, p.lit / 100);
          mat.color.copy(tmpColor);
        } else if (p.type === "Kim") {
          const group = p.obj as THREE.Group;
          tmpVec.set(p.vx, p.vy, p.vz);
          const speed = tmpVec.length();
          if (speed > 0.0001) tmpVec.normalize();
          else tmpVec.set(0, 1, 0);
          tmpVec2.copy(tmpVec).negate(); // trail points back the way it came from
          tmpQuat.setFromUnitVectors(upAxis, tmpVec2);

          const trail = group.children[0] as THREE.Mesh;
          trail.quaternion.copy(tmpQuat);
          const trailLen = Math.max(0.6, speed * 2.4);
          trail.scale.set(p.size * 5, trailLen, p.size * 5);
          const trailMat = trail.material as THREE.MeshBasicMaterial;
          tmpColor.setHSL(p.hue / 360, p.sat / 100, p.lit / 100);
          trailMat.color.copy(tmpColor);
          trailMat.opacity = alpha * 0.85;

          const head = group.children[1] as THREE.Sprite;
          head.scale.set(p.size * 7, p.size * 7, 1);
          const headMat = head.material as THREE.SpriteMaterial;
          headMat.opacity = alpha;
        } else {
          const mesh = p.obj as THREE.Mesh;
          mesh.scale.set(p.size, p.size * 0.8, p.size * 0.6);
          mesh.rotation.set(p.angle.x, p.angle.y, p.angle.z);
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.opacity = alpha * 0.85;
          tmpColor.setHSL(p.hue / 360, p.sat / 100, p.lit / 100);
          mat.color.copy(tmpColor);
        }
      }

      for (const r of ripplePool) {
        if (!r.active) continue;
        r.life++;
        if (r.life >= r.maxLife) {
          r.active = false;
          r.obj.visible = false;
          continue;
        }
        const t = r.life / r.maxLife;
        const sprite = r.obj as THREE.Sprite;
        sprite.position.set(r.x, r.y, r.z);
        sprite.scale.setScalar(1.2 + t * 4.5);
        (sprite.material as THREE.SpriteMaterial).opacity = (1 - t) * 0.6;
      }

      // gentle automatic camera drift for parallax / a genuine sense of depth
      camera.position.x = Math.sin(frame * 0.004) * 6;
      camera.position.y = Math.cos(frame * 0.003) * 3;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);

      // Dispose every per-particle material (each instance owns its own, so
      // this never touches anything shared). Geometries that ARE shared across
      // the pool are disposed explicitly below instead of via traversal.
      scene.traverse((obj) => {
        const material = (obj as THREE.Mesh | THREE.Sprite).material as
          | THREE.Material
          | THREE.Material[]
          | undefined;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material?.dispose();
      });

      shared.glowTexture.dispose();
      shared.ringTexture.dispose();
      shared.sphereGeo.dispose();
      shared.leafGeo.dispose();
      shared.rockGeo.dispose();
      shared.sparkGeo.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [elementId]);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full pointer-events-none" />;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function FiveElementsSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      {/* ── Decorative frame wrapper ─────────────────────────────────────── */}
      <div className="relative">
        {/* Ambient glow blobs behind the frame */}
        <div className="pointer-events-none absolute -inset-x-6 -inset-y-8 -z-10 overflow-hidden sm:-inset-x-10 sm:-inset-y-12">
          <div className="absolute -left-10 -top-10 h-56 w-56 rounded-full bg-primary/20 blur-3xl sm:h-72 sm:w-72" />
          <div className="absolute -right-10 -bottom-10 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl sm:h-72 sm:w-72" />
        </div>

        {/* Gradient border shell */}
        <div className="rounded-[28px] bg-gradient-to-br from-primary/40 via-amber-200/40 to-primary/40 p-[1.5px] shadow-xl shadow-primary/10">
          <div className="relative overflow-hidden rounded-[26px] bg-white">
            {/* Subtle dot-pattern texture */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
                backgroundSize: "18px 18px",
                // Chấm phải ngược tông với mặt thẻ, nên bám theo màu chữ của theme.
                color: "var(--color-gray-900)",
              }}
            />

            {/* Corner brackets */}
            <div className="pointer-events-none absolute left-3 top-3 h-6 w-6 rounded-tl-lg border-l-2 border-t-2 border-primary/50 sm:left-4 sm:top-4 sm:h-8 sm:w-8" />
            <div className="pointer-events-none absolute right-3 top-3 h-6 w-6 rounded-tr-lg border-r-2 border-t-2 border-primary/50 sm:right-4 sm:top-4 sm:h-8 sm:w-8" />
            <div className="pointer-events-none absolute bottom-3 left-3 h-6 w-6 rounded-bl-lg border-b-2 border-l-2 border-primary/50 sm:bottom-4 sm:left-4 sm:h-8 sm:w-8" />
            <div className="pointer-events-none absolute bottom-3 right-3 h-6 w-6 rounded-br-lg border-b-2 border-r-2 border-primary/50 sm:bottom-4 sm:right-4 sm:h-8 sm:w-8" />

            {/* ── Actual content, unchanged ───────────────────────────── */}
            <div className="relative z-10 px-5 py-8 sm:px-10 sm:py-10">
              <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row sm:mb-8">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-extrabold text-gray-900 sm:text-2xl">
                    {t("five_elements.title")}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 sm:text-base">
                    {t("five_elements.desc")}
                  </p>
                </div>
                <Link
                  to="/products"
                  className="shrink-0 rounded-full bg-primary/10 px-5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  {t("five_elements.btn")}
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
                {elements.map((element) => {
                  const elKey = element.id.toLowerCase();
                  return (
                    <a
                      key={element.id}
                      href={`/products?element=${element.id}`}
                      onClick={(e) => handleElementClick(e, element.id)}
                      className={`group relative flex flex-col items-center justify-center rounded-2xl text-center transition-all duration-300 ${element.color} ${element.hoverColor} hover:-translate-y-1 hover:shadow-lg cursor-pointer`}
                    >
                      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-2xl">
                        <div
                          className="absolute inset-[-100%] opacity-0 group-hover:opacity-100 animate-[spin_3s_linear_infinite] transition-opacity duration-300"
                          style={{
                            background: `conic-gradient(from 0deg, transparent 0 180deg, ${element.overlayColor} 360deg)`,
                          }}
                        />
                        <div
                          className={`absolute inset-[2px] rounded-[14px] ${element.color} ${element.hoverColor.replace("hover:", "group-hover:")} transition-colors duration-300`}
                        />
                        <div
                          className="absolute inset-[2px] opacity-[0.03] mix-blend-multiply transition-opacity duration-300 group-hover:opacity-[0.08] rounded-[14px]"
                          style={{
                            backgroundImage: `url(${element.image})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />
                      </div>

                      <HoverParticles type={element.id as ElementType} />

                      <div className="relative z-10 flex w-full flex-col items-center p-6">
                        <div
                          className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 group-hover:scale-110 ${element.iconColor}`}
                        >
                          {element.icon}
                        </div>
                        <h3 className={`text-lg font-bold ${element.textColor}`}>
                          {t(`five_elements.${elKey}.name`)}
                        </h3>
                        <p className="mt-1 text-xs font-medium text-gray-500 sm:text-sm">
                          {t(`five_elements.${elKey}.traits`)}
                        </p>
                        <span
                          // bg-neutral (không phải bg-white/60): chip nằm TRÊN thẻ nên phải
                          // đổi theo theme, chứ trắng cố định sẽ thành đốm loá ở nền tối.
                          className={`mt-4 rounded-full bg-neutral/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${element.textColor} backdrop-blur-sm transition-colors group-hover:bg-neutral`}
                        >
                          {t("five_elements.explore")}
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Full-screen elemental animation overlay (unchanged) ── */}
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
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.55) 100%)`,
              }}
            />
            <ElementCanvas elementId={animatingElement} />
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
                  {t(`five_elements.${activeElem.id.toLowerCase()}.name`)}
                </h1>
                <p className="text-lg font-medium opacity-90 drop-shadow sm:text-2xl">
                  {t("five_elements.explore_energy")}{" "}
                  {t(`five_elements.${activeElem.id.toLowerCase()}.traits`)}
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
