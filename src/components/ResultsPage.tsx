import { useState, useMemo } from "react";
import {
  Card,
  Typography,
  Descriptions,
  Button,
  Table,
  Tabs,
  Alert,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useLanguageStore } from "../stores/languageStore";
import { DFA } from "../classes/DFA";
import type { DFAState } from "../types/dfa";
import { DFAGraph } from "./DFAGraph";
import { InvalidSymbolError } from "../types/dfa";

const { Title } = Typography;

export const ResultsPage = () => {
  const language = useLanguageStore((state) => state.language);
  const chain = useLanguageStore((state) => state.chain);
  const [activeTab, setActiveTab] = useState<string>("table");

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
              `не найдена обязательная конечная подцепочка "${language.targetString}" (  есс: ${finalState.progress}/${language.targetString.length})`
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
      extra={<Button onClick={() => navigate("/")}>Вернуться к форме</Button>}
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
                      ? formatState(checkResult.finalState)
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
                      Финальное состояние: {formatState(checkResult.finalState)}
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
                render: (state: DFAState) => formatState(state),
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
                  nextState ? formatState(nextState) : "-",
              },
            ]}
            dataSource={traceSteps.map((step, index) => ({
              key: index,
              step: index + 1,
              state: step.from,
              symbol: step.symbol,
              nextState: step.to,
            }))}
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
