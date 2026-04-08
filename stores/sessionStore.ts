import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type SessionState = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      setAccessToken: (accessToken) => set({ accessToken }),
      clearSession: () => set({ accessToken: null }),
    }),
    {
      name: "safemedi-session",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ accessToken: s.accessToken }),
    },
  ),
);
