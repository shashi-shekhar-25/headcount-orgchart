/** @typedef {import('./types.js').Employee} Employee */
/** @typedef {import('./types.js').OrgNode} OrgNode */

import { flattenOrgTree } from './buildOrgTree.js';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 90;

/**
 * @param {OrgNode[]} roots
 * @returns {Promise<{ nodes: Array<{ id: string, type: string, position: { x: number, y: number }, data: { employee: OrgNode } }>, edges: Array<{ id: string, source: string, target: string, type: string }> }>} 
 */
export async function layoutOrgChart(roots) {
  const ELK = (await import('elkjs/lib/elk.bundled.js')).default;
  const elk = new ELK();

  const allNodes = flattenOrgTree(roots);
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.layered.edgeRouting': 'ORTHOGONAL',
      'elk.layered.compaction.strategy': 'ALONG_MAIN_PATH',
      'elk.layered.nodePlacement.bk.strategy': 'BRANDES_KOEPF',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.spacing.nodeNode': '50',
      'elk.layered.spacing.nodeNodeBetweenLayers': '100',
      'elk.layered.spacing.edgeNodeBetweenLayers': '60',
      'elk.layered.spacing.edgeEdgeBetweenLayers': '20',
      'elk.layered.crossingMinimization.iterations': '12',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.clearance': '40',
    },
    children: allNodes.map((node) => ({
      id: node.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    })),
    edges: allNodes
      .filter((node) => node.managerId)
      .map((node) => ({
        id: `${node.managerId}-${node.id}`,
        sources: [node.managerId],
        targets: [node.id],
      })),
  };

  const layout = await elk.layout(graph);

  /** @type {Map<string, { x: number, y: number }>} */
  const positions = new Map();

  for (const node of layout.children ?? []) {
    if (node.id && typeof node.x === 'number' && typeof node.y === 'number') {
      positions.set(node.id, { x: node.x, y: node.y });
    }
  }
  /** @type {Array<{ id: string, type: string, position: { x: number, y: number }, data: { employee: OrgNode } }>} */
  const nodes = [];  /** @type {Array<{ id: string, source: string, target: string, type: string }>} */
  const edges = [];

  /**
   * @param {OrgNode} node
   */
  function walk(node) {
    const position = positions.get(node.id) ?? { x: 0, y: 0 };
    nodes.push({
      id: node.id,
      type: 'employee',
      position,
      sourcePosition: 'bottom',
      targetPosition: 'top',
      data: { employee: node },
    });

    for (const child of node.children) {
      edges.push({
        id: `${node.id}-${child.id}`,
        source: node.id,
        target: child.id,
        type: 'straight',
        animated: false,
      });
      walk(child);
    }
  }

  for (const root of roots) {
    walk(root);
  }

  return { nodes, edges };
}

/**
 * @param {Employee[]} employees
 * @param {string|null} managerId
 * @returns {string}
 */
export function getManagerName(employees, managerId) {
  if (!managerId) {
    return 'No manager';
  }
  return employees.find((employee) => employee.id === managerId)?.name ?? managerId;
}
