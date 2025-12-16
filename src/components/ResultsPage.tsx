import { Card, Typography, Descriptions, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { useLanguageStore } from "../stores/languageStore";

const { Title } = Typography;

export const ResultsPage = () => {
  const language = useLanguageStore((state) => state.language);
  const chain = useLanguageStore((state) => state.chain);
  const navigate = useNavigate();

  if (!language || !chain) {
    return null;
  }

  return (
    <Card
      title="Результаты проверки"
      style={{ maxWidth: "600px", margin: "20px auto" }}
      extra={
        <Button onClick={() => navigate("/check")}>
          Вернуться к проверке
        </Button>
      }
    >
      <Title level={4}>Введенные данные:</Title>
      
      <Descriptions column={1} bordered style={{ marginTop: "16px" }}>
        <Descriptions.Item label="Алфавит">
          {language.alphabet.join(", ")}
        </Descriptions.Item>
        
        <Descriptions.Item label="Обязательная конечная подцепочка">
          {language.requiredSuffix || "(не указано)"}
        </Descriptions.Item>
        
        <Descriptions.Item label="Выбранный символ алфавита">
          {language.selectedSymbol}
        </Descriptions.Item>
        
        <Descriptions.Item label="Кратность вхождения символа">
          {language.symbolMultiplicity}
        </Descriptions.Item>
        
        <Descriptions.Item label="Введенная цепочка">
          {chain}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

