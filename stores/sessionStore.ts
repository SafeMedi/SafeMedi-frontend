import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type SessionState = {
  accessToken: string | null;
  isTutorialCompleted: boolean;
  setAccessToken: (token: string | null) => void;
  setTutorialCompleted: (isCompleted: boolean) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      isTutorialCompleted: false,
      setAccessToken: (accessToken) => set({ accessToken }),
      setTutorialCompleted: (isTutorialCompleted) => set({ isTutorialCompleted }),
      clearSession: () => set({ accessToken: null, isTutorialCompleted: false }),
    }),
    {
      name: "safemedi-session",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        accessToken: s.accessToken,
        isTutorialCompleted: s.isTutorialCompleted,
      }),
    },
  ),
);
