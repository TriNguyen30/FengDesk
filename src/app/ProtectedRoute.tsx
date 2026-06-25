import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/app/store";

type ProtectedRouteProps = {
  children: React.ReactElement;
  requireAdmin?: boolean;
  requireCustomer?: boolean;
  requireStaff?: boolean;
  requireManager?: boolean;
  /** Staff trở lên: Staff, Manager, Admin (khu điều hành / hỗ trợ khách hàng). */
  requireStaffOrAbove?: boolean;
  /** Người bán: có flag GardenOwner (khu kênh người bán). */
  requireGardenOwner?: boolean;
};

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireCustomer = false,
  requireStaff = false,
  requireManager = false,
  requireStaffOrAbove = false,
  requireGardenOwner = false,
}: ProtectedRouteProps) {
  const { token, user } = useAppSelector((state) => state.auth);

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  // user.role có thể là chuỗi nhiều role (UserRole [Flags] ToString → "Customer, Staff").
  const roles = (user.role ?? "").split(",").map((r) => r.trim());
  const has = (role: string) => roles.includes(role);

  if (requireAdmin && !has("Admin")) {
    return <Navigate to="/" replace />;
  }

  if (requireCustomer && !has("Customer")) {
    return <Navigate to="/" replace />;
  }

  if (requireStaff && !has("Staff")) {
    return <Navigate to="/manager" replace />;
  }

  if (requireManager && !has("Manager") && !has("Admin")) {
    return <Navigate to="/manager" replace />;
  }

  if (requireStaffOrAbove && !(has("Staff") || has("Manager") || has("Admin"))) {
    return <Navigate to="/" replace />;
  }

  if (requireGardenOwner && !has("GardenOwner")) {
    return <Navigate to="/become-seller" replace />;
  }

  return children;
}
