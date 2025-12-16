import { useState } from "react";
import { Input, Button, Card, message, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { useLanguageStore } from "../stores/languageStore";
import { validateLanguage } from "../utils/validateLanguage";

const { Title } = Typography;

export const ChainChecker = () => {
  const language = useLanguageStore((state) => state.language);
  const setChain = useLanguageStore((state) => state.setChain);
  const navigate = useNavigate();
  const [chain, setChainLocal] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const handleCheck = () => {
    if (!language) {
      message.error("Описание языка не задано");
      return;
    }

    const trimmedChain = chain.trim();
    if (!trimmedChain) {
      message.error("Введите цепочку для проверки");
      return;
    }

    try {
      validateLanguage(language);

      setIsChecking(true);
      setChain(trimmedChain);
      navigate("/results");
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Ошибка валидации данных"
      );
      setIsChecking(false);
    }
  };

  if (!language) {
    return null;
  }

  return (
    <Card
      title="Проверка цепочки"
      style={{ maxWidth: "500px", margin: "20px auto" }}
    >
      <div style={{ marginBottom: "16px" }}>
        <Title level={5}>Введите цепочку для проверки:</Title>
      </div>

      <Input
        value={chain}
        onChange={(e) => setChainLocal(e.target.value)}
        placeholder="например: aabbab"
        style={{ marginBottom: "16px" }}
        onPressEnter={handleCheck}
      />

      <Button type="primary" onClick={handleCheck} loading={isChecking} block>
        Проверить
      </Button>
    </Card>
  );
};
