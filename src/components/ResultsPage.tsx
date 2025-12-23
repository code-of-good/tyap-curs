import { useState, useMemo } from "react";
import {
  Card,
  Typography,
  Descriptions,
  Button,
  Table,
  Tabs,
  Alert,
  Popover,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useLanguageStore } from "../stores/languageStore";
import { DFA } from "../classes/DFA";
import type { DFAState } from "../types/dfa";
import { DFAGraph } from "./DFAGraph";
import { InvalidSymbolError } from "../types/dfa";
import { QuestionCircleOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

export const ResultsPage = () => {
  const language = useLanguageStore((state) => state.language);
  const chain = useLanguageStore((state) => state.chain);
  const [activeTab, setActiveTab] = useState<string>("table");
  const [helpVisible, setHelpVisible] = useState<boolean>(false);

  const navigate = useNavigate();

  const dfa = useMemo(() => {
    if (!language) return null;
    return new DFA(language);
  }, [language]);

  const traceSteps = useMemo(() => {
    if (!dfa || !chain) return null;
    try {
      return dfa.trace(chain);
    } catch {
      return null;
    }
  }, [dfa, chain]);

  const checkResult = useMemo(() => {
    if (!dfa || !chain || !language) return null;
    try {
      const isAccepted = dfa.accepts(chain);
      const trace = dfa.trace(chain);
      const finalState = trace[trace.length - 1]?.to || dfa.getStartState();

      if (isAccepted) {
        return {
          accepted: true,
          message: "Цепочка принимается автоматом",
          finalState: finalState,
        };
      } else {
        let reason = "";
        if (finalState) {
          const reasons: string[] = [];
          if (finalState.progress !== language.targetString.length) {
            reasons.push(
              `не найдена обязательная конечная подцепочка "${language.targetString}" (прогресс: ${finalState.progress}/${language.targetString.length})`
            );
          }
          if (finalState.count !== language.requiredCount) {
            reasons.push(
              `символ "${language.targetChar}" встретился ${finalState.count} раз(а), требуется ${language.requiredCount}`
            );
          }
          reason = reasons.join("; ");
        }
        return {
          accepted: false,
          message: "Цепочка не принимается автоматом",
          reason: reason || "Не достигнуто принимающее состояние",
          finalState: finalState,
        };
      }
    } catch (error) {
      if (error instanceof InvalidSymbolError) {
        return {
          accepted: false,
          message: "Цепочка не принимается автоматом",
          reason: `Символ "${
            error.message.split("'")[1]
          }" не принадлежит алфавиту`,
          finalState: null,
        };
      }
      return {
        accepted: false,
        message: "Ошибка при проверке цепочки",
        reason: error instanceof Error ? error.message : "Неизвестная ошибка",
        finalState: null,
      };
    }
  }, [dfa, chain, language]);

  if (!language || !chain || !dfa) {
    return null;
  }

  const transitions = dfa.getTransitionsList();

  const formatState = (state: DFAState) => dfa.formatState(state);

  const renderState = (state: DFAState) => {
    const isOverflow = dfa.isOverflowState(state);
    return (
      <span
        style={{
          color: isOverflow ? "#DC143C" : "inherit",
          fontWeight: isOverflow ? "bold" : "normal",
        }}
      >
        {formatState(state)}
      </span>
    );
  };

  const columns = [
    {
      title: "Из состояния",
      dataIndex: "from",
      key: "from",
      render: (state: DFAState) => renderState(state),
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
      render: (state: DFAState) => renderState(state),
    },
  ];

  const helpContent = (
    <div style={{ maxWidth: 400 }}>
      <Title level={5} style={{ marginBottom: 12 }}>
        Справка по результатам проверки
      </Title>

      <Paragraph>
        <Text strong>Разделы страницы:</Text>
      </Paragraph>
      <ul>
        <li>
          <Text strong>Введенные данные:</Text> показывает параметры ДКА и
          проверяемую цепочку
        </li>
        <li>
          <Text strong>Результат проверки:</Text> указывает, принимается ли
          цепочка и почему
        </li>
        <li>
          <Text strong>Поэтапная проверка:</Text> показывает каждый шаг
          обработки цепочки
        </li>
        <li>
          <Text strong>Функция переходов:</Text> содержит таблицу и граф
          переходов ДКА
        </li>
      </ul>

      <Paragraph style={{ marginTop: 16 }}>
        <Text strong>Обозначения состояний:</Text>
      </Paragraph>
      <ul>
        <li>
          <Text code>q(count, progress)</Text> - общий формат состояния
        </li>
        <li>
          <Text>count</Text> - количество встреченных символов "
          {language.targetChar}"
        </li>
        <li>
          <Text>progress</Text> - прогресс поиска подцепочки "
          {language.targetString || "..."}"
        </li>
        <li style={{ color: "#DC143C", fontWeight: "bold" }}>
          Красный цвет - состояние переполнения (цель недостижима)
        </li>
      </ul>

      <Paragraph style={{ marginTop: 16 }}>
        <Text strong>Критерии принятия цепочки:</Text>
      </Paragraph>
      <ol>
        <li>Все символы цепочки принадлежат алфавиту</li>
        <li>
          Символ "{language.targetChar}" встретился ровно{" "}
          {language.requiredCount} раз
        </li>
        {language.targetString && (
          <li>Цепочка заканчивается подцепочкой "{language.targetString}"</li>
        )}
      </ol>
    </div>
  );

  return (
    <Card
      title="Результаты проверки"
      style={{ maxWidth: "1200px", margin: "20px auto" }}
      extra={
        <div style={{ display: "flex", gap: 8 }}>
          <Popover
            title="Справка"
            content={helpContent}
            trigger="click"
            open={helpVisible}
            onOpenChange={setHelpVisible}
            placement="leftBottom"
          >
            <Button
              icon={<QuestionCircleOutlined />}
              type="default"
              onClick={() => setHelpVisible(!helpVisible)}
            >
              Справка
            </Button>
          </Popover>
          <Button onClick={() => navigate("/")}>Вернуться к форме</Button>
        </div>
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
          {language.requiredCount}
        </Descriptions.Item>

        <Descriptions.Item label="Введенная цепочка">{chain}</Descriptions.Item>
      </Descriptions>

      {checkResult && (
        <div style={{ marginTop: "24px" }}>
          <Alert
            type={checkResult.accepted ? "success" : "error"}
            message={checkResult.message}
            description={
              checkResult.accepted ? (
                <div>
                  <p>
                    Финальное состояние:{" "}
                    {checkResult.finalState
                      ? renderState(checkResult.finalState)
                      : "N/A"}
                  </p>
                </div>
              ) : (
                <div>
                  <p>
                    <strong>Причина:</strong> {checkResult.reason}
                  </p>
                  {checkResult.finalState && (
                    <p style={{ marginTop: "8px" }}>
                      Финальное состояние: {renderState(checkResult.finalState)}
                    </p>
                  )}
                </div>
              )
            }
            showIcon
          />
        </div>
      )}

      {traceSteps && traceSteps.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <Title level={4}>Поэтапная проверка цепочки:</Title>
          <Table
            columns={[
              {
                title: "Шаг",
                dataIndex: "step",
                key: "step",
                width: 80,
                align: "center",
              },
              {
                title: "Текущее состояние",
                dataIndex: "state",
                key: "state",
                render: (state: DFAState) => renderState(state),
              },
              {
                title: "Символ",
                dataIndex: "symbol",
                key: "symbol",
                width: 100,
                align: "center",
                render: (symbol: string | undefined) => symbol || "-",
              },
              {
                title: "Следующее состояние",
                dataIndex: "nextState",
                key: "nextState",
                render: (nextState: DFAState | null) =>
                  nextState ? renderState(nextState) : "-",
              },
            ]}
            dataSource={traceSteps.map((step, index) => ({
              key: index,
              step: index + 1,
              state: step.from,
              symbol: step.symbol,
              nextState: step.to,
            }))}
            onRow={(record) => {
              const hasOverflow =
                dfa.isOverflowState(record.state) ||
                (record.nextState && dfa.isOverflowState(record.nextState));
              return {
                style: {
                  backgroundColor: hasOverflow ? "#FFE4E1" : undefined,
                },
              };
            }}
            pagination={false}
            style={{ marginTop: "16px" }}
            size="small"
          />
        </div>
      )}

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
                onRow={(record) => {
                  const hasOverflow =
                    dfa.isOverflowState(record.from) ||
                    dfa.isOverflowState(record.to);
                  return {
                    style: {
                      backgroundColor: hasOverflow ? "#FFE4E1" : undefined,
                    },
                  };
                }}
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
