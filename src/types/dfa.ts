export type Symbol = string;
export type Alphabet = Set<Symbol>;
export type StateID = string;

export interface DFAState {
  progress: number;
  count: number;
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
  requiredCount: number;
}

export class InvalidSymbolError extends Error {
  constructor(symbol: string) {
    super(`Символ '${symbol}' не принадлежит алфавиту`);
    this.name = "InvalidSymbolError";
  }
}
