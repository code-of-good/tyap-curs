import { Form, Input, InputNumber, Button, Card } from "antd";
import { useNavigate } from "react-router-dom";
import { useLanguageStore } from "../stores/languageStore";
import type { DFAConfig } from "../types/dfa";
import { validateLanguage } from "../utils/validateLanguage";
import {
  showError,
  showSuccess,
  showValidationError,
  MESSAGES,
} from "../utils/messages";

export const LanguageForm = () => {
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const setChain = useLanguageStore((state) => state.setChain);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = (values: {
    alphabet: string;
    requiredSuffix: string;
    selectedSymbol: string;
    symbolCount: number;
    chain: string;
  }) => {
    const alphabet = values.alphabet
      .split("")
      .filter((char) => char.trim() !== "");

    if (alphabet.length === 0) {
      showError(MESSAGES.EMPTY_ALPHABET);
      return;
    }

    if (!values.selectedSymbol || !alphabet.includes(values.selectedSymbol)) {
      showError(MESSAGES.SYMBOL_NOT_IN_ALPHABET);
      return;
    }

    const language: DFAConfig = {
      alphabet,
      targetString: values.requiredSuffix,
      targetChar: values.selectedSymbol,
      requiredCount: values.symbolCount,
    };

    try {
      validateLanguage(language);
    } catch (error) {
      showValidationError(error);
      return;
    }

    setLanguage(language);

    const trimmedChain = values.chain.trim();
    if (!trimmedChain) {
      showError(MESSAGES.EMPTY_CHAIN);
      return;
    }

    setChain(trimmedChain);
    showSuccess(MESSAGES.LANGUAGE_SAVED);
    navigate("/results");
  };

  return (
    <Card
      title="Описание языка"
      style={{ maxWidth: "500px", margin: "20px auto" }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ symbolCount: 1 }}
      >
        <Form.Item
          label="Алфавит (введите символы без пробелов)"
          name="alphabet"
          rules={[{ required: true, message: "Пожалуйста, введите алфавит" }]}
        >
          <Input placeholder="например: abc" />
        </Form.Item>

        <Form.Item
          label="Обязательная конечная подцепочка"
          name="requiredSuffix"
        >
          <Input placeholder="например: ab" />
        </Form.Item>

        <Form.Item
          label="Выбранный символ алфавита"
          name="selectedSymbol"
          rules={[
            { required: true, message: "Пожалуйста, выберите символ" },
            { max: 1, message: "Должен быть один символ" },
          ]}
        >
          <Input placeholder="например: a" maxLength={1} />
        </Form.Item>

        <Form.Item
          label="Кратность вхождения символа"
          name="symbolCount"
          rules={[
            { required: true, message: "Пожалуйста, укажите кратность" },
            {
              type: "number",
              min: 1,
              message: "Кратность должна быть положительным числом",
            },
          ]}
        >
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="Цепочка для проверки"
          name="chain"
          rules={[
            {
              required: true,
              message: "Пожалуйста, введите цепочку для проверки",
            },
          ]}
        >
          <Input placeholder="например: aabbab" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Сохранить и проверить
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
