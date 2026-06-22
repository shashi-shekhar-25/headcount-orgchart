/** @typedef {import('./types.js').Employee} Employee */

const COLUMN_ALIASES = {
  id: ['employee id', 'employee', 'emp id', 'id', 'employeeid', 'empid'],
  name: ['name', 'employee name', 'full name', 'employeename', 'fullname'],
  managerId: ['manager', 'manager id', 'reports to', 'reports to id', 'supervisor', 'supervisor id', 'managerid', 'reportsto', 'supervisorid'],
  title: ['title', 'job title', 'role', 'jobtitle'],
  department: ['department', 'dept', 'team'],
};

/**
 * @param {string} header
 * @returns {string}
 */
function normalizeHeader(header) {
  return String(header ?? '')
    .normalize('NFKC')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[\u200B\u200C\u200D\u2060]/g, '')
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * @param {string[]} headers
 * @returns {Record<string, number>}
 */
export function detectColumnMap(headers) {
  /** @type {Record<string, number>} */
  const map = {};
  const normalized = headers.map(normalizeHeader);

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const index = normalized.findIndex((header) => aliases.includes(header));
    if (index !== -1) {
      map[field] = index;
    }
  }

  return map;
}

/**
 * @param {string[]} headers
 * @returns {Record<string, number>}
 */
export function resolveColumnMap(headers) {
  const map = detectColumnMap(headers);

  const normalized = headers.map(normalizeHeader);

  if (map.id === undefined) {
    const index = normalized.findIndex((header) => /\b(emp(LOYEE)?( id| number|#)?)\b/.test(header));
    if (index !== -1) map.id = index;
  }

  if (map.name === undefined) {
    const index = normalized.findIndex((header) => /\b(name|full name|employee name)\b/.test(header));
    if (index !== -1) map.name = index;
  }

  if (map.managerId === undefined) {
    const index = normalized.findIndex((header) => /\b(manager|manager id|reports to|reports to id|supervisor|supervisor id|boss|lead)\b/.test(header));
    if (index !== -1) map.managerId = index;
  }

  if (map.title === undefined) {
    const index = normalized.findIndex((header) => /\b(title|job title|role)\b/.test(header));
    if (index !== -1) map.title = index;
  }

  if (map.department === undefined) {
    const index = normalized.findIndex((header) => /\b(department|dept|team)\b/.test(header));
    if (index !== -1) map.department = index;
  }

  return map;
}

/**
 * @param {unknown} value
 * @returns {string|null}
 */
function normalizeId(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value).trim();
  return text === '' ? null : text;
}

/**
 * @param {File} file
 * @returns {Promise<{ employees: Employee[], errors: string[] }>}
 */
/**
 * @param {unknown[][]} rows
 * @returns {boolean}
 */
function hasRequiredHeaders(rows) {
  if (!Array.isArray(rows) || rows.length === 0 || !Array.isArray(rows[0])) {
    return false;
  }
  const headers = rows[0].map((cell) => String(cell ?? ''));
  const columnMap = detectColumnMap(headers);
  return columnMap.id !== undefined && columnMap.name !== undefined;
}

/**
 * @param {unknown} rowsResult
 * @returns {unknown[][]}
 */
function findSheetWithHeaders(sheets) {
  for (const sheet of sheets) {
    if (findHeaderRow(sheet.data)) {
      return sheet;
    }
  }
  return null;
}

function extractSheet(rowsResult) {
  if (!Array.isArray(rowsResult) || rowsResult.length === 0) {
    return { rows: [], sheetName: null };
  }

  const first = rowsResult[0];

  if (Array.isArray(first)) {
    return { rows: rowsResult, sheetName: null };
  }

  const sheets = rowsResult
    .filter((sheet) => sheet && typeof sheet === 'object' && Array.isArray(sheet.data))
    .map((sheet) => ({
      name: sheet.sheet || null,
      data: /** @type {unknown[][]} */ (sheet.data),
    }));

  if (sheets.length === 0) {
    return { rows: [], sheetName: null };
  }

  const sheetWithHeaders = findSheetWithHeaders(sheets);
  const selected = sheetWithHeaders ?? sheets[0];
  return { rows: selected.data, sheetName: selected.name };
}

export function extractRows(rowsResult) {
  return extractSheet(rowsResult).rows;
}

/**
 * @param {unknown[][]} rows
 * @returns {{ headerIndex: number, columnMap: Record<string, number> } | null}
 */
export function findHeaderRow(rows) {
  if (!Array.isArray(rows)) {
    return null;
  }

  const maxHeaderRows = Math.min(rows.length, 20);
  for (let rowIndex = 0; rowIndex < maxHeaderRows; rowIndex += 1) {
    const row = rows[rowIndex];
    if (!Array.isArray(row)) {
      continue;
    }
    const columnMap = resolveColumnMap(row.map((cell) => String(cell ?? '')));
    if (columnMap.id !== undefined && columnMap.id >= 0 && columnMap.name !== undefined && columnMap.name >= 0) {
      return { headerIndex: rowIndex, columnMap };
    }
  }
  return null;
}

export async function parseExcel(file) {
  /** @type {string[]} */
  const errors = [];

  try {
    const readExcelFile = (await import('read-excel-file/browser')).default;
    const { rows, sheetName } = extractSheet(await readExcelFile(file));

    if (!rows.length) {
      return { employees: [], errors: ['The spreadsheet is empty.'], debug: { sheetName, headerRowIndex: null, headers: [] } };
    }

    const headerInfo = findHeaderRow(rows);
    if (!headerInfo) {
      const headers = rows[0].map((cell) => String(cell ?? ''));
      return {
        employees: [],
        errors: [`Missing required headers. Found headers: ${headers.join(', ')}`],
        debug: { sheetName, headerRowIndex: null, headers, rowCount: rows.length },
      };
    }

    const { headerIndex, columnMap } = headerInfo;
    const dataRows = rows.slice(headerIndex + 1);

    /** @type {Employee[]} */
    const employees = [];

    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex += 1) {
      const row = dataRows[rowIndex];
      if (!row || row.every((cell) => cell === null || cell === undefined || String(cell).trim() === '')) {
        continue;
      }

      const absoluteRowIndex = headerIndex + 2 + rowIndex;
      const id = normalizeId(row[columnMap.id]);
      if (!id) {
        errors.push(`Row ${absoluteRowIndex}: missing Employee ID.`);
        continue;
      }

      const name = String(row[columnMap.name] ?? '').trim();
      if (!name) {
        errors.push(`Row ${absoluteRowIndex}: missing Name.`);
        continue;
      }

      const managerId = columnMap.managerId !== undefined
        ? normalizeId(row[columnMap.managerId])
        : null;

      employees.push({
        id,
        name,
        managerId,
        title: columnMap.title !== undefined ? String(row[columnMap.title] ?? '').trim() : '',
        department: columnMap.department !== undefined ? String(row[columnMap.department] ?? '').trim() : '',
      });
    }

    return {
      employees,
      errors,
      debug: {
        sheetName,
        headerRowIndex: headerInfo.headerIndex,
        headers: rows[headerInfo.headerIndex].map((cell) => String(cell ?? '')),
        rowCount: rows.length,
      },
    };
  } catch (error) {
    return {
      employees: [],
      errors: [`Failed to read Excel file: ${error instanceof Error ? error.message : String(error)}`],
      debug: { sheetName: null, headerRowIndex: null, headers: [], rowCount: 0 },
    };
  }
}
