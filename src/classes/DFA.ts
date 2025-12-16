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
  private readonly requiredCount: number; // кратность вхождения (точное количество)

  private readonly states: DFAState[] = [];
  private readonly startState: DFAState;
  private readonly acceptingStateKeys: Set<string> = new Set();
  private readonly transitions: DFATransitions = {};

  constructor(config: DFAConfig) {
    this.alphabet = new Set(config.alphabet);
    this.targetString = config.targetString;
    this.targetChar = config.targetChar;
    this.requiredCount = config.requiredCount;

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

    // Определяем начальное состояние
    // progress = 0 означает "еще не начали собирать суффикс"
    this.startState = { progress: 0, count: 0 };

    // Строим состояния и переходы
    // Сначала создаем все возможные состояния
    this.buildStates();
    // Затем строим переходы
    this.buildTransitions();

    // Определяем конечные состояния (быстрый доступ через Set)
    this.buildAcceptingStates();
  }

  /**
   * Создает все возможные состояния ДКА
   * progress означает: сколько символов с конца цепочки совпадают с началом targetString (0...targetString.length)
   * count означает: количество вхождений targetChar (0...requiredCount+1, где requiredCount+1 означает превышение)
   *
   * Примечание: создаются все возможные комбинации, даже если некоторые состояния недостижимы.
   * Это упрощает построение переходов, но может быть оптимизировано для больших автоматов.
   */
  private buildStates(): void {
    // progress: 0...targetString.length (прогресс поиска конечной подцепочки)
    // count: 0...requiredCount+1 (количество целевых символов, requiredCount+1 для отслеживания превышения)
    // Нужно отслеживать превышение, иначе цепочки с превышением могут быть приняты
    for (let progress = 0; progress <= this.targetString.length; progress++) {
      for (let count = 0; count <= this.requiredCount + 1; count++) {
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
      const hasExactCount = state.count === this.requiredCount;

      if (hasFullSuffix && hasExactCount) {
        this.acceptingStateKeys.add(this.stateToKey(state));
      }
    }
  }

  /**
   * Строит таблицу переходов между состояниями
   * В чистом ДКА переходы зависят только от текущего состояния и символа
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
   * Использует алгоритм, похожий на KMP, для отслеживания прогресса поиска подцепочки
   * без хранения буфера - вся информация закодирована в состоянии через progress
   */
  private calculateNextState(currentState: DFAState, symbol: Symbol): DFAState {
    let { count } = currentState;

    // 1. Обновляем счетчик целевого символа
    // Если count уже достиг requiredCount, увеличиваем до requiredCount+1 для отслеживания превышения
    if (symbol === this.targetChar) {
      if (count <= this.requiredCount) {
        count = count + 1;
      }
      // Если count уже requiredCount+1, оставляем как есть (превышение уже зафиксировано)
    }

    // 2. Обновляем прогресс сборки суффикса
    // progress показывает, сколько символов с конца уже совпадают с началом targetString
    // Используем логику, похожую на KMP, для вычисления нового progress без буфера
    let newProgress = 0;

    // Если текущий progress < длины целевой строки и символ совпадает со следующим
    // символом в целевой строке, увеличиваем progress
    if (
      currentState.progress < this.targetString.length &&
      symbol === this.targetString[currentState.progress]
    ) {
      newProgress = currentState.progress + 1;
    } else {
      // Иначе ищем максимальный суффикс уже собранной части (targetString[0..progress-1]),
      // который совпадает с префиксом targetString, и проверяем, может ли symbol
      // продолжить этот суффикс
      // Проверяем все возможные длины от progress до 1
      for (let len = currentState.progress; len > 0; len--) {
        // Проверяем, совпадает ли префикс targetString длины len-1
        // с суффиксом уже собранной части длины len-1
        // Если progress = k, то последние k символов = targetString[0..k-1]
        // Проверяем, совпадает ли targetString[0..len-2] с targetString[k-len+1..k-1]
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

      // Если ничего не нашли, но символ совпадает с первым символом целевой строки
      if (newProgress === 0 && symbol === this.targetString[0]) {
        newProgress = 1;
      }
    }

    // Важно: progress = targetString.length означает, что последние символы
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
   * В чистом ДКА используем только предвычисленные переходы
   */
  accepts(input: string): boolean {
    let currentState = this.startState;

    for (const symbol of input) {
      if (!this.alphabet.has(symbol)) {
        throw new InvalidSymbolError(symbol);
      }

      const stateKey = this.stateToKey(currentState);
      // Получаем следующее состояние из предвычисленной таблицы переходов
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
  trace(input: string): Array<{
    state: DFAState;
    symbol?: string;
  }> {
    const trace: Array<{ state: DFAState; symbol?: string }> = [
      {
        state: this.startState,
      },
    ];

    let currentState = this.startState;

    for (const symbol of input) {
      if (!this.alphabet.has(symbol)) {
        break; // или можно бросить ошибку
      }

      const stateKey = this.stateToKey(currentState);
      // Получаем следующее состояние из предвычисленной таблицы переходов
      currentState = this.transitions[stateKey][symbol];

      trace.push({
        state: currentState,
        symbol,
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
   */
  formatState(state: DFAState): string {
    const number = this.getStateNumber(state);

    // progress показывает, сколько символов суффикса уже собрано
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
