import { useRef } from 'react';
import { parseExcel } from '../lib/parseExcel.js';
import { downloadSampleTemplate } from '../lib/exportExcel.js';

/**
 * @typedef {{
 *   sheetName: string | null,
 *   headerRowIndex: number | null,
 *   headers: string[],
 *   rowCount: number,
 * }} ParseDebugInfo
 */

/**
 * @param {{
 *   onLoad: (employees: import('../lib/types.js').Employee[], debug: ParseDebugInfo) => void,
 *   onError: (errors: string[]) => void,
 *   disabled?: boolean,
 * }} props
 */
export default function FileUpload({ onLoad, onError, disabled = false }) {
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { employees, errors, debug } = await parseExcel(file);
      if (errors.length > 0) {
        onError(errors);
        return;
      }
      if (employees.length === 0) {
        onError(['No employees found in the uploaded file.']);
        return;
      }
      onLoad(employees, debug ?? { sheetName: null, headerRowIndex: null, headers: [], rowCount: 0 });
    } catch (err) {
      onError([err instanceof Error ? err.message : 'Failed to parse Excel file.']);
    } finally {
      event.target.value = '';
    }
  }

  return (
    <div className="file-upload">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        hidden
        disabled={disabled}
        onChange={handleFileChange}
      />
      <button
        type="button"
        className="button button-secondary"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        Upload Excel
      </button>
      <button type="button" className="button button-secondary" onClick={() => downloadSampleTemplate()}>
        Download Template
      </button>
    </div>
  );
}
