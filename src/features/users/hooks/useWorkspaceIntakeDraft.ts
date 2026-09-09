import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkspaceFormValues } from "../schemas/workspace-schema";
import type { WorkspaceProfileInputDto } from "../types/workspace";

/**
 * Bản nháp luồng "Thêm không gian làm việc", lưu trong localStorage.
 *
 * Vì sao cần: đóng tab / F5 / bấm nhầm ra ngoài modal là mất sạch — cả đoạn mô tả vài trăm chữ
 * lẫn ảnh vừa upload lẫn form đã sửa ở bước 2. Người dùng phải làm lại từ đầu.
 *
 * Quy ước QUAN TRỌNG: đóng modal (nút X / bấm nền) KHÔNG xóa nháp — chỉ nút "Hủy" và lưu thành công
 * mới xóa. Đây đúng là hành vi user mong đợi: đóng nhầm thì mở lại vẫn còn.
 */

const STORAGE_KEY = "fengdesk.workspace-intake-draft";

/** Nháp cũ hơn ngưỡng này coi như bỏ — tránh mở lại sau vài tuần thấy nội dung lạ. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Gộp nhiều lần gõ thành 1 lần ghi — tránh đụng localStorage mỗi ký tự. */
const DEBOUNCE_MS = 400;

/** Tăng khi đổi cấu trúc nháp để bản cũ tự bị bỏ qua thay vì gây lỗi. */
const VERSION = 1;

export interface WorkspaceIntakeDraft {
  v: number;
  savedAt: number;
  /** Bước user đang dở: quay lại đúng chỗ đã rời đi. */
  step: "describe" | "review";
  describe: {
    description: string;
    /** Link ảnh ĐÃ upload xong — object URL preview không sống qua reload nên chỉ giữ link server. */
    imageUrls: string[];
    deepThink: boolean;
  };
  /** Chỉ có khi user đã sang bước "Kiểm tra & lưu". */
  review?: {
    values: WorkspaceFormValues;
    inputs: WorkspaceProfileInputDto[];
  };
}

function read(): WorkspaceIntakeDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkspaceIntakeDraft;
    if (parsed?.v !== VERSION) return null;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    // Chế độ riêng tư / localStorage bị chặn / JSON hỏng → coi như không có nháp.
    return null;
  }
}

function write(draft: WorkspaceIntakeDraft) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* hết quota hoặc bị chặn — nháp chỉ là tiện ích, không được làm hỏng luồng chính */
  }
}

function remove() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* bỏ qua */
  }
}

/**
 * @param enabled chỉ bật ở CREATE mode. Edit mode đã có dữ liệu thật từ server, lưu nháp chỉ gây lệch.
 */
export function useWorkspaceIntakeDraft(enabled: boolean) {
  // Đọc MỘT LẦN lúc mount: dùng làm giá trị khởi tạo cho form, không phải state đồng bộ liên tục.
  const [initial] = useState<WorkspaceIntakeDraft | null>(() => (enabled ? read() : null));

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Giữ bản mới nhất để lần ghi bị debounce vẫn lưu đúng dữ liệu cuối cùng.
  const pending = useRef<WorkspaceIntakeDraft | null>(null);

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (pending.current) {
      write(pending.current);
      pending.current = null;
    }
  }, []);

  const save = useCallback(
    (patch: Omit<WorkspaceIntakeDraft, "v" | "savedAt">) => {
      if (!enabled) return;
      pending.current = { ...patch, v: VERSION, savedAt: Date.now() };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, DEBOUNCE_MS);
    },
    [enabled, flush],
  );

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    pending.current = null;
    remove();
  }, []);

  // Đóng tab đột ngột: ghi ngay phần còn đang chờ debounce, nếu không sẽ mất vài giây gõ cuối.
  useEffect(() => {
    if (!enabled) return;
    const onHide = () => flush();
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
      flush();
    };
  }, [enabled, flush]);

  return { initial, save, clear, flush };
}
