import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import type { DFA } from "../classes/DFA";

interface DFAGraphProps {
  dfa: DFA;
}

export const DFAGraph = ({ dfa }: DFAGraphProps) => {
  const { nodes, edges } = useMemo(() => {
    const states = dfa.getStates();
    const transitions = dfa.getTransitionsList();
    const startState = dfa.getStartState();

    // Создаем узлы для каждого состояния
    const nodeMap = new Map<string, Node>();
    const nodePositions = new Map<string, { x: number; y: number }>();

    // Располагаем узлы в сетке
    const statesPerRow = Math.ceil(Math.sqrt(states.length));
    states.forEach((state, index) => {
      const stateKey = dfa.stateToKey(state);
      const row = Math.floor(index / statesPerRow);
      const col = index % statesPerRow;
      const x = col * 200 + 100;
      const y = row * 150 + 100;

      nodePositions.set(stateKey, { x, y });

      const isStart =
        state.progress === startState.progress &&
        state.count === startState.count;
      const isAccepting = dfa.isAcceptingState(state);

      nodeMap.set(stateKey, {
        id: stateKey,
        type: "default",
        position: { x, y },
        data: {
          label: isAccepting ? "qf" : dfa.formatState(state),
        },
        style: {
          background: isAccepting ? "#90EE90" : isStart ? "#87CEEB" : "#fff",
          border: isAccepting
            ? "3px solid #228B22"
            : isStart
            ? "3px solid #4682B4"
            : "2px solid #222",
          borderRadius: "50%",
          width: 100,
          height: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          fontWeight: isStart || isAccepting ? "bold" : "normal",
        },
      });
    });

    // Группируем переходы по парам состояний
    const edgeMap = new Map<
      string,
      { symbols: string[]; from: string; to: string }
    >();

    transitions.forEach((transition) => {
      const fromKey = dfa.stateToKey(transition.from);
      const toKey = dfa.stateToKey(transition.to);
      const edgeKey = `${fromKey}-${toKey}`;

      if (!edgeMap.has(edgeKey)) {
        edgeMap.set(edgeKey, {
          symbols: [],
          from: fromKey,
          to: toKey,
        });
      }

      edgeMap.get(edgeKey)!.symbols.push(transition.symbol);
    });

    // Создаем рёбра
    const edgesList: Edge[] = Array.from(edgeMap.values()).map(
      (edgeData, index) => {
        const label =
          edgeData.symbols.length <= 3
            ? edgeData.symbols.join(", ")
            : `${edgeData.symbols.slice(0, 2).join(", ")}, ...`;

        return {
          id: `edge-${index}`,
          source: edgeData.from,
          target: edgeData.to,
          label,
          type: "smoothstep",
          animated: false,
          style: { stroke: "#222", strokeWidth: 2 },
          labelStyle: { fill: "#222", fontWeight: 600 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#222",
          },
        };
      }
    );

    return {
      nodes: Array.from(nodeMap.values()),
      edges: edgesList,
    };
  }, [dfa]);

  return (
    <div
      style={{
        width: "100%",
        height: "600px",
        border: "1px solid #ddd",
        borderRadius: "4px",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};
