/** @typedef {import('./types.js').Employee} Employee */
/** @typedef {import('./types.js').OrgNode} OrgNode */

/**
 * @param {Employee[]} employees
 * @returns {OrgNode[]}
 */
export function buildOrgTree(employees) {
  /** @type {Map<string, OrgNode>} */
  const nodes = new Map();
  /** @type {OrgNode[]} */
  const roots = [];

  for (const employee of employees) {
    nodes.set(employee.id, {
      ...employee,
      children: [],
      depth: 0,
      directReportCount: 0,
      spanCount: 0,
    });
  }

  for (const node of nodes.values()) {
    if (node.managerId && nodes.has(node.managerId)) {
      nodes.get(node.managerId).children.push(node);
    } else {
      roots.push(node);
    }
  }

  /**
   * @param {OrgNode} node
   * @param {number} depth
   * @returns {number}
   */
  function assignDepth(node, depth) {
    node.depth = depth;
    node.directReportCount = node.children.length;

    let descendantCount = 0;
    for (const child of node.children) {
      descendantCount += 1 + assignDepth(child, depth + 1);
    }

    node.spanCount = descendantCount;
    node.children.sort((a, b) => {
      const diff = b.spanCount - a.spanCount;
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    });

    return descendantCount;
  }

  for (const root of roots) {
    assignDepth(root, 0);
  }

  roots.sort((a, b) => {
    const diff = b.spanCount - a.spanCount;
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });

  return roots;
}

/**
 * @param {OrgNode[]} roots
 * @returns {OrgNode[]}
 */
export function flattenOrgTree(roots) {
  /** @type {OrgNode[]} */
  const flat = [];

  /**
   * @param {OrgNode} node
   */
  function walk(node) {
    flat.push(node);
    for (const child of node.children) {
      walk(child);
    }
  }

  for (const root of roots) {
    walk(root);
  }

  return flat;
}

/** @type {typeof flattenOrgTree} */
export const flattenTree = flattenOrgTree;
