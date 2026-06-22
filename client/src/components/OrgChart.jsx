import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import EmployeeNode from './EmployeeNode.jsx';
import { buildOrgTree } from '../lib/buildOrgTree.js';
import { layoutOrgChart } from '../lib/layoutOrgChart.js';
import { getDescendantIds } from '../lib/reorgEngine.js';

/** @typedef {import('../lib/types.js').Employee} Employee */

const nodeTypes = { employee: EmployeeNode };
const NODE_WIDTH = 220;
const NODE_HEIGHT = 90;

function getNodeRect(node) {
  return {
    left: node.position.x,
    right: node.position.x + NODE_WIDTH,
    top: node.position.y,
    bottom: node.position.y + NODE_HEIGHT,
  };
}

function getIntersectionArea(a, b) {
  const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return width * height;
}

/**
 * @param {{
 *   employees: Employee[],
 *   reorgMode: boolean,
 *   onReparent: (draggedId: string, newManagerId: string) => void,
 *   onReorgError: (error: string) => void,
 * }} props
 */
function OrgChartInner({
  employees,
  reorgMode,
  onReparent,
  onReorgError,
  onNodeClick,
  onEdgeClick,
  onPaneClick,
  activeEdgeId,
  activeNodeId,
}) {
  const { fitView } = useReactFlow();
  const [nodes, setNodes] = useState([]);
  const [layoutEdges, setLayoutEdges] = useState([]);
  const [edges, setEdges] = useState([]);
  const [dropTargetId, setDropTargetId] = useState(/** @type {string | null} */ (null));
  const [layoutError, setLayoutError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function runLayout() {
      try {
        const roots = buildOrgTree(employees);
        const layout = await layoutOrgChart(roots);
        if (cancelled) return;
        setNodes(layout.nodes);
        setLayoutEdges(layout.edges);
        setLayoutError('');
        requestAnimationFrame(() => fitView({ padding: 0.2, duration: 250 }));
      } catch (error) {
        if (!cancelled) {
          setLayoutError(error instanceof Error ? error.message : String(error));
        }
      }
    }

    const timer = setTimeout(runLayout, 50);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [employees, fitView]);

  useEffect(() => {
    setNodes((current) =>
      current.map((node) => ({
        ...node,
        draggable: reorgMode,
        data: {
          ...node.data,
          reorgMode,
          isDropTarget: node.id === dropTargetId,
          isSelected: node.id === activeNodeId,
        },
      }))
    );
  }, [dropTargetId, reorgMode, activeNodeId]);

  useEffect(() => {
    setEdges(
      layoutEdges.map((edge) => ({
        ...edge,
        style: {
          stroke: edge.id === activeEdgeId ? '#2563eb' : '#6b7280',
          strokeWidth: edge.id === activeEdgeId ? 3 : 1.5,
        },
      }))
    );
  }, [layoutEdges, activeEdgeId]);

  const findTarget = useCallback(
    (draggedId, draggedRect) => {
      const descendants = new Set(getDescendantIds(employees, draggedId));
      descendants.add(draggedId);

      let bestTarget = null;
      let bestArea = 0;

      for (const node of nodes) {
        if (descendants.has(node.id)) continue;

        const targetRect = getNodeRect(node);
        const area = getIntersectionArea(draggedRect, targetRect);
        if (area > bestArea) {
          bestArea = area;
          bestTarget = node;
        }
      }

      return bestArea > 0 ? bestTarget : null;
    },
    [employees, nodes]
  );

  const onNodeDrag = useCallback(
    (_event, draggedNode) => {
      if (!reorgMode) return;

      const draggedRect = getNodeRect(draggedNode);
      const target = findTarget(draggedNode.id, draggedRect);
      setDropTargetId(target?.id ?? null);
    },
    [findTarget, reorgMode]
  );

  const onNodeDragStop = useCallback(
    (_event, draggedNode) => {
      setDropTargetId(null);
      if (!reorgMode) return;

      const draggedRect = getNodeRect(draggedNode);
      const target = findTarget(draggedNode.id, draggedRect);

      if (!target) return;
      if (target.id === draggedNode.id) {
        onReorgError('An employee cannot report to themselves.');
        return;
      }

      onReparent(draggedNode.id, target.id);
    },
    [findTarget, onReparent, onReorgError, reorgMode]
  );

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  if (layoutError) {
    return <div className="panel-error">{layoutError}</div>;
  }

  const handleNodeClick = useCallback(
    (_event, node) => {
      onNodeClick?.(node.id);
    },
    [onNodeClick]
  );

  const handleEdgeClick = useCallback(
    (_event, edge) => {
      onEdgeClick?.(edge);
    },
    [onEdgeClick]
  );

  const handlePaneClick = useCallback(
    () => {
      onPaneClick?.();
    },
    [onPaneClick]
  );

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={reorgMode}
        nodesConnectable={false}
        elementsSelectable={reorgMode}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        proOptions={proOptions}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
      >
        <Background gap={16} size={1} />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
      {reorgMode ? (
        <div className="org-chart__hint">Drag an employee onto a new manager to simulate a reorg.</div>
      ) : null}
    </>
  );
}

/**
 * @param {{
 *   employees: Employee[],
 *   reorgMode: boolean,
 *   onReparent: (draggedId: string, newManagerId: string) => void,
 *   onReorgError: (error: string) => void,
 * }} props
 */
export default function OrgChart(props) {
  return (
    <div className="org-chart">
      <ReactFlowProvider>
        <OrgChartInner {...props} />
      </ReactFlowProvider>
    </div>
  );
}
