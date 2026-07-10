import WorkspaceSwitcher from "@/components/ui/WorkspaceSwitcher";
import { StoryStoreProvider } from "../mocks/DesignSyncProviders";

// Renders null unless the user is logged in AND has access to more than one
// workspace — a hybrid Customer + GardenOwner (seller) account is the
// realistic case where the switcher actually shows.
export function Default() {
  return (
    <StoryStoreProvider
      preloadedState={{
        auth: {
          token: "demo-token",
          refreshToken: "demo-refresh-token",
          user: {
            id: "user-2",
            email: "seller.demo@example.com",
            fullName: "Minh Trần",
            role: "Customer, GardenOwner",
            roles: ["Customer", "GardenOwner"],
          },
          role: "Customer, GardenOwner",
          authModal: null,
        },
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end", padding: 12 }}>
        <WorkspaceSwitcher />
      </div>
    </StoryStoreProvider>
  );
}
