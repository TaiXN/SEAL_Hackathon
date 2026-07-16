import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  role: string | null;

  setTokens: (access: string, refresh: string, role: string) => void;
  updateAccessToken: (access: string) => void;
  clearTokens: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        accessToken: null,
        refreshToken: null,
        role: null,

        setTokens: (access, refresh, role) =>
          set({ accessToken: access, refreshToken: refresh, role: role }),

        updateAccessToken: (access) => set({ accessToken: access }),

        clearTokens: () =>
          set({ accessToken: null, refreshToken: null, role: null }),
      }),
      {
        name: "seal-hackathon-auth",
        storage: createJSONStorage(() => localStorage),
      },
    ),
  ),
);
