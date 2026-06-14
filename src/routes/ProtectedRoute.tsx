import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";

type ProtectedRouteProps = {
  children: React.ReactElement;
  requireAdmin?: boolean;
  requireCustomer?: boolean;
  requireStaff?: boolean;
  requireManager?: boolean;
};

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireCustomer = false,
  requireStaff = false,
  requireManager = false,
}: ProtectedRouteProps) {
  const { token, user } = useAppSelector((state) => state.auth);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== "Admin") {
    return <Navigate to="/" replace />;
  }

  if (requireCustomer && user.role !== "Customer") {
    return <Navigate to="/" replace />;
  }

  if (requireStaff && user.role !== "Staff") {
    return <Navigate to="/" replace />;
  }

  if (requireManager && user.role !== "Manager") {
    return <Navigate to="/" replace />;
  }

  return children;
}
