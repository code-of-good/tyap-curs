import { Form, Input, InputNumber, Button, Card, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useLanguageStore } from "../stores/languageStore";
import type { DFAConfig } from "../types/dfa";

export const LanguageForm = () => {
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = (values: {
    alphabet: string;
    requiredSuffix: string;
    selectedSymbol: string;
    symbolCount: number;
  }) => {
    const alphabet = values.alphabet
      .split("")
      .filter((char) => char.trim() !== "");

    if (alphabet.length === 0) {
      message.error("Алфавит не может быть пустым");
      return;
    }

    if (!values.selectedSymbol || !alphabet.includes(values.selectedSymbol)) {
      message.error("Выбранный символ должен принадлежать алфавиту");
      return;
    }

    const language: DFAConfig = {
      alphabet,
      targetString: values.requiredSuffix,
      targetChar: values.selectedSymbol,
      minCount: values.symbolCount,
    };

    setLanguage(language);
    message.success("Описание языка сохранено");
    navigate("/check");
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

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Сохранить описание языка
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
