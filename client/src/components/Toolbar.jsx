import FileUpload from './FileUpload.jsx';

/**
 * @param {{
 *   hasData: boolean,
 *   reorgMode: boolean,
 *   hasChanges: boolean,
 *   onLoad: (employees: import('../lib/types.js').Employee[]) => void,
 *   onError: (errors: string[]) => void,
 *   onToggleReorg: () => void,
 *   onReset: () => void,
 *   onExport: () => void,
 *   onExportPptx: () => void,
 * }} props
 */
export default function Toolbar({
  hasData,
  reorgMode,
  hasChanges,
  onLoad,
  onError,
  onToggleReorg,
  onReset,
  onExport,
  onExportPptx,
}) {
  return (
    <header className="toolbar">
      <div className="toolbar__brand">
        <h1>Headcount Org Chart</h1>
        <p className="privacy-notice">
          Your file is processed locally in your browser and is never uploaded to our servers.
        </p>
      </div>
      <div className="toolbar__actions">
        <FileUpload onLoad={onLoad} onError={onError} />
        {hasData ? (
          <>
            <button
              type="button"
              className={`button ${reorgMode ? 'button-accent' : 'button-secondary'}`}
              onClick={onToggleReorg}
            >
              {reorgMode ? 'Exit Reorg Mode' : 'Reorg Mode'}
            </button>
            <button type="button" className="button button-secondary" onClick={onReset} disabled={!hasChanges}>
              Reset
            </button>
            <button type="button" className="button button-secondary" onClick={onExportPptx}>
              Export PPTX
            </button>
            <button type="button" className="button button-primary" onClick={onExport}>
              Export XLSX
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}
