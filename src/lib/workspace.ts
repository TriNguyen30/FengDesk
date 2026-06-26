import type { AuthUser } from "@/features/auth/types/auth";

/**
 * Multi-role workspace ("khu làm việc"). Một tài khoản có thể có nhiều role cùng lúc
 * (Customer + GardenOwner, hoặc Staff/Admin) → chia UI theo khu, chọn qua switcher "Đổi khu".
 * Map vào route đang có: Mua sắm `/`, Kênh người bán `/seller`, Quản trị `/manager`.
 * Xem Documents/localDocs/MULTI_ROLE_WORKSPACE.md.
 */
export type WorkspaceKey = "shop" | "seller" | "admin";

export interface WorkspaceDef {
  key: WorkspaceKey;
  label: string;
  route: string;
  /** Hiện khu khi user có quyền. */
  allow: (roles: string[]) => boolean;
}

export const WORKSPACES: WorkspaceDef[] = [
  { key: "shop", label: "Mua sắm", route: "/", allow: () => true },
  {
    key: "seller",
    label: "Kênh người bán",
    route: "/seller",
    allow: (r) => r.includes("GardenOwner"),
  },
  {
    key: "admin",
    label: "Quản trị",
    route: "/manager",
    allow: (r) => r.includes("Staff") || r.includes("Manager") || r.includes("Admin"),
  },
];

/** Lấy role dạng mảng — ưu tiên `roles[]` từ BE, fallback tách chuỗi `role` cũ. */
export function getRoles(user?: Pick<AuthUser, "role" | "roles"> | null): string[] {
  if (!user) return [];
  if (user.roles && user.roles.length > 0) return user.roles;
  return (user.role ?? "")
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);
}

export function getVisibleWorkspaces(roles: string[]): WorkspaceDef[] {
  return WORKSPACES.filter((w) => w.allow(roles));
}

export function isWorkspaceAllowed(key: string | null, roles: string[]): boolean {
  const ws = WORKSPACES.find((w) => w.key === key);
  return !!ws && ws.allow(roles);
}

const LAST_WORKSPACE_KEY = "lastWorkspace";

export function getLastWorkspace(): WorkspaceKey | null {
  return localStorage.getItem(LAST_WORKSPACE_KEY) as WorkspaceKey | null;
}

export function setLastWorkspace(key: WorkspaceKey): void {
  localStorage.setItem(LAST_WORKSPACE_KEY, key);
}

/**
 * Khu mặc định: ưu tiên khu dùng lần cuối (nếu còn quyền), rồi đến vai trò.
 * Số đông là Customer → Mua sắm; nội bộ Staff/Admin → Quản trị; chỉ người bán → Kênh người bán.
 */
export function getDefaultWorkspace(roles: string[]): WorkspaceKey {
  const last = getLastWorkspace();
  if (last && isWorkspaceAllowed(last, roles)) return last;
  if (roles.includes("Customer")) return "shop";
  if (roles.includes("Staff") || roles.includes("Manager") || roles.includes("Admin")) return "admin";
  if (roles.includes("GardenOwner")) return "seller";
  return "shop";
}

export function workspaceRoute(key: WorkspaceKey): string {
  return WORKSPACES.find((w) => w.key === key)?.route ?? "/";
}
