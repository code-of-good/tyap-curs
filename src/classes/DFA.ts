// DFA.ts
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
  private readonly minCount: number;

  private readonly states: DFAState[] = [];
  private readonly startState: DFAState;
  private readonly acceptingStateKeys: Set<string> = new Set();
  private readonly transitions: DFATransitions = {};

  private readonly prefixFunction: number[];

  constructor(config: DFAConfig) {
    this.alphabet = new Set(config.alphabet);
    this.targetString = config.targetString;
    this.targetChar = config.targetChar;
    this.minCount = config.minCount;

    // Проверяем, что целевой символ есть в алфавите
    if (!this.alphabet.has(this.targetChar)) {
      throw new Error(
        `Целевой символ '${this.targetChar}' отсутствует в алфавите`
      );
    }

    // Проверяем, что все символы целевой строки есть в алфавите
    for (const char of this.targetString) {
      if (!this.alphabet.has(char)) {
        throw new Error(
          `Символ '${char}' целевой строки отсутствует в алфавите`
        );
      }
    }

    // Предвычисляем префикс-функцию
    this.prefixFunction = this.computePrefixFunction(this.targetString);

    // Строим состояния и переходы
    this.buildStates();
    this.buildTransitions();

    // Определяем начальное состояние
    this.startState = { progress: 0, count: 0 };

    // Определяем конечные состояния (быстрый доступ через Set)
    this.buildAcceptingStates();
  }

  /**
   * Вычисляет префикс-функцию для строки
   */
  computePrefixFunction(str: string): number[] {
    const prefix: number[] = new Array(str.length).fill(0);

    for (let i = 1; i < str.length; i++) {
      let j = prefix[i - 1];

      while (j > 0 && str[i] !== str[j]) {
        j = prefix[j - 1];
      }

      if (str[i] === str[j]) {
        j++;
      }

      prefix[i] = j;
    }

    return prefix;
  }

  /**
   * Создает все возможные состояния ДКА
   */
  private buildStates(): void {
    // progress: 0...targetString.length
    // count: 0...minCount
    for (let progress = 0; progress <= this.targetString.length; progress++) {
      for (let count = 0; count <= this.minCount; count++) {
        this.states.push({ progress, count });
      }
    }
  }

  /**
   * Определяет конечные (принимающие) состояния
   */
  private buildAcceptingStates(): void {
    for (const state of this.states) {
      if (
        state.progress === this.targetString.length &&
        state.count === this.minCount
      ) {
        this.acceptingStateKeys.add(this.stateToKey(state));
      }
    }
  }

  /**
   * Строит таблицу переходов между состояниями
   */
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

  /**
   * Вычисляет следующее состояние на основе текущего состояния и символа
   */
  private calculateNextState(currentState: DFAState, symbol: Symbol): DFAState {
    let { progress, count } = currentState;

    // 1. Обновляем счетчик целевого символа
    if (symbol === this.targetChar) {
      count = Math.min(count + 1, this.minCount);
    }

    // 2. Обновляем прогресс поиска подстроки
    // Если УЖЕ нашли всю строку — оставляем как есть
    if (progress < this.targetString.length) {
      // Используем префикс-функцию для умного поиска
      while (progress > 0 && symbol !== this.targetString[progress]) {
        progress = this.prefixFunction[progress - 1];
      }

      if (symbol === this.targetString[progress]) {
        progress++;
      } else {
        progress = 0;
      }
    }
    // Если progress === targetString.length — оставляем как есть!
    // Это означает "уже нашли нужную подстроку"

    return { progress, count };
  }

  /**
   * Преобразует строковый ключ в состояние
   */
  private keyToState(key: StateID): DFAState {
    const [, progressStr, countStr] = key.split("_");
    return {
      progress: parseInt(progressStr, 10),
      count: parseInt(countStr, 10),
    };
  }

  /**
   * Проверяет, принимает ли автомат данную строку
   */
  accepts(input: string): boolean {
    let currentState = this.startState;

    for (const symbol of input) {
      if (!this.alphabet.has(symbol)) {
        throw new InvalidSymbolError(symbol);
      }

      const stateKey = this.stateToKey(currentState);
      currentState = this.transitions[stateKey][symbol];
    }

    // Быстрая проверка через Set
    const finalStateKey = this.stateToKey(currentState);
    return this.acceptingStateKeys.has(finalStateKey);
  }

  /**
   * Трассирует обработку строки через автомат
   * Возвращает последовательность состояний
   */
  trace(input: string): Array<{ state: DFAState; symbol?: string }> {
    const trace: Array<{ state: DFAState; symbol?: string }> = [
      { state: this.startState },
    ];

    let currentState = this.startState;

    for (const symbol of input) {
      if (!this.alphabet.has(symbol)) {
        break; // или можно бросить ошибку
      }

      const stateKey = this.stateToKey(currentState);
      currentState = this.transitions[stateKey][symbol];
      trace.push({ state: currentState, symbol });
    }

    return trace;
  }

  /**
   * Возвращает все принимающие строки заданной длины
   * ВНИМАНИЕ: Экспоненциальная сложность! Используйте с осторожностью
   */
  generateAcceptedStrings(maxLength: number): string[] {
    if (maxLength > 6) {
      console.warn(
        `Генерация строк длины ${maxLength} может занять много времени!`
      );
    }

    const result: string[] = [];

    const dfs = (
      state: DFAState,
      currentString: string,
      length: number
    ): void => {
      if (length === maxLength) {
        if (this.isAcceptingState(state)) {
          result.push(currentString);
        }
        return;
      }

      const stateKey = this.stateToKey(state);

      for (const symbol of this.alphabet) {
        const nextState = this.transitions[stateKey][symbol];
        dfs(nextState, currentString + symbol, length + 1);
      }
    };

    dfs(this.startState, "", 0);
    return result;
  }

  /**
   * Проверяет, является ли состояние принимающим
   */
  isAcceptingState(state: DFAState): boolean {
    const stateKey = this.stateToKey(state);
    return this.acceptingStateKeys.has(stateKey);
  }

  /**
   * Возвращает все состояния ДКА
   */
  getStates(): DFAState[] {
    return [...this.states];
  }

  /**
   * Возвращает начальное состояние
   */
  getStartState(): DFAState {
    return this.startState;
  }

  /**
   * Преобразует состояние в строковый ключ (публичный метод)
   */
  stateToKey(state: DFAState): StateID {
    return `q_${state.progress}_${state.count}`;
  }

  /**
   * Возвращает номер состояния в массиве состояний
   */
  getStateNumber(state: DFAState): number {
    return this.states.findIndex(
      (s) => s.progress === state.progress && s.count === state.count
    );
  }

  /**
   * Форматирует состояние для отображения с номером
   */
  formatState(state: DFAState): string {
    const number = this.getStateNumber(state);
    return `q${number}(${state.progress}, ${state.count})`;
  }

  /**
   * Возвращает информацию об автомате
   */
  getInfo(): {
    alphabetSize: number;
    statesCount: number;
    acceptingStatesCount: number;
    transitionsCount: number;
    targetString: string;
    targetChar: string;
    minCount: number;
  } {
    return {
      alphabetSize: this.alphabet.size,
      statesCount: this.states.length,
      acceptingStatesCount: this.acceptingStateKeys.size,
      transitionsCount:
        Object.keys(this.transitions).length * this.alphabet.size,
      targetString: this.targetString,
      targetChar: this.targetChar,
      minCount: this.minCount,
    };
  }

  /**
   * Экспортирует автомат в формате DOT для визуализации (Graphviz)
   */
  toDot(): string {
    let dot = "digraph DFA {\n";
    dot += "  rankdir=LR;\n";
    dot += "  node [shape=circle];\n\n";

    // Начальное состояние
    const startKey = this.stateToKey(this.startState);
    dot += `  "${startKey}" [shape=circle, label="start"];\n`;
    dot += `  "start" [shape=none, label=""];\n`;
    dot += `  "start" -> "${startKey}";\n\n`;

    // Конечные состояния
    for (const state of this.states) {
      const key = this.stateToKey(state);
      if (this.isAcceptingState(state)) {
        dot += `  "${key}" [shape=doublecircle, label="${state.progress},${state.count}"];\n`;
      }
    }

    // Остальные состояния
    for (const state of this.states) {
      const key = this.stateToKey(state);
      if (!this.isAcceptingState(state) && key !== startKey) {
        dot += `  "${key}" [label="${state.progress},${state.count}"];\n`;
      }
    }

    dot += "\n";

    // Группируем переходы для лучшей читаемости
    const transitionMap: Map<string, Map<string, string[]>> = new Map();

    for (const [fromKey, trans] of Object.entries(this.transitions)) {
      for (const [symbol, toState] of Object.entries(trans)) {
        const toKey = this.stateToKey(toState);

        if (!transitionMap.has(toKey)) {
          transitionMap.set(toKey, new Map());
        }

        const fromMap = transitionMap.get(toKey)!;
        if (!fromMap.has(fromKey)) {
          fromMap.set(fromKey, []);
        }

        fromMap.get(fromKey)!.push(symbol);
      }
    }

    // Рисуем переходы
    for (const [toKey, fromMap] of transitionMap) {
      for (const [fromKey, symbols] of fromMap) {
        const label = this.formatTransitionLabel(symbols);
        dot += `  "${fromKey}" -> "${toKey}" [label="${label}"];\n`;
      }
    }

    dot += "}\n";
    return dot;
  }

  /**
   * Форматирует метку перехода для DOT
   */
  private formatTransitionLabel(symbols: string[]): string {
    if (symbols.length === 1) return symbols[0];
    if (symbols.length <= 3) return symbols.join(",");
    if (symbols.length === this.alphabet.size) return "Σ"; // весь алфавит

    // Показываем первые 3 символа и количество остальных
    const shown = symbols.slice(0, 3).join(",");
    const remaining = symbols.length - 3;
    return `${shown},+${remaining}`;
  }

  /**
   * Возвращает текущее состояние без обработки символов
   * (может быть полезно для отладки)
   */
  getCurrentState(input: string): DFAState {
    let currentState = this.startState;

    for (const symbol of input) {
      if (!this.alphabet.has(symbol)) {
        throw new InvalidSymbolError(symbol);
      }

      const stateKey = this.stateToKey(currentState);
      currentState = this.transitions[stateKey][symbol];
    }

    return currentState;
  }

  /**
   * Проверяет, находится ли автомат в принимающем состоянии
   */
  isInAcceptingState(input: string): boolean {
    const state = this.getCurrentState(input);
    return this.isAcceptingState(state);
  }

  /**
   * Минимизация ДКА (заглушка)
   * В реальной реализации здесь будет алгоритм минимизации
   */
  minimize(): DFA {
    console.warn(
      "Минимизация ДКА не реализована. Возвращается исходный автомат."
    );
    return this;
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
