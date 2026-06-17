import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/app/store";

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
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && user.role !== "Admin") {
    return <Navigate to="/admin" replace />;
  }

  if (requireCustomer && user.role !== "Customer") {
    return <Navigate to="/" replace />;
  }

  if (requireStaff && user.role !== "Staff") {
    return <Navigate to="/manager" replace />;
  }

  if (requireManager && user.role !== "Manager") {
    return <Navigate to="/manager" replace />;
  }

  return children;
}
