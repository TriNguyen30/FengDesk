import Navbar from "@/components/ui/Navbar";
import { StoryStoreProvider } from "../mocks/DesignSyncProviders";

export function LoggedOut() {
  return (
    <StoryStoreProvider>
      <Navbar />
    </StoryStoreProvider>
  );
}

export function LoggedIn() {
  return (
    <StoryStoreProvider
      preloadedState={{
        auth: {
          token: "demo-token",
          refreshToken: "demo-refresh-token",
          user: {
            id: "user-1",
            email: "an.nguyen@example.com",
            fullName: "An Nguyễn",
            role: "Customer",
            roles: ["Customer"],
          },
          role: "Customer",
          authModal: null,
        },
      }}
    >
      <Navbar />
    </StoryStoreProvider>
  );
}
