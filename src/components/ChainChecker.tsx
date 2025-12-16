import { useState } from "react";
import { Input, Button, Card, message, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { useLanguageStore } from "../stores/languageStore";

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

    if (!chain.trim()) {
      message.error("Введите цепочку для проверки");
      return;
    }

    setIsChecking(true);
    setChain(chain.trim());
    navigate("/results");
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

