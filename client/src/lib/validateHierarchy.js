/** @typedef {import('./types.js').Employee} Employee */

/**
 * @param {Employee[]} employees
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateHierarchy(employees) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  const idSet = new Set();
  const byId = new Map();

  for (const employee of employees) {
    if (idSet.has(employee.id)) {
      errors.push(`Duplicate employee ID: ${employee.id}`);
    } else {
      idSet.add(employee.id);
      byId.set(employee.id, employee);
    }
  }

  for (const employee of employees) {
    if (employee.managerId === employee.id) {
      errors.push(`${employee.name} (${employee.id}) cannot be their own manager.`);
    }

    if (employee.managerId && !byId.has(employee.managerId)) {
      errors.push(`${employee.name} (${employee.id}) has unknown manager ID: ${employee.managerId}`);
    }

    if (!employee.title) {
      warnings.push(`${employee.name} (${employee.id}) has an empty title.`);
    }

    if (!employee.department) {
      warnings.push(`${employee.name} (${employee.id}) has an empty department.`);
    }
  }

  for (const employee of employees) {
    const visited = new Set();
    let currentId = employee.id;

    while (currentId) {
      if (visited.has(currentId)) {
        errors.push(`Cycle detected involving employee ID: ${currentId}`);
        break;
      }
      visited.add(currentId);
      const current = byId.get(currentId);
      currentId = current?.managerId ?? null;
    }
  }

  const roots = employees.filter((employee) => !employee.managerId);
  if (roots.length > 1) {
    warnings.push(`Multiple top-level leaders detected (${roots.length}).`);
  }

  return { errors, warnings };
}

/**
 * @param {Employee[]} employees
 * @param {string} employeeId
 * @param {string|null} newManagerId
 * @returns {boolean}
 */
export function wouldCreateCycle(employees, employeeId, newManagerId) {
  if (!newManagerId) {
    return false;
  }

  if (employeeId === newManagerId) {
    return true;
  }

  const byId = new Map(employees.map((employee) => [employee.id, employee]));
  let currentId = newManagerId;

  while (currentId) {
    if (currentId === employeeId) {
      return true;
    }
    currentId = byId.get(currentId)?.managerId ?? null;
  }

  return false;
}
