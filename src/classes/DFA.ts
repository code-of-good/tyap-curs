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

  // Буфер для хранения последних N символов цепочки (N = длина targetString)
  // Используется для проверки обязательной конечной подцепочки
  private readonly suffixBuffer: Map<StateID, string> = new Map();

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

    // Строим состояния и переходы
    this.buildStates();
    this.buildTransitions();

    // Определяем начальное состояние
    // progress = 0 означает "еще не начали собирать суффикс"
    // Для пустого буфера используем специальное значение
    this.startState = { progress: 0, count: 0 };
    this.suffixBuffer.set(this.stateToKey(this.startState), "");

    // Определяем конечные состояния (быстрый доступ через Set)
    this.buildAcceptingStates();
  }

  /**
   * Создает все возможные состояния ДКА
   * progress теперь означает: длина собранного суффикса (0...targetString.length)
   */
  private buildStates(): void {
    // progress: 0...targetString.length (длина собранного суффикса)
    // count: 0...minCount+1 (количество целевых символов)
    // minCount+1 используется для отслеживания превышения кратности
    for (let progress = 0; progress <= this.targetString.length; progress++) {
      for (let count = 0; count <= this.minCount + 1; count++) {
        this.states.push({ progress, count });
      }
    }
  }

  /**
   * Определяет конечные (принимающие) состояния
   */
  private buildAcceptingStates(): void {
    for (const state of this.states) {
      // Принимающее состояние должно:
      // 1. Иметь progress = targetString.length (цепочка заканчивается на обязательную подцепочку)
      // 2. Иметь ровно нужное количество targetChar (кратность означает точное количество вхождений)
      const hasFullSuffix = state.progress === this.targetString.length;
      const hasExactCount = state.count === this.minCount;

      if (hasFullSuffix && hasExactCount) {
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

      // Получаем текущий буфер для этого состояния
      const currentBuffer = this.suffixBuffer.get(stateKey) || "";

      for (const symbol of this.alphabet) {
        const nextState = this.calculateNextState(state, currentBuffer, symbol);
        this.transitions[stateKey][symbol] = nextState;

        // Вычисляем и сохраняем буфер для следующего состояния
        const nextStateKey = this.stateToKey(nextState);
        if (!this.suffixBuffer.has(nextStateKey)) {
          const nextBuffer = (currentBuffer + symbol).slice(
            -this.targetString.length
          );
          this.suffixBuffer.set(nextStateKey, nextBuffer);
        }
      }
    }
  }

  /**
   * Вычисляет следующее состояние на основе текущего состояния, буфера и символа
   */
  private calculateNextState(
    currentState: DFAState,
    currentBuffer: string,
    symbol: Symbol
  ): DFAState {
    let { count } = currentState;

    // 1. Обновляем счетчик целевого символа
    // Если count уже достиг minCount, увеличиваем до minCount+1 для отслеживания превышения
    if (symbol === this.targetChar) {
      if (count <= this.minCount) {
        count = count + 1;
      }
      // Если count уже minCount+1, оставляем как есть (превышение уже зафиксировано)
    }

    // 2. Обновляем прогресс сборки суффикса
    // Добавляем символ к буферу (храним последние N символов, где N = длина targetString)
    const newBuffer = (currentBuffer + symbol).slice(-this.targetString.length);

    // Проверяем, сколько символов с конца буфера совпадают с началом целевой строки
    // Это нужно для отслеживания прогресса поиска конечной подцепочки
    let newProgress = 0;

    // Проверяем от самой длинной возможной подстроки до самой короткой
    for (
      let len = Math.min(newBuffer.length, this.targetString.length);
      len > 0;
      len--
    ) {
      const suffix = newBuffer.slice(-len);
      const targetPrefix = this.targetString.slice(0, len);

      if (suffix === targetPrefix) {
        newProgress = len;
        break;
      }
    }

    // Специальный случай: если символ совпадает с первым символом целевой строки
    if (newProgress === 0 && symbol === this.targetString[0]) {
      newProgress = 1;
    }

    // Важно: progress = targetString.length означает, что последние символы буфера
    // полностью совпадают с targetString, т.е. цепочка заканчивается на targetString

    return {
      progress: newProgress,
      count,
    };
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
    let currentBuffer = ""; // Начинаем с пустого буфера

    for (const symbol of input) {
      if (!this.alphabet.has(symbol)) {
        throw new InvalidSymbolError(symbol);
      }

      const stateKey = this.stateToKey(currentState);

      // Обновляем буфер
      currentBuffer = (currentBuffer + symbol).slice(-this.targetString.length);

      // Получаем следующее состояние
      currentState = this.transitions[stateKey][symbol];

      // Обновляем буфер для нового состояния
      const newStateKey = this.stateToKey(currentState);
      if (!this.suffixBuffer.has(newStateKey)) {
        this.suffixBuffer.set(newStateKey, currentBuffer);
      }
    }

    // Быстрая проверка через Set
    const finalStateKey = this.stateToKey(currentState);
    return this.acceptingStateKeys.has(finalStateKey);
  }

  /**
   * Трассирует обработку строки через автомат
   * Возвращает последовательность состояний
   */
  trace(input: string): Array<{
    state: DFAState;
    symbol?: string;
    buffer?: string; // Добавляем буфер для отладки
  }> {
    const trace: Array<{ state: DFAState; symbol?: string; buffer?: string }> =
      [
        {
          state: this.startState,
          buffer: "",
        },
      ];

    let currentState = this.startState;
    let currentBuffer = "";

    for (const symbol of input) {
      if (!this.alphabet.has(symbol)) {
        break; // или можно бросить ошибку
      }

      const stateKey = this.stateToKey(currentState);

      // Обновляем буфер
      currentBuffer = (currentBuffer + symbol).slice(-this.targetString.length);

      // Получаем следующее состояние
      currentState = this.transitions[stateKey][symbol];

      trace.push({
        state: currentState,
        symbol,
        buffer: currentBuffer,
      });
    }

    return trace;
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
   * Добавляем информацию о буфере для ясности
   */
  formatState(state: DFAState): string {
    const number = this.getStateNumber(state);
    const stateKey = this.stateToKey(state);
    const buffer = this.suffixBuffer.get(stateKey) || "";
    const bufferDisplay = buffer === "" ? "ε" : buffer;

    // progress показывает, сколько символов суффикса уже собрано
    const suffixInfo = `${state.progress}/${this.targetString.length}`;

    return `q${number}(прогр: ${suffixInfo}, счет: ${state.count}, буфер: "${bufferDisplay}")`;
  }

  getTransitionsList(): Array<{
    from: DFAState;
    symbol: string;
    to: DFAState;
    fromBuffer?: string;
    toBuffer?: string;
  }> {
    const result = [];

    for (const [fromKey, symbolMap] of Object.entries(this.transitions)) {
      const fromState = this.keyToState(fromKey);
      const fromBuffer = this.suffixBuffer.get(fromKey) || "";

      for (const [symbol, toState] of Object.entries(symbolMap)) {
        const toKey = this.stateToKey(toState);
        const toBuffer = this.suffixBuffer.get(toKey) || "";

        result.push({
          from: fromState,
          symbol,
          to: toState,
          fromBuffer,
          toBuffer,
        });
      }
    }

    return result;
  }

  /**
   * Получить буфер для состояния
   */
  getBufferForState(state: DFAState): string {
    const stateKey = this.stateToKey(state);
    return this.suffixBuffer.get(stateKey) || "";
  }

  /**
   * Получить целевой суффикс (для отображения в интерфейсе)
   */
  getTargetString(): string {
    return this.targetString;
  }

  /**
   * Получить целевой символ
   */
  getTargetChar(): string {
    return this.targetChar;
  }

  /**
   * Получить минимальное количество
   */
  getMinCount(): number {
    return this.minCount;
  }

  /**
   * Получить алфавит
   */
  getAlphabet(): Symbol[] {
    return Array.from(this.alphabet);
  }

  /**
   * Проверить, заканчивается ли строка на целевой суффикс
   * Вспомогательный метод для демонстрации
   */
  checkSuffixManually(str: string): boolean {
    if (str.length < this.targetString.length) {
      return false;
    }
    return str.endsWith(this.targetString);
  }

  /**
   * Подсчитать целевые символы в строке
   * Вспомогательный метод для демонстрации
   */
  countTargetChars(str: string): number {
    let count = 0;
    for (const char of str) {
      if (char === this.targetChar) {
        count++;
      }
    }
    return count;
  }
}
