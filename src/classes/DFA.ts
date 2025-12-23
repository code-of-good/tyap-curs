import {
  type Symbol,
  type DFAState,
  type DFATransitions,
  type DFAConfig,
  type StateID,
  InvalidSymbolError,
} from "../types/dfa";

export class DFA {
  private readonly alphabet: Set<Symbol>;
  private readonly targetString: string;
  private readonly targetChar: Symbol;
  private readonly requiredCount: number;

  private readonly states: DFAState[] = [];
  private readonly stateToNumber: Map<string, number> = new Map();
  private readonly startState: DFAState;
  private readonly acceptingStateKeys: Set<string> = new Set();
  private readonly transitions: DFATransitions = {};

  constructor(config: DFAConfig) {
    this.alphabet = new Set(config.alphabet);
    this.targetString = config.targetString;
    this.targetChar = config.targetChar;
    this.requiredCount = config.requiredCount;
    this.startState = { progress: 0, count: 0 };

    if (!this.alphabet.has(this.targetChar)) {
      throw new Error(
        `Целевой символ '${this.targetChar}' отсутствует в алфавите`
      );
    }

    for (const char of this.targetString) {
      if (!this.alphabet.has(char)) {
        throw new Error(
          `Символ '${char}' целевой строки отсутствует в алфавите`
        );
      }
    }

    this.buildStates();
    this.buildTransitions();
    this.buildAcceptingStates();
  }

  private buildStates(): void {
    for (let progress = 0; progress <= this.targetString.length; progress++) {
      for (let count = 0; count <= this.requiredCount + 1; count++) {
        const state = { progress, count };
        this.states.push(state);
        this.stateToNumber.set(this.stateToKey(state), this.states.length - 1);
      }
    }
  }

  private buildAcceptingStates(): void {
    for (const state of this.states) {
      const hasFullSuffix = state.progress === this.targetString.length;
      const hasExactCount = state.count === this.requiredCount;

      if (hasFullSuffix && hasExactCount) {
        this.acceptingStateKeys.add(this.stateToKey(state));
      }
    }
  }

  private buildTransitions(): void {
    for (const state of this.states) {
      const stateKey = this.stateToKey(state);
      this.transitions[stateKey] = {};

      for (const symbol of this.alphabet) {
        const nextState = this.calculateNextState(state, symbol);
        this.transitions[stateKey][symbol] = nextState;
      }
    }
  }

  private calculateNextState(currentState: DFAState, symbol: Symbol): DFAState {
    let { count } = currentState;

    if (symbol === this.targetChar && count <= this.requiredCount) {
      count++;
    }

    if (currentState.progress === this.targetString.length) {
      let newProgress = 0;
      if (symbol === this.targetString[0]) {
        newProgress = 1;
      }
      return {
        progress: newProgress,
        count: Math.min(count, this.requiredCount + 1),
      };
    }

    let newProgress = 0;

    if (symbol === this.targetString[currentState.progress]) {
      newProgress = currentState.progress + 1;
    } else {
      for (let i = currentState.progress; i > 0; i--) {
        if (this.isValidFallback(currentState.progress, i, symbol)) {
          newProgress = i;
          break;
        }
      }

      if (newProgress === 0 && symbol === this.targetString[0]) {
        newProgress = 1;
      }
    }

    return {
      progress: Math.min(newProgress, this.targetString.length),
      count: Math.min(count, this.requiredCount + 1),
    };
  }

  private isValidFallback(
    currentProgress: number,
    newProgress: number,
    symbol: string
  ): boolean {
    if (symbol !== this.targetString[newProgress - 1]) {
      return false;
    }

    for (let i = 0; i < newProgress - 1; i++) {
      const prefixChar = this.targetString[i];
      const suffixChar =
        this.targetString[currentProgress - newProgress + 1 + i];
      if (prefixChar !== suffixChar) {
        return false;
      }
    }

    return true;
  }

  private keyToState(key: StateID): DFAState {
    const [, progressStr, countStr] = key.split("_");
    return {
      progress: parseInt(progressStr, 10),
      count: parseInt(countStr, 10),
    };
  }

  private validateSymbol(symbol: string): void {
    if (!this.alphabet.has(symbol)) {
      throw new InvalidSymbolError(symbol);
    }
  }

  accepts(input: string): boolean {
    let currentState = this.startState;

    for (const symbol of input) {
      this.validateSymbol(symbol);

      const stateKey = this.stateToKey(currentState);
      currentState = this.transitions[stateKey][symbol];
    }

    const finalStateKey = this.stateToKey(currentState);
    return this.acceptingStateKeys.has(finalStateKey);
  }

  trace(input: string): Array<{
    from: DFAState;
    symbol: string;
    to: DFAState;
  }> {
    const trace: Array<{ from: DFAState; symbol: string; to: DFAState }> = [];

    let currentState = this.startState;

    for (const symbol of input) {
      this.validateSymbol(symbol);

      const stateKey = this.stateToKey(currentState);
      const nextState = this.transitions[stateKey][symbol];

      trace.push({
        from: currentState,
        symbol,
        to: nextState,
      });

      currentState = nextState;
    }

    return trace;
  }

  isAcceptingState(state: DFAState): boolean {
    const stateKey = this.stateToKey(state);
    return this.acceptingStateKeys.has(stateKey);
  }

  isOverflowState(state: DFAState): boolean {
    return state.count > this.requiredCount;
  }

  getStates(): DFAState[] {
    return [...this.states];
  }

  getStartState(): DFAState {
    return this.startState;
  }

  stateToKey(state: DFAState): StateID {
    return `q_${state.progress}_${state.count}`;
  }

  getStateNumber(state: DFAState): number {
    const stateKey = this.stateToKey(state);
    return this.stateToNumber.get(stateKey) ?? -1;
  }

  formatState(state: DFAState): string {
    const number = this.getStateNumber(state);
    const suffixInfo = `${state.progress}/${this.targetString.length}`;

    return `q${number}(прогр: ${suffixInfo}, счет: ${state.count})`;
  }

  getTransitionsList(): Array<{
    from: DFAState;
    symbol: string;
    to: DFAState;
  }> {
    const result = [];

    for (const [fromKey, symbolMap] of Object.entries(this.transitions)) {
      const fromState = this.keyToState(fromKey);

      for (const [symbol, toState] of Object.entries(symbolMap)) {
        result.push({
          from: fromState,
          symbol,
          to: toState,
        });
      }
    }

    return result;
  }
}
