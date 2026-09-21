import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/** Sản phẩm đang được hover/focus trong panel sản phẩm — trang chính dùng để vẽ lớp xem trước lên radar. */
export interface HoveredProduct {
  productId: string;
  label: string;
}

type WorkspaceHoverContextType = {
  hovered: HoveredProduct | null;
  setHovered: (product: HoveredProduct | null) => void;
};

const WorkspaceHoverContext = createContext<WorkspaceHoverContextType | undefined>(undefined);

/**
 * Panel sản phẩm (Đã mua / Đề xuất) nằm ở SIDEBAR hồ sơ, còn radar nằm ở nội dung trang — hai nhánh
 * anh em qua <Outlet/>, nên hover phải đi qua context đặt ở ProfileLayout thay vì props.
 */
 
export function WorkspaceHoverProvider({ children }: { children: ReactNode }) {
  const [hovered, setHovered] = useState<HoveredProduct | null>(null);
  const value = useMemo(() => ({ hovered, setHovered }), [hovered]);
  return <WorkspaceHoverContext.Provider value={value}>{children}</WorkspaceHoverContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWorkspaceHover() {
  const ctx = useContext(WorkspaceHoverContext);
  if (!ctx) throw new Error("useWorkspaceHover must be used inside WorkspaceHoverProvider");
  return ctx;
}
