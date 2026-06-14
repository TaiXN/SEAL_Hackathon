import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  role: string | null; // chừa chỗ để chứa role (admin, judge, member, leader...)
  // refreshToken: string | null; cái này lưu trên cookie

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

        // Dọn sạch két sắt khi đăng xuất hoặc thẻ hết hạn
        clearTokens: () => set({ accessToken: null, role: null }),
      }),
      {
        name: "seal-hackathon-auth", // tên két sắt
        storage: createJSONStorage(() => localStorage),
      },
    ),
  ),
);
