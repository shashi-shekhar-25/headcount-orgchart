import { useMemo, useState } from 'react';
import { getDescendantIds } from '../lib/reorgEngine.js';

/**
 * @param {string} query
 * @param {import('../lib/types.js').Employee[]} options
 * @param {Set<string>} blockedIds
 */
function filterManagerCandidates(query, options, blockedIds) {
  const lowerQuery = query.trim().toLowerCase();
  return options
    .filter((employee) => !blockedIds.has(employee.id))
    .filter((employee) => {
      if (!lowerQuery) return true;
      return [employee.name, employee.title, employee.department]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(lowerQuery));
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * @param {{
 *   employee: import('../lib/types.js').Employee,
 *   employees: import('../lib/types.js').Employee[],
 *   metrics: Map<string, { directReports: number, spanCount: number }>,
 *   onClose: () => void,
 *   onDelete: (employeeId: string, mode: 'promote' | 'unassign') => void,
 *   onChangeManager: (employeeId: string, managerId) => void,
 * }} props
 */
export function NodeInteractionPanel({
  employee,
  employees,
  metrics,
  onClose,
  onDelete,
  onChangeManager,
}) {
  const [search, setSearch] = useState('');
  const [deleteMode, setDeleteMode] = useState('promote');

  const descendants = useMemo(() => new Set(getDescendantIds(employees, employee.id)), [employees, employee.id]);
  const candidateManagers = useMemo(
    () => filterManagerCandidates(search, employees, new Set([...descendants, employee.id])),
    [employees, employee.id, search, descendants]
  );

  const metric = metrics.get(employee.id) ?? { directReports: 0, spanCount: 0 };

  return (
    <div className="interaction-panel" role="dialog" aria-label="Employee actions">
      <div className="interaction-panel__header">
        <div>
          <p className="interaction-panel__label">Selected employee</p>
          <h3>{employee.name}</h3>
        </div>
        <button type="button" className="interaction-panel__close" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="interaction-panel__summary">
        <div>{employee.title || 'No title'}</div>
        <div>{employee.department || 'No department'}</div>
        <div className="interaction-panel__metric">
          <strong>{metric.directReports}</strong> direct reports
        </div>
        <div className="interaction-panel__metric">
          <strong>{metric.spanCount}</strong> total span
        </div>
      </div>

      <section className="interaction-panel__section">
        <h4>Change manager</h4>
        <input
          type="search"
          placeholder="Search managers"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="interaction-panel__input"
        />
        <div className="interaction-panel__options">
          <button
            type="button"
            className="button button-secondary interaction-panel__option"
            onClick={() => onChangeManager(employee.id, null)}
          >
            Set no manager
          </button>
          {candidateManagers.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              className="button button-secondary interaction-panel__option"
              onClick={() => onChangeManager(employee.id, candidate.id)}
            >
              {candidate.name} {candidate.title ? `· ${candidate.title}` : ''}
            </button>
          ))}
          {candidateManagers.length === 0 ? (
            <div className="interaction-panel__empty">No eligible managers found.</div>
          ) : null}
        </div>
      </section>

      <section className="interaction-panel__section">
        <h4>Remove this employee</h4>
        <div className="interaction-panel__radio-group">
          <label className="interaction-panel__radio">
            <input
              type="radio"
              name="delete-mode"
              value="promote"
              checked={deleteMode === 'promote'}
              onChange={() => setDeleteMode('promote')}
            />
            Promote direct reports to {employee.managerId ? 'current manager' : 'no manager'}
          </label>
          <label className="interaction-panel__radio">
            <input
              type="radio"
              name="delete-mode"
              value="unassign"
              checked={deleteMode === 'unassign'}
              onChange={() => setDeleteMode('unassign')}
            />
            Leave direct reports unassigned
          </label>
        </div>
        <button
          type="button"
          className="button button-accent interaction-panel__delete"
          onClick={() => onDelete(employee.id, deleteMode)}
        >
          Remove employee
        </button>
      </section>
    </div>
  );
}

/**
 * @param {{
 *   edge: import('@xyflow/react').Edge,
 *   employees: import('../lib/types.js').Employee[],
 *   metrics: Map<string, { directReports: number, spanCount: number }>,
 *   onClose: () => void,
 *   onRedirect: (employeeId: string, newManagerId) => void,
 * }} props
 */
export function EdgeInteractionPanel({ edge, employees, metrics, onClose, onRedirect }) {
  const employee = employees.find((item) => item.id === edge.target);
  if (!employee) return null;

  const descendants = useMemo(() => new Set(getDescendantIds(employees, employee.id)), [employees, employee.id]);
  const candidateManagers = useMemo(
    () => filterManagerCandidates('', employees, new Set([...descendants, employee.id])),
    [employees, employee.id, descendants]
  );

  const metric = metrics.get(employee.id) ?? { directReports: 0, spanCount: 0 };
  const currentManagerName = employee.managerId
    ? employees.find((item) => item.id === employee.managerId)?.name ?? employee.managerId
    : 'No manager';

  return (
    <div className="interaction-panel" role="dialog" aria-label="Edge redirect actions">
      <div className="interaction-panel__header">
        <div>
          <p className="interaction-panel__label">Redirect reporting</p>
          <h3>{employee.name}</h3>
        </div>
        <button type="button" className="interaction-panel__close" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="interaction-panel__summary">
        <div>Current manager: {currentManagerName}</div>
        <div className="interaction-panel__metric">
          <strong>{metric.directReports}</strong> direct reports
        </div>
        <div className="interaction-panel__metric">
          <strong>{metric.spanCount}</strong> total span
        </div>
      </div>

      <section className="interaction-panel__section">
        <h4>Choose a new manager</h4>
        <div className="interaction-panel__options">
          <button
            type="button"
            className="button button-secondary interaction-panel__option"
            onClick={() => onRedirect(employee.id, null)}
          >
            Set no manager
          </button>
          {candidateManagers.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              className="button button-secondary interaction-panel__option"
              onClick={() => onRedirect(employee.id, candidate.id)}
            >
              {candidate.name} {candidate.title ? `· ${candidate.title}` : ''}
            </button>
          ))}
          {candidateManagers.length === 0 ? (
            <div className="interaction-panel__empty">No eligible managers available.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
