import AppRoutes from "@/routes/Router";
import { SearchProvider } from "@/features/search";
import { BrowserRouter } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <SearchProvider>
        <AppRoutes />
      </SearchProvider>
    </BrowserRouter>
  );
}
