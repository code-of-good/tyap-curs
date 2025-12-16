import type { DFAConfig } from "../types/dfa";

export function validateLanguage(language: DFAConfig): void {
  const { alphabet, targetString, targetChar, requiredCount } = language;

  if (!Array.isArray(alphabet) || alphabet.length === 0) {
    throw new Error("Алфавит должен быть непустым массивом");
  }

  if (typeof targetString !== "string") {
    console.log(targetString);
    throw new Error("Суффикс должен быть строкой");
  }

  if (!alphabet.includes(targetChar)) {
    throw new Error("Символ должен быть в алфавите");
  }

  if (!Number.isInteger(requiredCount) || requiredCount < 1) {
    throw new Error("Кратность должна быть целым числом >= 1");
  }
}
