import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/layouts/AppLayout";
import ManagerLayout from "@/components/layouts/ManagerLayout";
import HomePage from "@/features/home/pages/Home";
import ProductsPage from "@/features/products/pages/ProductsPage";
import ProductDetailPage from "@/features/products/pages/ProductDetailPage";
import DashboardPage from "@/features/manager/pages/DashboardPage";
import CartPage from "@/features/cart/pages/CartPage";
import ProtectedRoute from "./ProtectedRoute";

// Profile Pages
import ProfileLayout from "@/features/users/pages/ProfileLayout";
import ProfileInfoPage from "@/features/users/pages/ProfileInfoPage";
import AddressBookPage from "@/features/users/pages/AddressBookPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />

        {/* Protected Profile Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="info" replace />} />
          <Route path="info" element={<ProfileInfoPage />} />
          <Route path="addresses" element={<AddressBookPage />} />
          <Route
            path="orders"
            element={<div className="p-4 text-center">Đơn hàng của tôi đang phát triển...</div>}
          />
        </Route>
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
