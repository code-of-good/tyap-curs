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
      const x = col * 350 + 150;
      const y = row * 250 + 150;

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

    // Создаем отдельное ребро для каждого перехода, чтобы стрелки не сливались
    // Подсчитываем количество переходов между одними и теми же состояниями
    const transitionCountByPair = new Map<string, number>();
    transitions.forEach((transition) => {
      const fromKey = dfa.stateToKey(transition.from);
      const toKey = dfa.stateToKey(transition.to);
      const pairKey = `${fromKey}-${toKey}`;
      transitionCountByPair.set(
        pairKey,
        (transitionCountByPair.get(pairKey) || 0) + 1
      );
    });

    // Создаем рёбра с разными handle позициями для каждого перехода
    const edgesList: Edge[] = [];
    const edgeIndexByPair = new Map<string, number>();

    // Определяем handle позиции для распределения рёбер
    const handlePositions = [
      { source: "top", target: "top" },
      { source: "right", target: "right" },
      { source: "bottom", target: "bottom" },
      { source: "left", target: "left" },
      // Дополнительные позиции для большего количества рёбер
      { source: "top", target: "right" },
      { source: "right", target: "bottom" },
      { source: "bottom", target: "left" },
      { source: "left", target: "top" },
    ];

    transitions.forEach((transition) => {
      const fromKey = dfa.stateToKey(transition.from);
      const toKey = dfa.stateToKey(transition.to);
      const pairKey = `${fromKey}-${toKey}`;
      const totalTransitions = transitionCountByPair.get(pairKey) || 1;
      const currentIndex = edgeIndexByPair.get(pairKey) || 0;
      edgeIndexByPair.set(pairKey, currentIndex + 1);

      const isSelfLoop = fromKey === toKey;
      let sourceHandle: string | undefined;
      let targetHandle: string | undefined;
      let edgeType: "smoothstep" | "bezier" = "smoothstep";

      if (isSelfLoop) {
        // Для петель используем bezier с разными позициями для разных петель
        edgeType = "bezier";
        const loopHandles = [
          { source: "right", target: "right" },
          { source: "bottom", target: "bottom" },
          { source: "left", target: "left" },
          { source: "top", target: "top" },
        ];
        const loopHandle = loopHandles[currentIndex % loopHandles.length];
        sourceHandle = loopHandle.source;
        targetHandle = loopHandle.target;
      } else if (totalTransitions > 1) {
        // Для множественных переходов используем разные handle позиции
        // Распределяем равномерно по доступным позициям
        const handleIndex = currentIndex % handlePositions.length;
        const handles = handlePositions[handleIndex];
        sourceHandle = handles.source;
        targetHandle = handles.target;
        edgeType = "smoothstep";
      } else {
        // Для одиночных переходов используем стандартные позиции
        edgeType = "smoothstep";
      }

      edgesList.push({
        id: `edge-${fromKey}-${toKey}-${transition.symbol}-${currentIndex}`,
        source: fromKey,
        target: toKey,
        sourceHandle,
        targetHandle,
        label: transition.symbol,
        type: edgeType,
        animated: false,
        style: { stroke: "#222", strokeWidth: 2 },
        labelStyle: { fill: "#222", fontWeight: 600 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#222",
        },
      });
    });

    return {
      nodes: Array.from(nodeMap.values()),
      edges: edgesList,
    };
  }, [dfa]);

  return (
    <div
      style={{
        width: "100%",
        height: "800px",
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
