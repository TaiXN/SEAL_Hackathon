import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  role: string | null;

  // Actions
  setTokens: (access: string, role: string) => void;
  updateAccessToken: (access: string) => void;
  clearTokens: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        accessToken: null,
        role: null,

        // Chỉ lưu Access Token và Role, bơ luôn Refresh Token
        setTokens: (access, role) => set({ accessToken: access, role: role }),

        updateAccessToken: (access) => set({ accessToken: access }),

        clearTokens: () => set({ accessToken: null, role: null }),
      }),
      {
        name: "seal-hackathon-auth",
        storage: createJSONStorage(() => localStorage),
      },
    ),
  ),
);
