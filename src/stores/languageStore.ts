import { create } from "zustand";
import type { LanguageDescription } from "../types/language";

interface LanguageStore {
  language: LanguageDescription | null;
  chain: string | null;
  setLanguage: (language: LanguageDescription) => void;
  setChain: (chain: string) => void;
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: null,
  chain: null,
  setLanguage: (language) => set({ language }),
  setChain: (chain) => set({ chain }),
}));
