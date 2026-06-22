/** @typedef {import('../lib/types.js').ReorgChange} ReorgChange */

/**
 * @param {{
 *   changes: ReorgChange[],
 *   onReset: () => void,
 *   onExport: () => void,
 *   onExportPptx: () => void,
 *   disabled?: boolean,
 * }} props
 */
export default function ReorgPanel({ changes, onReset, onExport, onExportPptx, disabled = false }) {
  return (
    <aside className="reorg-panel">
      <div className="reorg-panel__header">
        <h2>Changes ({changes.length})</h2>
      </div>

      {changes.length === 0 ? (
        <p className="reorg-panel__empty">No reporting changes yet.</p>
      ) : (
        <ul className="change-list">
          {changes.map((change) => (
            <li key={change.employeeId} className="change-list__item">
              <strong>{change.employeeName}</strong>
              <span>
                {change.fromManagerName ?? 'No manager'}
                {' '}
                →
                {' '}
                {change.toManagerName ?? 'No manager'}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="reorg-panel__actions">
        <button type="button" className="button button-secondary" onClick={onReset} disabled={disabled || changes.length === 0}>
          Reset Scenario
        </button>
        <button type="button" className="button button-secondary" onClick={onExportPptx} disabled={disabled || changes.length === 0}>
          Export PPTX
        </button>
        <button type="button" className="button button-primary" onClick={onExport} disabled={disabled || changes.length === 0}>
          Export Scenario
        </button>
      </div>
    </aside>
  );
}
