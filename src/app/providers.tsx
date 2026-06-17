import { ReactNode } from "react";
import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { SearchProvider } from "@/features/search";
import { store } from "./store";
import { queryClient } from "./query-client";

type AppProvidersProps = {
  children: ReactNode;
};

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <SearchProvider>{children}</SearchProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}
