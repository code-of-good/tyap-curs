import { create } from "zustand";
import type { LanguageDescription } from "../types/language";

interface LanguageStore {
  language: LanguageDescription | null;
  setLanguage: (language: LanguageDescription) => void;
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: null,
  setLanguage: (language) => set({ language }),
}));
