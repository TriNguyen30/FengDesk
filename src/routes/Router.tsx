import { Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layouts/AppLayout";
import HomePage from "@/features/home/pages/Home";
import ProductsPage from "@/features/products/pages/ProductsPage";
import ProductDetailPage from "@/features/products/pages/ProductDetailPage";

// function PlaceholderPage({ title }: { title: string }) {
//   return (
//     <main className="mx-auto max-w-7xl px-4 py-10">
//       <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
//     </main>
//   );
// }

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
      </Route>
    </Routes>
  );
}
