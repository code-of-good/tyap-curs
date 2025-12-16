import { Card, Typography, Descriptions, Button, Table } from "antd";
import { useNavigate } from "react-router-dom";
import { useLanguageStore } from "../stores/languageStore";
import { DFA } from "../classes/DFA";
import type { DFAState } from "../types/dfa";

const { Title } = Typography;

export const ResultsPage = () => {
  const language = useLanguageStore((state) => state.language);
  const chain = useLanguageStore((state) => state.chain);

  const navigate = useNavigate();

  if (!language || !chain) {
    return null;
  }

  const dfa = new DFA(language);
  const transitions = dfa.getTransitionsList();

  const formatState = (state: DFAState) =>
    `q(${state.progress}, ${state.count})`;

  const columns = [
    {
      title: "Из состояния",
      dataIndex: "from",
      key: "from",
      render: (state: DFAState) => formatState(state),
    },
    {
      title: "Символ",
      dataIndex: "symbol",
      key: "symbol",
    },
    {
      title: "В состояние",
      dataIndex: "to",
      key: "to",
      render: (state: DFAState) => formatState(state),
    },
  ];

  return (
    <Card
      title="Результаты проверки"
      style={{ maxWidth: "600px", margin: "20px auto" }}
      extra={
        <Button onClick={() => navigate("/check")}>Вернуться к проверке</Button>
      }
    >
      <Title level={4}>Введенные данные:</Title>

      <Descriptions column={1} bordered style={{ marginTop: "16px" }}>
        <Descriptions.Item label="Алфавит">
          {language.alphabet.join(", ")}
        </Descriptions.Item>

        <Descriptions.Item label="Обязательная конечная подцепочка">
          {language.targetString || "(не указано)"}
        </Descriptions.Item>

        <Descriptions.Item label="Выбранный символ алфавита">
          {language.targetChar}
        </Descriptions.Item>

        <Descriptions.Item label="Кратность вхождения символа">
          {language.minCount}
        </Descriptions.Item>

        <Descriptions.Item label="Введенная цепочка">{chain}</Descriptions.Item>
      </Descriptions>

      <Title level={4} style={{ marginTop: "24px" }}>
        Таблица переходов:
      </Title>

      <Table
        columns={columns}
        dataSource={transitions.map((transition, index) => ({
          key: index,
          from: transition.from,
          symbol: transition.symbol,
          to: transition.to,
        }))}
        pagination={false}
        style={{ marginTop: "16px" }}
      />
    </Card>
  );
};
