import { create } from "zustand";

type Language = "ar" | "en";
type Theme = "light" | "dark";

interface AppState {
  language: Language;
  theme: Theme;
  isAdmin: boolean;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setAdmin: (isAdmin: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  language: "ar",
  theme: "dark",
  isAdmin: false,
  setLanguage: (lang) => set({ language: lang }),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
  setAdmin: (isAdmin) => set({ isAdmin }),
}));
