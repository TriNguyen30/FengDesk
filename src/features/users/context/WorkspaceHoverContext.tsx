import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

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
 * Panel sản phẩm (Đã mua) nằm ở SIDEBAR hồ sơ, còn radar nằm ở nội dung trang — hai nhánh anh em qua
 * <Outlet/>, nên hover phải đi qua context đặt ở ProfileLayout thay vì props.
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

/** Trễ nhỏ trước khi báo hover — quét chuột lướt qua danh sách không bắn một loạt request fit. */
const HOVER_DELAY_MS = 120;

/**
 * Hover có trễ; rời chuột thì hủy ngay để radar không "nhảy" theo món đã rời. Dùng chung cho panel
 * "Đã mua" ở sidebar và lưới "Đề xuất" ở nội dung chính.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useProductHoverIntent() {
  const { hovered, setHovered } = useWorkspaceHover();
  const timer = useRef<number | null>(null);

  const beginHover = useCallback(
    (product: HoveredProduct) => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setHovered(product), HOVER_DELAY_MS);
    },
    [setHovered],
  );

  const endHover = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setHovered(null);
  }, [setHovered]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  return { hovered, beginHover, endHover };
}
