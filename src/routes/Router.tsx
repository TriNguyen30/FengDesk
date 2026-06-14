import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/layouts/AppLayout";
import ManagerLayout from "@/components/layouts/ManagerLayout";
import HomePage from "@/features/home/pages/Home";
import ProductsPage from "@/features/products/pages/ProductsPage";
import ProductDetailPage from "@/features/products/pages/ProductDetailPage";
import DashboardPage from "@/features/manager/pages/DashboardPage";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
      </Route>
      <Route 
        path="/manager" 
        element={
          <ProtectedRoute requireManager>
            <ManagerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}
