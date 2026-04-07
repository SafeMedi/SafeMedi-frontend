import { create } from "zustand";

export type User = {
  id: string;
  displayName: string | null;
  email: string | null;
  birthDate: string | null;
  height: number | null;
  weight: number | null;
  gender: "male" | "female" | null;
  bloodType: "A" | "B" | "O" | "AB" | null;
  allergies: string[];
  chronicConditions: string[];
  isTutorial: boolean;
};

type UserState = {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (patch: Partial<Omit<User, "id">>) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateUser: (patch) =>
    set((state) => (state.user ? { user: { ...state.user, ...patch } } : state)),
  clearUser: () => set({ user: null }),
}));
