import { useReducer, useMemo, useCallback, useState } from 'react';
import Toolbar from './components/Toolbar.jsx';
import OrgChart from './components/OrgChart.jsx';
import ReorgPanel from './components/ReorgPanel.jsx';
import { NodeInteractionPanel, EdgeInteractionPanel } from './components/InteractionPanel.jsx';
import { validateHierarchy } from './lib/validateHierarchy.js';
import { applyReparent, computeChanges, calculateReportMetrics } from './lib/reorgEngine.js';
import { exportScenario, downloadBlob } from './lib/exportExcel.js';
import { exportOrgChartPptx } from './lib/exportPptx.js';

/** @typedef {import('./lib/types.js').Employee} Employee */

/** @type {import('./lib/types.js').Employee[]} */
const initialEmployees = [];

/**
 * @typedef {Object} AppState
 * @property {Employee[]} originalEmployees
 * @property {Employee[]} scenarioEmployees
 * @property {boolean} reorgMode
 * @property {string[]} validationErrors
 * @property {string[]} validationWarnings
 * @property {string|null} reorgError
 */

/** @type {AppState} */
const initialState = {
  originalEmployees: initialEmployees,
  scenarioEmployees: initialEmployees,
  reorgMode: false,
  validationErrors: [],
  validationWarnings: [],
  reorgError: null,
};

/**
 * @param {AppState} state
 * @param {Object} action
 * @returns {AppState}
 */
function appReducer(state, action) {
  switch (action.type) {
    case 'LOAD_FILE': {
      const { errors, warnings } = validateHierarchy(action.employees);
      return {
        ...initialState,
        originalEmployees: action.employees,
        scenarioEmployees: action.employees.map((e) => ({ ...e })),
        validationErrors: errors,
        validationWarnings: warnings,
      };
    }
    case 'APPLY_REPARENT': {
      const result = applyReparent(state.scenarioEmployees, action.draggedId, action.newManagerId);
      if (!result.ok) {
        return { ...state, reorgError: result.error };
      }
      return {
        ...state,
        scenarioEmployees: result.employees,
        reorgError: null,
      };
    }
    case 'RESET_SCENARIO':
      return {
        ...state,
        scenarioEmployees: state.originalEmployees.map((e) => ({ ...e })),
        reorgError: null,
      };
    case 'SET_SCENARIO_EMPLOYEES':
      return {
        ...state,
        scenarioEmployees: action.employees,
        reorgError: null,
      };
    case 'TOGGLE_REORG_MODE':
      return {
        ...state,
        reorgMode: !state.reorgMode,
        reorgError: null,
      };
    case 'CLEAR_REORG_ERROR':
      return { ...state, reorgError: null };
    case 'SET_REORG_ERROR':
      return { ...state, reorgError: action.error };
    case 'SET_UPLOAD_ERRORS':
      return {
        ...initialState,
        validationErrors: action.errors,
      };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [exporting, setExporting] = useState(false);
  const [uploadDebug, setUploadDebug] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);

  const hasData = state.scenarioEmployees.length > 0 && state.validationErrors.length === 0;
  const changes = useMemo(
    () => computeChanges(state.originalEmployees, state.scenarioEmployees),
    [state.originalEmployees, state.scenarioEmployees]
  );

  const reportMetrics = useMemo(
    () => calculateReportMetrics(state.scenarioEmployees),
    [state.scenarioEmployees]
  );

  const handleLoad = useCallback((employees, debug) => {
    setUploadDebug(debug);
    setSelectedEmployeeId(null);
    setSelectedEdge(null);
    dispatch({ type: 'LOAD_FILE', employees });
  }, []);

  const handleUploadError = useCallback((errors) => {
    setUploadDebug(null);
    dispatch({ type: 'SET_UPLOAD_ERRORS', errors });
  }, []);

  const handleReparent = useCallback((draggedId, newManagerId) => {
    dispatch({ type: 'APPLY_REPARENT', draggedId, newManagerId });
  }, []);

  const handleSetScenarioEmployees = useCallback((employees) => {
    dispatch({ type: 'SET_SCENARIO_EMPLOYEES', employees });
  }, []);

  const handleDeleteEmployee = useCallback(
    (employeeId, mode) => {
      const target = state.scenarioEmployees.find((employee) => employee.id === employeeId);
      if (!target) {
        return;
      }

      const employees = state.scenarioEmployees
        .filter((employee) => employee.id !== employeeId)
        .map((employee) =>
          employee.managerId === employeeId
            ? { ...employee, managerId: mode === 'promote' ? target.managerId : null }
            : { ...employee }
        );

      setSelectedEmployeeId(null);
      setSelectedEdge(null);
      handleSetScenarioEmployees(employees);
    },
    [handleSetScenarioEmployees, state.scenarioEmployees]
  );

  const handleSelectEmployee = useCallback((employeeId) => {
    setSelectedEmployeeId(employeeId);
    setSelectedEdge(null);
  }, []);

  const handleSelectEdge = useCallback((edge) => {
    setSelectedEdge(edge);
    setSelectedEmployeeId(null);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedEmployeeId(null);
    setSelectedEdge(null);
  }, []);

  const handleReset = useCallback(() => {
    setSelectedEmployeeId(null);
    setSelectedEdge(null);
    dispatch({ type: 'RESET_SCENARIO' });
  }, []);

  const handleToggleReorg = useCallback(() => {
    setSelectedEmployeeId(null);
    setSelectedEdge(null);
    dispatch({ type: 'TOGGLE_REORG_MODE' });
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const blob = await exportScenario(state.scenarioEmployees, changes);
      downloadBlob(blob, 'headcount-scenario.xlsx');
    } finally {
      setExporting(false);
    }
  }, [state.scenarioEmployees, changes]);

  const handleExportPptx = useCallback(async () => {
    setExporting(true);
    try {
      const blob = await exportOrgChartPptx(state.scenarioEmployees);
      downloadBlob(blob, 'headcount-org-chart.pptx');
    } finally {
      setExporting(false);
    }
  }, [state.scenarioEmployees]);

  const selectedEmployee = selectedEmployeeId
    ? state.scenarioEmployees.find((employee) => employee.id === selectedEmployeeId)
    : null;

  return (
    <div className="app">
      <Toolbar
        hasData={hasData}
        reorgMode={state.reorgMode}
        hasChanges={changes.length > 0}
        onLoad={handleLoad}
        onError={handleUploadError}
        onToggleReorg={handleToggleReorg}
        onReset={handleReset}
        onExport={handleExport}
        onExportPptx={handleExportPptx}
      />

      {state.validationErrors.length > 0 ? (
        <div className="alert alert-error">
          <strong>Cannot display org chart:</strong>
          <ul>
            {state.validationErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {state.validationWarnings.length > 0 && state.validationErrors.length === 0 ? (
        <div className="alert alert-warning">
          <strong>Warnings:</strong>
          <ul>
            {state.validationWarnings.map((warn) => (
              <li key={warn}>{warn}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {uploadDebug ? (
        <div className="alert alert-warning">
          <strong>Upload diagnostics:</strong>
          <ul>
            <li>Sheet: {uploadDebug.sheetName ?? 'default or no sheet name'}</li>
            <li>Header row: {uploadDebug.headerRowIndex !== null ? uploadDebug.headerRowIndex + 1 : 'not found'}</li>
            <li>Headers: {uploadDebug.headers.join(', ') || 'none'}</li>
            <li>Row count: {uploadDebug.rowCount}</li>
          </ul>
        </div>
      ) : null}

      {state.reorgError ? (
        <div className="alert alert-error">
          {state.reorgError}
          <button type="button" className="alert__dismiss" onClick={() => dispatch({ type: 'CLEAR_REORG_ERROR' })}>
            Dismiss
          </button>
        </div>
      ) : null}

      {!hasData && state.validationErrors.length === 0 ? (
        <main className="empty-state">
          <h2>Upload a headcount spreadsheet</h2>
          <p>
            Use an Excel file with columns for Employee ID, Name, Manager ID, Title, and Department.
            Download the sample template to get started.
          </p>
        </main>
      ) : null}

      {hasData ? (
        <main className="main-layout">
          <section className="chart-area">
            <OrgChart
              employees={state.scenarioEmployees}
              reorgMode={state.reorgMode}
              onReparent={handleReparent}
              onReorgError={(error) => dispatch({ type: 'SET_REORG_ERROR', error })}
              onNodeClick={handleSelectEmployee}
              onEdgeClick={handleSelectEdge}
              onPaneClick={handleClearSelection}
              activeEdgeId={selectedEdge?.id ?? null}
              activeNodeId={selectedEmployeeId}
            />
            {selectedEmployee ? (
              <NodeInteractionPanel
                employee={selectedEmployee}
                employees={state.scenarioEmployees}
                metrics={reportMetrics}
                onClose={handleClearSelection}
                onDelete={handleDeleteEmployee}
                onChangeManager={handleReparent}
              />
            ) : null}
            {selectedEdge ? (
              <EdgeInteractionPanel
                edge={selectedEdge}
                employees={state.scenarioEmployees}
                metrics={reportMetrics}
                onClose={handleClearSelection}
                onRedirect={handleReparent}
              />
            ) : null}
          </section>
          <ReorgPanel
            changes={changes}
            onReset={handleReset}
            onExport={handleExport}
            onExportPptx={handleExportPptx}
            disabled={exporting}
          />
        </main>
      ) : null}
    </div>
  );
}
