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

    const nodeMap = new Map<string, Node>();
    const nodePositions = new Map<string, { x: number; y: number }>();

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
      const isOverflow = dfa.isOverflowState(state);

      nodeMap.set(stateKey, {
        id: stateKey,
        type: "default",
        position: { x, y },
        data: {
          label: isAccepting ? "qf" : dfa.formatState(state),
        },
        style: {
          background: isOverflow
            ? "#FFB6C1"
            : isAccepting
            ? "#90EE90"
            : isStart
            ? "#87CEEB"
            : "#fff",
          border: isOverflow
            ? "3px solid #DC143C"
            : isAccepting
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
          fontWeight: isStart || isAccepting || isOverflow ? "bold" : "normal",
        },
      });
    });

    const visibleTransitions = transitions;

    // Группируем переходы по парам состояний
    const transitionsByPair = new Map<string, typeof visibleTransitions>();
    visibleTransitions.forEach((transition) => {
      const fromKey = dfa.stateToKey(transition.from);
      const toKey = dfa.stateToKey(transition.to);
      const pairKey = `${fromKey}-${toKey}`;

      if (!transitionsByPair.has(pairKey)) {
        transitionsByPair.set(pairKey, []);
      }
      transitionsByPair.get(pairKey)!.push(transition);
    });

    const edgesList: Edge[] = [];

    // Обрабатываем каждую пару состояний
    transitionsByPair.forEach((transitionsForPair, pairKey) => {
      const [fromKey, toKey] = pairKey.split("-");
      const fromPos = nodePositions.get(fromKey)!;
      const toPos = nodePositions.get(toKey)!;
      const isSelfLoop = fromKey === toKey;

      // Для петель
      if (isSelfLoop) {
        transitionsForPair.forEach((transition, index) => {
          // Размещаем петли в разных положениях вокруг узла
          const angleOffset = (index / transitionsForPair.length) * Math.PI * 2;
          const loopSize = 80 + index * 20; // Увеличиваем размер для каждой петли

          edgesList.push({
            id: `edge-${fromKey}-${toKey}-${transition.symbol}-${index}`,
            source: fromKey,
            target: toKey,
            sourceHandle: "top",
            targetHandle: "top",
            label: transition.symbol,
            type: "bezier",
            animated: false,
            style: { stroke: "#222", strokeWidth: 2 },
            labelStyle: { fill: "#222", fontWeight: 600 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#222",
            },
            // Параметры для кривой Безье для петли
            sourceX: fromPos.x + 50 + Math.cos(angleOffset) * 50,
            sourceY: fromPos.y + 50 + Math.sin(angleOffset) * 50,
            targetX: fromPos.x + 50 + Math.cos(angleOffset + Math.PI / 4) * 50,
            targetY: fromPos.y + 50 + Math.sin(angleOffset + Math.PI / 4) * 50,
            curvature: 0.5,
            loop: {
              angle: angleOffset * (180 / Math.PI),
              distance: loopSize,
            },
          });
        });
      } else {
        // Для переходов между разными состояниями
        // Вычисляем базовый угол и смещения
        const dx = toPos.x - fromPos.x;
        const dy = toPos.y - fromPos.y;
        // const distance = Math.sqrt(dx * dx + dy * dy);
        // const baseAngle = Math.atan2(dy, dx);

        // Если только один переход, размещаем его прямо
        if (transitionsForPair.length === 1) {
          const transition = transitionsForPair[0];
          edgesList.push({
            id: `edge-${fromKey}-${toKey}-${transition.symbol}`,
            source: fromKey,
            target: toKey,
            label: transition.symbol,
            type: "smoothstep",
            animated: false,
            style: { stroke: "#222", strokeWidth: 2 },
            labelStyle: { fill: "#222", fontWeight: 600 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#222",
            },
            // Добавляем небольшое смещение, чтобы стрелка не перекрывала узел
            sourceHandle: "right",
            targetHandle: "left",
            labelBgStyle: { fill: "#fff", fillOpacity: 0.85 },
            labelBgPadding: [4, 4],
            labelBgBorderRadius: 3,
          });
        } else {
          // Для нескольких переходов используем дуги с разными радиусами
          transitionsForPair.forEach((transition, index) => {
            // Вычисляем смещение для дуги (перпендикулярно базовому направлению)
            const offsetDirection = index % 2 === 0 ? 1 : -1;
            const offsetDistance = 40 + Math.floor(index / 2) * 30;

            // Создаем дугообразное ребро
            edgesList.push({
              id: `edge-${fromKey}-${toKey}-${transition.symbol}-${index}`,
              source: fromKey,
              target: toKey,
              label: transition.symbol,
              type: "smoothstep",
              animated: false,
              style: {
                stroke: "#222",
                strokeWidth: 2,
              },
              labelStyle: {
                fill: "#222",
                fontWeight: 600,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#222",
              },
              // Параметры для плавной кривой
              sourceX: fromPos.x + 50,
              sourceY: fromPos.y + 50,
              targetX: toPos.x + 50,
              targetY: toPos.y + 50,
              curvature: 0.25 + index * 0.1 * offsetDirection,
              labelBgStyle: { fill: "#fff", fillOpacity: 0.85 },
              labelBgPadding: [4, 4],
              labelBgBorderRadius: 3,
            });
          });
        }
      }
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
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};
