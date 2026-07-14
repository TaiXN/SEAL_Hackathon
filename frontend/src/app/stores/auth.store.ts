import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  role: string | null; // chừa chỗ để chứa role (admin, judge, member, leader...)

  // Actions
  setTokens: (access: string, role: string) => void;
  clearTokens: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        accessToken: null,
        role: null,

        // Actions
        setTokens: (access, role) => set({ accessToken: access, role: role }),

        // clear zustand khi đăng xuất hoặc token hết hạn
        clearTokens: () => set({ accessToken: null, role: null }),
      }),
      {
        name: "seal-hackathon-auth", // tên token
        storage: createJSONStorage(() => localStorage),
      },
    ),
  ),
);
