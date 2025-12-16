// types.ts
export type Symbol = string; // символ алфавита (длина 1)
export type Alphabet = Set<Symbol>;
export type StateID = string;

export interface DFAState {
  progress: number; // прогресс поиска целевой строки (0...target.length)
  count: number; // количество встреч целевого символа (0...requiredCount+1)
}

export interface DFATransitions {
  [stateID: string]: {
    [symbol: string]: DFAState;
  };
}

export interface DFAConfig {
  alphabet: Symbol[];
  targetString: string;
  targetChar: Symbol;
  requiredCount: number; // кратность вхождения (точное количество)
}

export class InvalidSymbolError extends Error {
  constructor(symbol: string) {
    super(`Символ '${symbol}' не принадлежит алфавиту`);
    this.name = "InvalidSymbolError";
  }
}
