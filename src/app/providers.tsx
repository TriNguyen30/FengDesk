import { ReactNode } from "react";
import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { SearchProvider } from "@/features/search";
import { store } from "./store";
import { queryClient } from "./query-client";

type AppProvidersProps = {
  children: ReactNode;
};

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export default function AppProviders({ children }: AppProvidersProps) {
  const content = (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SearchProvider>{children}</SearchProvider>
        </BrowserRouter>
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      </QueryClientProvider>
    </Provider>
  );

  // Chưa cấu hình VITE_GOOGLE_CLIENT_ID → bỏ qua provider, nút Google sẽ tự ẩn/báo lỗi khi bấm.
  if (!googleClientId) return content;

  return <GoogleOAuthProvider clientId={googleClientId}>{content}</GoogleOAuthProvider>;
}
