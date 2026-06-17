import AppProviders from "./providers";
import AppRoutes from "./router";

export default function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}
