// Wraps every claude.ai/design preview in this app's real context providers
// (Redux store, TanStack Query, router, search) so components that read
// from them (Navbar, WorkspaceSwitcher, CategoryBar, Search, ...) render
// instead of throwing "must be used inside a Provider". Reuses the app's
// real @/app/store rather than reimplementing its slice shapes.
import { useRef, type ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore, type PreloadedState } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { store, type RootState } from "@/app/store";
import { SearchProvider } from "@/features/search";
import authReducer from "@/features/auth/store/authSlice";
import cartReducer from "@/features/cart/store/cartSlice";
import chatboxReducer from "@/features/chatbox/store/chatboxSlice";
import themeReducer from "@/app/store/themeSlice";
import paymentReducer from "@/features/payment/store/paymentSlice";
import notificationReducer from "@/features/notification/store/notificationSlice";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

export function DesignSyncProviders({ children }: { children: ReactNode }) {
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

// A fresh, isolated store per story — for components whose look depends on
// auth/cart/notification state (Navbar, WorkspaceSwitcher). Grid view mounts
// every story in the same page, so dispatching into the shared `store` above
// would leak state between cells; a nested <Provider> with its own store
// shadows the outer one for just that story's subtree.
export function createStoryStore(preloadedState?: PreloadedState<RootState>) {
  return configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
      chatbox: chatboxReducer,
      theme: themeReducer,
      payment: paymentReducer,
      notification: notificationReducer,
    },
    preloadedState,
  });
}

export function StoryStoreProvider({
  preloadedState,
  children,
}: {
  preloadedState?: PreloadedState<RootState>;
  children: ReactNode;
}) {
  const storeRef = useRef<ReturnType<typeof createStoryStore> | null>(null);
  if (!storeRef.current) storeRef.current = createStoryStore(preloadedState);
  return <Provider store={storeRef.current}>{children}</Provider>;
}
