import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export type AttachmentStatus = "uploading" | "done" | "error";

export interface Attachment {
  id: string;
  /** Object URL cục bộ để preview ngay (chưa cần link server). */
  previewUrl: string;
  status: AttachmentStatus;
  /** Link server sau khi upload xong (gắn vào imageUrls khi gửi). */
  url?: string;
}

/** Hàm upload 1 ảnh: nhận file + signal (để hủy), trả link server. */
export type UploadFn = (file: File, signal: AbortSignal) => Promise<string>;

/**
 * Quản lý ảnh đính kèm kiểu Messenger: chọn ảnh → upload nền (preview + spinner),
 * cho hủy giữa chừng (nút x), CHỈ cho gửi khi mọi ảnh đã upload xong (có link).
 */
export function useImageAttachments(upload: UploadFn) {
  const [items, setItems] = useState<Attachment[]>([]);
  const controllers = useRef<Map<string, AbortController>>(new Map());

  const add = useCallback(
    (file: File) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      const previewUrl = URL.createObjectURL(file);
      const controller = new AbortController();
      controllers.current.set(id, controller);
      setItems((p) => [...p, { id, previewUrl, status: "uploading" }]);

      void (async () => {
        try {
          const url = await upload(file, controller.signal);
          setItems((p) => p.map((it) => (it.id === id ? { ...it, status: "done", url } : it)));
        } catch {
          if (controller.signal.aborted) return; // người dùng hủy → item đã bị gỡ
          setItems((p) => p.map((it) => (it.id === id ? { ...it, status: "error" } : it)));
          toast.error("Tải ảnh thất bại. Vui lòng thử lại.");
        } finally {
          controllers.current.delete(id);
        }
      })();
    },
    [upload],
  );

  const remove = useCallback((id: string) => {
    controllers.current.get(id)?.abort();
    controllers.current.delete(id);
    setItems((p) => {
      const it = p.find((x) => x.id === id);
      if (it) URL.revokeObjectURL(it.previewUrl);
      return p.filter((x) => x.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    setItems((p) => {
      p.forEach((it) => URL.revokeObjectURL(it.previewUrl));
      return [];
    });
    controllers.current.forEach((c) => c.abort());
    controllers.current.clear();
  }, []);

  // Dọn object URL khi unmount.
  useEffect(() => () => clear(), [clear]);

  const uploading = items.some((it) => it.status === "uploading");
  const urls = items.filter((it) => it.status === "done" && it.url).map((it) => it.url!);

  return { items, add, remove, clear, uploading, urls };
}
