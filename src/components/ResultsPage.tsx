import { useState } from "react";
import { Card, Typography, Descriptions, Button, Table, Tabs } from "antd";
import { useNavigate } from "react-router-dom";
import { useLanguageStore } from "../stores/languageStore";
import { DFA } from "../classes/DFA";
import type { DFAState } from "../types/dfa";
import { DFAGraph } from "./DFAGraph";

const { Title } = Typography;

export const ResultsPage = () => {
  const language = useLanguageStore((state) => state.language);
  const chain = useLanguageStore((state) => state.chain);
  const [activeTab, setActiveTab] = useState<string>("table");

  const navigate = useNavigate();

  if (!language || !chain) {
    return null;
  }

  const dfa = new DFA(language);
  const transitions = dfa.getTransitionsList();

  const formatState = (state: DFAState) => dfa.formatState(state);

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
      style={{ maxWidth: "1200px", margin: "20px auto" }}
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
        Функция переходов ДКА:
      </Title>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "table",
            label: "Таблица",
            children: (
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
            ),
          },
          {
            key: "graph",
            label: "Граф",
            children: (
              <div style={{ marginTop: "16px" }}>
                <DFAGraph dfa={dfa} />
              </div>
            ),
          },
        ]}
      />
    </Card>
  );
};
