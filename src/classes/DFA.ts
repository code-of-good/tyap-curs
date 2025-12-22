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
  private readonly startState: DFAState;
  private readonly acceptingStateKeys: Set<string> = new Set();
  private readonly transitions: DFATransitions = {};

  constructor(config: DFAConfig) {
    this.alphabet = new Set(config.alphabet);
    this.targetString = config.targetString;
    this.targetChar = config.targetChar;
    this.requiredCount = config.requiredCount;

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

    this.startState = { progress: 0, count: 0 };

    this.buildStates();
    this.buildTransitions();
    this.buildAcceptingStates();
  }

  private buildStates(): void {
    for (let progress = 0; progress <= this.targetString.length; progress++) {
      for (let count = 0; count <= this.requiredCount + 1; count++) {
        this.states.push({ progress, count });
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

    if (symbol === this.targetChar) {
      if (count <= this.requiredCount) {
        count = count + 1;
      }
    }

    let newProgress = 0;

    if (
      currentState.progress < this.targetString.length &&
      symbol === this.targetString[currentState.progress]
    ) {
      newProgress = currentState.progress + 1;
    } else {
      for (let len = currentState.progress; len > 0; len--) {
        const prefix = this.targetString.slice(0, len - 1);
        const suffixStart = currentState.progress - len + 1;
        const suffix = this.targetString.slice(
          suffixStart,
          currentState.progress
        );

        if (prefix === suffix && symbol === this.targetString[len - 1]) {
          newProgress = len;
          break;
        }
      }

      if (newProgress === 0 && symbol === this.targetString[0]) {
        newProgress = 1;
      }
    }

    return {
      progress: newProgress,
      count,
    };
  }

  private keyToState(key: StateID): DFAState {
    const [, progressStr, countStr] = key.split("_");
    return {
      progress: parseInt(progressStr, 10),
      count: parseInt(countStr, 10),
    };
  }

  accepts(input: string): boolean {
    let currentState = this.startState;

    for (const symbol of input) {
      if (!this.alphabet.has(symbol)) {
        throw new InvalidSymbolError(symbol);
      }

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
      if (!this.alphabet.has(symbol)) {
        break;
      }

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
    return this.states.findIndex(
      (s) => s.progress === state.progress && s.count === state.count
    );
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
