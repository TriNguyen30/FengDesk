import { useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { isAxiosError } from "axios";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import Product3DViewer from "@/components/ui/3DSection";
import { model3DQueueApi } from "@/features/products/api/model3dQueue.api";

type PreviewFile =
  | { attempt: number; url: string; error?: never }
  | { attempt: number; url?: never; error: string };

export default function Model3DQueuePreview({
  requestId,
}: {
  requestId: string;
}) {
  const [attempt, setAttempt] = useState(0);
  const [file, setFile] = useState<PreviewFile | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl: string | undefined;

    const load = async () => {
      try {
        // Use the normal auth/refresh-token client. Never pass a bearer token to Meshy.
        const response = await model3DQueueApi.previewModel(requestId, controller.signal);
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(response.data);
        setFile({ attempt, url: objectUrl });
      } catch (error) {
        if (controller.signal.aborted) return;
        let message = "Không tải được bản xem trước. Vui lòng thử tải lại mô hình.";
        // Error responses are JSON, but Axios also returns them as a Blob here.
        if (isAxiosError(error) && error.response?.data instanceof Blob) {
          try {
            const body = JSON.parse(await error.response.data.text());
            if (typeof body.message === "string" && body.message) message = body.message;
          } catch {
            // Keep the fallback for non-JSON gateway errors.
          }
        }
        if (!controller.signal.aborted) setFile({ attempt, error: message });
      }
    };

    void load();
    return () => {
      controller.abort();
      if (objectUrl) {
        useGLTF.clear(objectUrl);
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [requestId, attempt]);

  const reload = async () => {
    setAttempt((value) => value + 1);
  };

  if (file?.attempt === attempt && file.url) {
    return (
      <div className="relative h-full w-full">
        <Product3DViewer modelUrl={file.url} onReload={reload} />
        <button
          type="button"
          onClick={reload}
          className="absolute right-3 top-3 z-30 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/40 bg-white/90 px-2.5 py-2 text-xs font-semibold text-gray-700 shadow-md backdrop-blur-sm transition-colors hover:bg-white"
          title="Tải lại mô hình 3D"
        >
          <RefreshCw size={14} />
          Tải lại mô hình
        </button>
      </div>
    );
  }

  const error = file?.attempt === attempt ? file.error : undefined;
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-3 bg-[#e5eadf] p-5 text-center text-sm text-gray-600"
      role="status"
    >
      {error ? (
        <>
          <AlertTriangle className="h-8 w-8 text-amber-600" />
          <p>{error}</p>
          <button
            type="button"
            onClick={reload}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 font-semibold shadow-sm"
          >
            <RefreshCw size={14} /> Tải lại mô hình
          </button>
        </>
      ) : (
        <>
          <Loader2 className="h-7 w-7 animate-spin" />
          <p>Đang tải mô hình 3D...</p>
        </>
      )}
    </div>
  );
}
