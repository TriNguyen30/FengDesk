import { Component, ReactNode, Suspense, useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center } from "@react-three/drei";
import * as THREE from "three";
import { Loader2, AlertTriangle, RotateCw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Product3DViewerProps {
  /** URL file .glb (đã re-host trên Supabase Storage). */
  modelUrl: string;
  /** Ảnh preview dùng làm poster trong lúc GLB chưa tải xong. */
  thumbnailUrl?: string | null;
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
  className = "",
  autoRotate = true,
}: Product3DViewerProps) {
  const { t } = useTranslation();

  return (
    <div className={`relative h-full w-full ${className}`}>
      <Model3DErrorBoundary
        fallback={
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gray-50 text-center">
            <AlertTriangle className="h-8 w-8 text-gray-300" />
            <p className="text-xs text-gray-400">{t("product_detail.model_3d.load_error")}</p>
          </div>
        }
      >
        <Suspense fallback={<ModelLoadingFallback thumbnailUrl={thumbnailUrl} />}>
          <Canvas
            className="cursor-grab active:cursor-grabbing"
            camera={{ fov: 40, position: [0, 0, 4] }}
            dpr={[1, 2]}
            gl={{ preserveDrawingBuffer: true, antialias: true }}
          >
            <ambientLight intensity={0.9} />
            <directionalLight position={[3, 5, 4]} intensity={1.4} />
            <directionalLight position={[-3, -2, -4]} intensity={0.5} />
            <Center>
              <FitModel url={modelUrl} />
            </Center>
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

      <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[11px] text-white/90 backdrop-blur-sm">
        <RotateCw className="h-3 w-3" />
        {t("product_detail.model_3d.hint")}
      </div>
    </div>
  );
}

/** Load GLB + tự scale về kích thước chuẩn (đường kính bao ~1.6) để mọi model, dù xuất từ MeshyAI ở
 * tỉ lệ nào, đều lấp vừa khung camera giống nhau. */
function FitModel({ url }: { url: string }) {
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
    invalidate();
  }, [cloned, invalidate]);

  return <primitive object={cloned} scale={scale} />;
}

function ModelLoadingFallback({ thumbnailUrl }: { thumbnailUrl?: string | null }) {
  const { t } = useTranslation();
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-gray-50">
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-contain opacity-40 blur-[1px]"
        />
      )}
      <div className="relative flex flex-col items-center gap-2 text-gray-400">
        <Loader2 className="h-7 w-7 animate-spin" />
        <span className="text-xs">{t("product_detail.model_3d.loading")}</span>
      </div>
    </div>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** useGLTF ném lỗi thật (không phải Promise) khi file GLB hỏng/URL sai — cần error boundary để
 * không sập cả trang sản phẩm. */
class Model3DErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, ErrorBoundaryState> {
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

/** Badge nhỏ để bật/tắt chế độ xem 3D trên khung ảnh chính — dùng ở ProductDetailPage. */
export function Model3DToggleBadge({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute top-3 left-3 z-10 flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold shadow-sm transition-colors cursor-pointer ${
        active ? "bg-primary text-white" : "bg-white/90 text-gray-700 hover:bg-white"
      }`}
      title={t("product_detail.model_3d.view_3d")}
    >
      <span className="tracking-wider">{t("product_detail.model_3d.badge")}</span>
    </button>
  );
}

// Preload không bắt buộc — drei tự cache theo URL khi Canvas mount. Giữ export để component khác
// (VD trang quản lý) có thể prime cache trước khi hiển thị.
export { useGLTF };
