import type { LanguageDescription } from "../types/language";

export function validateLanguage(language: LanguageDescription): void {
  const { alphabet, requiredSuffix, selectedSymbol, symbolCount } = language;

  if (!Array.isArray(alphabet) || alphabet.length === 0) {
    throw new Error("Алфавит должен быть непустым массивом");
  }

  if (typeof requiredSuffix !== "string") {
    throw new Error("Суффикс должен быть строкой");
  }

  if (!alphabet.includes(selectedSymbol)) {
    throw new Error("Символ должен быть в алфавите");
  }

  if (!Number.isInteger(symbolCount) || symbolCount < 1) {
    throw new Error("Кратность должна быть целым числом >= 1");
  }
}

