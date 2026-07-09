"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile, User } from "@/types/api";

type AuthState = {
  user: User | null;
  profile: Profile | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (payload: { user: User; profile?: Profile | null; accessToken: string; refreshToken: string }) => void;
  setAccessToken: (token: string) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      accessToken: null,
      refreshToken: null,
      setSession: ({ user, profile = null, accessToken, refreshToken }) => set({ user, profile, accessToken, refreshToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clear: () => set({ user: null, profile: null, accessToken: null, refreshToken: null })
    }),
    { name: "localdrop-auth" }
  )
);
