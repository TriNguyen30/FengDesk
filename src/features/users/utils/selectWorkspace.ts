import type { Workspace } from "../types/workspace";

/** Đường dẫn trang workspace; có id → mở đúng phòng đó. */
export const WORKSPACE_PATH = "/profile/workspace";
export const workspacePath = (id?: string | null) => (id ? `${WORKSPACE_PATH}/${id}` : WORKSPACE_PATH);

/**
 * Phòng đang được xem: id trên URL nếu hợp lệ, không thì phòng mặc định, không có mặc định thì phòng
 * đầu danh sách. Sidebar và trang chính CÙNG gọi hàm này để không bao giờ highlight một phòng mà
 * nội dung đang hiện phòng khác.
 */
export function resolveSelectedWorkspace(
  workspaces: Workspace[],
  requestedId?: string | null,
): Workspace | null {
  if (workspaces.length === 0) return null;
  if (requestedId) {
    const requested = workspaces.find((w) => w.id === requestedId);
    if (requested) return requested;
  }
  return workspaces.find((w) => w.isDefault) ?? workspaces[0];
}

/**
 * Màu theo % tương thích — cùng ngưỡng với vòng tròn `CompatibilityRing` trên card phòng
 * (< 40 đỏ · < 70 vàng · còn lại xanh brand) để sidebar và card không nói khác nhau về cùng một phòng.
 */
export function compatibilityColor(percent: number): string {
  if (percent < 40) return "#ef4444";
  if (percent < 70) return "#f59e0b";
  return "var(--color-primary)";
}

