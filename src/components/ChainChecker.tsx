import { useState } from "react";
import { Input, Button, Card, message, Typography } from "antd";
import { useLanguageStore } from "../stores/languageStore";

const { Title } = Typography;

export const ChainChecker = () => {
  const language = useLanguageStore((state) => state.language);
  const [chain, setChain] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  const handleCheck = () => {
    if (!language) {
      message.error("Описание языка не задано");
      return;
    }

    if (!chain.trim()) {
      message.error("Введите цепочку для проверки");
      return;
    }

    setIsChecking(true);
    
    // Здесь будет логика проверки цепочки
    // Пока просто заглушка
    setTimeout(() => {
      setIsChecking(false);
      message.info("Проверка цепочки (логика будет реализована позже)");
    }, 500);
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
        onChange={(e) => setChain(e.target.value)}
        placeholder="например: aabbab"
        style={{ marginBottom: "16px" }}
        onPressEnter={handleCheck}
      />

      <Button
        type="primary"
        onClick={handleCheck}
        loading={isChecking}
        block
      >
        Проверить
      </Button>
    </Card>
  );
};

