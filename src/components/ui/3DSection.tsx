import { Component, ReactNode, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  Center,
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import { Box, Image as ImageIcon, Loader2, AlertTriangle, Pointer } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Product3DViewerProps {
  /** URL file .glb (đã re-host trên Supabase Storage). */
  modelUrl: string;
  /** Ảnh preview dùng làm poster trong lúc GLB chưa tải xong. */
  thumbnailUrl?: string | null;
  /** Ảnh sản phẩm dùng làm phông nền mờ phía sau model. */
  backgroundImageUrl?: string | null;
  className?: string;
  /** Tự xoay khi không tương tác — mặc định bật, giống các trang thương mại điện tử. */
  autoRotate?: boolean;
}

/**
 * Hiển thị model 3D (.glb, sinh từ MeshyAI) bằng @react-three/fiber + drei.
 * Tự canh giữa + fit khung hình bất kể kích thước gốc của model.
 */
export default function Product3DViewer({
  modelUrl,
  thumbnailUrl,
  backgroundImageUrl,
  className = "",
  autoRotate = true,
}: Product3DViewerProps) {
  const { t } = useTranslation();
  const [modelLuminance, setModelLuminance] = useState(0.46);
  const backdropUrl = backgroundImageUrl || thumbnailUrl;
  const handleModelLuminance = useCallback((value: number) => setModelLuminance(value), []);

  return (
    <div className={`relative isolate h-full w-full overflow-hidden bg-[#e5eadf] ${className}`}>
      <ModelBackdrop imageUrl={backdropUrl} modelLuminance={modelLuminance} />

      <Model3DErrorBoundary
        key={modelUrl}
        fallback={
          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-2 text-center">
            <div className="rounded-2xl border border-white/30 bg-white/55 p-4 shadow-lg backdrop-blur-md">
              <AlertTriangle className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-xs font-medium text-gray-600">
                {t("product_detail.model_3d.load_error")}
              </p>
            </div>
          </div>
        }
      >
        <Suspense fallback={<ModelLoadingFallback />}>
          <Canvas
            className="relative z-10 cursor-grab active:cursor-grabbing"
            camera={{ fov: 38, position: [0, 0.05, 4] }}
            dpr={[1, 2]}
            gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
            shadows
          >
            <ambientLight intensity={0.55} />
            <hemisphereLight args={["#fff8e8", "#718067", 1.15]} />
            <directionalLight
              castShadow
              position={[3.5, 5, 4]}
              intensity={2.15}
              color="#fff4dc"
              shadow-mapSize={[1024, 1024]}
            />
            <directionalLight position={[-4, 1.5, 2]} intensity={1.05} color="#d9e9ff" />
            <directionalLight position={[0, -1, -4]} intensity={0.65} color="#d8e6cd" />
            <Environment resolution={128}>
              <Lightformer intensity={1.6} position={[0, 4, -3]} scale={[5, 5, 1]} />
              <Lightformer intensity={1.2} position={[-4, 1, 2]} scale={[3, 3, 1]} />
              <Lightformer intensity={0.9} position={[4, 0, 1]} scale={[2, 4, 1]} />
            </Environment>
            <Center>
              <FitModel url={modelUrl} onLuminance={handleModelLuminance} />
            </Center>
            <ContactShadows
              position={[0, -0.83, 0]}
              opacity={0.34}
              scale={2.8}
              blur={2.6}
              far={3.5}
              color="#253022"
            />
            <OrbitControls
              makeDefault
              enablePan={false}
              autoRotate={autoRotate}
              autoRotateSpeed={2.2}
              minDistance={1.2}
              maxDistance={10}
            />
          </Canvas>
        </Suspense>
      </Model3DErrorBoundary>

      <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/25 bg-gray-950/55 px-3 py-1.5 text-[11px] font-medium text-white/95 shadow-lg backdrop-blur-md sm:bottom-4">
        <Pointer className="h-4 w-4 shrink-0" strokeWidth={2.2} />
        {t("product_detail.model_3d.hint")}
      </div>
    </div>
  );
}

/** Load GLB + tự scale về kích thước chuẩn (đường kính bao ~1.6) để mọi model, dù xuất từ MeshyAI ở
 * tỉ lệ nào, đều lấp vừa khung camera giống nhau. */
function FitModel({ url, onLuminance }: { url: string; onLuminance: (value: number) => void }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const { invalidate } = useThree();

  const scale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 1e-6);
    return 1.6 / maxDim;
  }, [cloned]);

  useEffect(() => {
    cloned.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
    });
    onLuminance(estimateModelLuminance(cloned));
    invalidate();
  }, [cloned, invalidate, onLuminance]);

  return <primitive object={cloned} scale={scale} />;
}

function ModelLoadingFallback() {
  const { t } = useTranslation();
  return (
    <div className="relative z-10 flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/30 bg-white/50 px-5 py-4 text-gray-600 shadow-lg backdrop-blur-md">
        <Loader2 className="h-7 w-7 animate-spin" />
        <span className="text-xs font-medium">{t("product_detail.model_3d.loading")}</span>
      </div>
    </div>
  );
}

function ModelBackdrop({
  imageUrl,
  modelLuminance,
}: {
  imageUrl?: string | null;
  modelLuminance: number;
}) {
  const imageLuminance = useImageLuminance(imageUrl);
  const imageBrightness = THREE.MathUtils.clamp(0.56 / Math.max(imageLuminance, 0.2), 0.62, 1.12);
  const isDarkModel = modelLuminance < 0.42;
  const isLightModel = modelLuminance > 0.7;

  const focusGlow = isDarkModel
    ? "radial-gradient(ellipse 52% 60% at 50% 48%, rgba(255,255,248,.62) 0%, rgba(241,246,235,.3) 46%, transparent 76%)"
    : isLightModel
      ? "radial-gradient(ellipse 54% 62% at 50% 48%, rgba(31,43,31,.42) 0%, rgba(73,91,68,.18) 48%, transparent 78%)"
      : "radial-gradient(ellipse 52% 60% at 50% 48%, rgba(250,251,244,.38) 0%, rgba(232,239,226,.16) 48%, transparent 76%)";

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#eff3ea_0%,#dfe7da_47%,#cbd8c6_100%)]" />
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          draggable={false}
          className="absolute -inset-[7%] h-[114%] w-[114%] object-cover opacity-45"
          style={{
            filter: `blur(22px) brightness(${imageBrightness}) saturate(.78) contrast(.9)`,
            transform: "scale(1.06)",
          }}
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(248,250,244,.48),rgba(91,110,84,.2))]" />
      <div className="absolute inset-0" style={{ background: focusGlow }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_48%,rgba(30,43,30,.18)_100%)]" />
      <div className="absolute inset-x-[18%] bottom-[8%] h-[12%] rounded-full bg-black/15 blur-2xl" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.14)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />
    </div>
  );
}

function useImageLuminance(imageUrl?: string | null) {
  const [sample, setSample] = useState<{ url: string; luminance: number } | null>(null);

  useEffect(() => {
    if (!imageUrl) return;

    let cancelled = false;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 24;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return;
        context.drawImage(image, 0, 0, 24, 24);
        const pixels = context.getImageData(0, 0, 24, 24).data;
        let total = 0;
        let count = 0;
        for (let index = 0; index < pixels.length; index += 4) {
          if (pixels[index + 3] < 16) continue;
          total += relativeLuminance(pixels[index], pixels[index + 1], pixels[index + 2]);
          count += 1;
        }
        if (!cancelled && count > 0) setSample({ url: imageUrl, luminance: total / count });
      } catch {
        // Storage không cho phép đọc pixel qua CORS: giữ mức trung tính, ảnh vẫn hiển thị bình thường.
      }
    };
    image.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return sample && sample.url === imageUrl ? sample.luminance : 0.55;
}

function estimateModelLuminance(model: THREE.Object3D) {
  let weightedLuminance = 0;
  let totalWeight = 0;

  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    const geometryWeight = Math.max(child.geometry.attributes.position?.count ?? 1, 1);

    materials.forEach((material) => {
      const shadedMaterial = material as THREE.Material & {
        color?: THREE.Color;
        map?: THREE.Texture;
      };
      const color = shadedMaterial.color;
      const colorLuminance = color ? 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b : 0.5;
      const textureLuminance = estimateTextureLuminance(shadedMaterial.map) ?? 1;
      const luminance = colorLuminance * textureLuminance;
      weightedLuminance += luminance * geometryWeight;
      totalWeight += geometryWeight;
    });
  });

  return totalWeight > 0 ? weightedLuminance / totalWeight : 0.5;
}

function estimateTextureLuminance(texture?: THREE.Texture) {
  const source = texture?.source.data as CanvasImageSource | ImageData | undefined;
  if (!source) return undefined;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 24;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return undefined;

    if (source instanceof ImageData) {
      context.putImageData(source, 0, 0, 0, 0, 24, 24);
    } else {
      context.drawImage(source, 0, 0, 24, 24);
    }

    const pixels = context.getImageData(0, 0, 24, 24).data;
    let total = 0;
    let count = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] < 16) continue;
      total += relativeLuminance(pixels[index], pixels[index + 1], pixels[index + 2]);
      count += 1;
    }
    return count > 0 ? total / count : undefined;
  } catch {
    return undefined;
  }
}

function relativeLuminance(red: number, green: number, blue: number) {
  const toLinear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** useGLTF ném lỗi thật (không phải Promise) khi file GLB hỏng/URL sai — cần error boundary để
 * không sập cả trang sản phẩm. */
class Model3DErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[Product3DViewer] Lỗi tải model 3D:", error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

/** Bộ chuyển chế độ ảnh/3D đặt bên ngoài khung media để không xung đột với lightbox. */
export function Model3DViewSwitcher({
  activeMode,
  onChange,
}: {
  activeMode: "image" | "3d";
  onChange: (mode: "image" | "3d") => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="group"
      aria-label={t("product_detail.model_3d.view_mode")}
      className="grid min-w-[210px] grid-cols-2 gap-1 rounded-full border border-gray-200 bg-gray-50 p-1 shadow-inner"
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onChange("image");
        }}
        aria-pressed={activeMode === "image"}
        aria-controls="product-media-viewer"
        className={`flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-[.97] ${
          activeMode === "image"
            ? "bg-white text-gray-800 shadow-sm ring-1 ring-black/5"
            : "text-gray-500 hover:bg-white/70 hover:text-gray-700"
        }`}
      >
        <ImageIcon className="h-3.5 w-3.5" />
        <span>{t("product_detail.model_3d.view_image")}</span>
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onChange("3d");
        }}
        aria-pressed={activeMode === "3d"}
        aria-controls="product-media-viewer"
        className={`flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-bold transition-all duration-200 cursor-pointer active:scale-[.97] ${
          activeMode === "3d"
            ? "bg-primary text-white shadow-md shadow-primary/20"
            : "text-primary hover:bg-primary/10"
        }`}
      >
        <Box className="h-3.5 w-3.5" />
        <span>{t("product_detail.model_3d.view_model")}</span>
      </button>
    </div>
  );
}
