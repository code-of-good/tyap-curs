import { message } from "antd";

export const showError = (text: string) => {
  message.error(text);
};

export const showSuccess = (text: string) => {
  message.success(text);
};

export const showValidationError = (error: unknown) => {
  const errorMessage =
    error instanceof Error ? error.message : "Ошибка валидации данных";
  message.error(errorMessage);
};

// Константы сообщений
export const MESSAGES = {
  EMPTY_ALPHABET: "Алфавит не может быть пустым",
  SYMBOL_NOT_IN_ALPHABET: "Выбранный символ должен принадлежать алфавиту",
  EMPTY_CHAIN: "Введите цепочку для проверки",
  LANGUAGE_SAVED: "Описание языка сохранено, переходим к результатам",
} as const;

