import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/layouts/AppLayout";
import ManagerLayout from "@/components/layouts/ManagerLayout";
import HomePage from "@/features/home/pages/Home";
import ProductsPage from "@/features/products/pages/ProductsPage";
import ProductDetailPage from "@/features/products/pages/ProductDetailPage";
import ShopDetailPage from "@/features/shop/pages/ShopDetailPage";
import DashboardPage from "@/features/manager/pages/DashboardPage";
import ManageProductsPage from "@/features/manager/pages/ManageProductsPage";
import CreateProductPage from "@/features/manager/pages/CreateProductPage";
import EditProductPage from "@/features/manager/pages/EditProductPage";
import ManageStoresPage from "@/features/manager/pages/ManageStoresPage";
import ManageOrdersPage from "@/features/manager/pages/ManageOrdersPage";
import StaffSupportPage from "@/features/chatbox/pages/StaffSupportPage";
import CartPage from "@/features/cart/pages/CartPage";
import ProtectedRoute from "./ProtectedRoute";
import ManageOrderReturnPage from "@/features/manager/pages/ManageOrderReturnPage";

// Profile Pages
import ProfileLayout from "@/features/users/pages/ProfileLayout";
import ProfileInfoPage from "@/features/users/pages/ProfileInfoPage";
import ProfileWorkspace from "@/features/users/pages/ProfileWorkspace";
import AddressBookPage from "@/features/users/pages/AddressBookPage";
import CheckoutPage from "@/features/orders/pages/CheckoutPage";
import OrdersPage from "@/features/orders/pages/OrdersPage";
import OrderDetailPage from "@/features/orders/pages/OrderDetailPage";
import { PaymentSuccessPage, PaymentCancelPage } from "@/features/payment";
import NotificationPage from "@/features/notification/pages/NotificationPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/stores/:id" element={<ShopDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/success"
          element={
            <ProtectedRoute>
              <PaymentSuccessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/cancel"
          element={
            <ProtectedRoute>
              <PaymentCancelPage />
            </ProtectedRoute>
          }
        />

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
          <Route path="workspace" element={<ProfileWorkspace />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="notifications" element={<NotificationPage />} />
        </Route>
      </Route>
      <Route
        path="/manager"
        element={
          <ProtectedRoute requireStaffOrAbove>
            <ManagerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<ManageProductsPage />} />
        <Route path="products/new" element={<CreateProductPage />} />
        <Route path="products/:id/edit" element={<EditProductPage />} />
        <Route path="stores" element={<ManageStoresPage />} />
        <Route path="orders" element={<ManageOrdersPage />} />
        <Route path="order-returns" element={<ManageOrderReturnPage />} />
        <Route path="customers" element={<StaffSupportPage />} />
      </Route>
    </Routes>
  );
}
