import { create } from "zustand";
import type { DFAConfig } from "../types/dfa";

interface LanguageStore {
  language: DFAConfig | null;
  chain: string | null;
  setLanguage: (language: DFAConfig) => void;
  setChain: (chain: string) => void;
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: null,
  chain: null,
  setLanguage: (language) => set({ language }),
  setChain: (chain) => set({ chain }),
}));
