/** @typedef {import('./types.js').Employee} Employee */
/** @typedef {import('./types.js').ReorgChange} ReorgChange */

import { wouldCreateCycle } from './validateHierarchy.js';

/**
 * @param {Employee[]} employees
 * @param {string} draggedId
 * @param {string|null} newManagerId
 * @returns {{ ok: true, employees: Employee[] } | { ok: false, error: string }}
 */
export function applyReparent(employees, draggedId, newManagerId) {
  const byId = new Map(employees.map((e) => [e.id, e]));
  const dragged = byId.get(draggedId);

  if (!dragged) {
    return { ok: false, error: `Employee ${draggedId} was not found.` };
  }

  if (newManagerId && !byId.has(newManagerId)) {
    return { ok: false, error: `Manager ${newManagerId} was not found.` };
  }

  if (draggedId === newManagerId) {
    return { ok: false, error: 'An employee cannot report to themselves.' };
  }

  if (dragged.managerId === newManagerId) {
    return { ok: true, employees };
  }

  if (wouldCreateCycle(employees, draggedId, newManagerId)) {
    const managerName = newManagerId ? byId.get(newManagerId)?.name ?? newManagerId : 'No manager';
    return {
      ok: false,
      error: `Cannot make ${dragged.name} report to ${managerName} because it would create a reporting cycle.`,
    };
  }

  const updated = employees.map((e) =>
    e.id === draggedId ? { ...e, managerId: newManagerId } : { ...e }
  );

  return { ok: true, employees: updated };
}

/**
 * @param {Employee[]} employees
 * @returns {Map<string, {directReports:number, spanCount:number}>}
 */
export function calculateReportMetrics(employees) {
  const childrenByManager = new Map();
  for (const employee of employees) {
    if (!employee.managerId) continue;
    const list = childrenByManager.get(employee.managerId) ?? [];
    list.push(employee.id);
    childrenByManager.set(employee.managerId, list);
  }

  const memo = new Map();

  function countDescendants(employeeId) {
    if (memo.has(employeeId)) {
      return memo.get(employeeId);
    }

    const directChildren = childrenByManager.get(employeeId) ?? [];
    let total = directChildren.length;
    for (const childId of directChildren) {
      total += countDescendants(childId);
    }

    memo.set(employeeId, total);
    return total;
  }

  const metrics = new Map();
  for (const employee of employees) {
    metrics.set(employee.id, {
      directReports: (childrenByManager.get(employee.id) ?? []).length,
      spanCount: countDescendants(employee.id),
    });
  }

  return metrics;
}

/**
 * @param {Employee[]} originalEmployees
 * @param {Employee[]} scenarioEmployees
 * @returns {ReorgChange[]}
 */
export function computeChanges(originalEmployees, scenarioEmployees) {
  const originalById = new Map(originalEmployees.map((e) => [e.id, e]));
  const scenarioById = new Map(scenarioEmployees.map((e) => [e.id, e]));
  /** @type {ReorgChange[]} */
  const changes = [];

  for (const scenarioEmployee of scenarioEmployees) {
    const original = originalById.get(scenarioEmployee.id);
    if (!original || original.managerId === scenarioEmployee.managerId) {
      continue;
    }

    changes.push({
      employeeId: scenarioEmployee.id,
      employeeName: scenarioEmployee.name,
      fromManagerId: original.managerId,
      toManagerId: scenarioEmployee.managerId,
      fromManagerName: original.managerId
        ? scenarioById.get(original.managerId)?.name ?? original.managerId
        : null,
      toManagerName: scenarioEmployee.managerId
        ? scenarioById.get(scenarioEmployee.managerId)?.name ?? scenarioEmployee.managerId
        : null,
    });
  }

  return changes.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
}

/**
 * @param {import('@xyflow/react').Node[]} nodes
 * @param {{ x: number, y: number }} point
 * @param {string} excludeId
 * @param {number} [threshold=120]
 * @returns {string|null}
 */
export function findDropTarget(nodes, point, excludeId, threshold = 120) {
  let bestId = null;
  let bestDist = Infinity;

  for (const node of nodes) {
    if (node.id === excludeId) continue;
    const cx = node.position.x + 110;
    const cy = node.position.y + 45;
    const dist = Math.hypot(point.x - cx, point.y - cy);
    if (dist < threshold && dist < bestDist) {
      bestDist = dist;
      bestId = node.id;
    }
  }

  return bestId;
}

/**
 * @param {Employee[]} employees
 * @param {string} employeeId
 * @returns {string[]}
 */
export function getDescendantIds(employees, employeeId) {
  const childrenByManager = new Map();
  for (const e of employees) {
    if (!e.managerId) continue;
    if (!childrenByManager.has(e.managerId)) childrenByManager.set(e.managerId, []);
    childrenByManager.get(e.managerId).push(e.id);
  }

  /** @type {string[]} */
  const result = [];
  const stack = [...(childrenByManager.get(employeeId) ?? [])];

  while (stack.length) {
    const id = stack.pop();
    result.push(id);
    stack.push(...(childrenByManager.get(id) ?? []));
  }

  return result;
}

export { wouldCreateCycle };
