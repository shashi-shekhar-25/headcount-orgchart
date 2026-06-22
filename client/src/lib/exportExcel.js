import ExcelJS from 'exceljs';

/** @typedef {import('./types.js').Employee} Employee */
/** @typedef {import('./types.js').ReorgChange} ReorgChange */

const HEADERS = ['Employee ID', 'Name', 'Manager ID', 'Title', 'Department'];

/**
 * @param {Employee[]} employees
 * @param {ReorgChange[]} [changes]
 * @returns {Promise<Blob>}
 */
async function buildWorkbookBlob(employees, changes = []) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Headcount');

  worksheet.addRow(HEADERS);
  worksheet.getRow(1).font = { bold: true };

  for (const employee of employees) {
    worksheet.addRow([
      employee.id,
      employee.name,
      employee.managerId ?? '',
      employee.title,
      employee.department,
    ]);
  }

  worksheet.columns.forEach((column) => {
    column.width = 18;
  });

  if (changes.length) {
    const changesSheet = workbook.addWorksheet('Changes');
    changesSheet.addRow(['Employee', 'From Manager', 'To Manager']);
    changesSheet.getRow(1).font = { bold: true };

    for (const change of changes) {
      changesSheet.addRow([
        change.employeeName,
        change.fromManagerName ?? 'No manager',
        change.toManagerName ?? 'No manager',
      ]);
    }

    changesSheet.columns.forEach((column) => {
      column.width = 24;
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * @param {Employee[]} employees
 * @param {ReorgChange[]} [changes]
 * @returns {Promise<void>}
 */
export async function exportExcel(employees, changes = []) {
  const blob = await buildWorkbookBlob(employees, changes);
  downloadBlob(blob, 'headcount-scenario.xlsx');
}

/**
 * @param {Employee[]} employees
 * @param {ReorgChange[]} changes
 * @returns {Promise<Blob>}
 */
export async function exportScenario(employees, changes) {
  return buildWorkbookBlob(employees, changes);
}

/**
 * @returns {Promise<Blob>}
 */
export async function generateSampleTemplate() {
  /** @type {Employee[]} */
  const sampleEmployees = [
    { id: 'E001', name: 'Alex Morgan', managerId: null, title: 'CEO', department: 'Executive' },
    { id: 'E002', name: 'Blake Chen', managerId: 'E001', title: 'VP Engineering', department: 'Engineering' },
    { id: 'E003', name: 'Casey Rivera', managerId: 'E002', title: 'Engineering Manager', department: 'Engineering' },
    { id: 'E004', name: 'Dana Patel', managerId: 'E003', title: 'Senior Engineer', department: 'Engineering' },
    { id: 'E005', name: 'Elliot Brooks', managerId: 'E001', title: 'VP People', department: 'People' },
  ];

  return buildWorkbookBlob(sampleEmployees);
}

/**
 * @returns {Promise<void>}
 */
export async function downloadSampleTemplate() {
  const blob = await generateSampleTemplate();
  downloadBlob(blob, 'headcount-template.xlsx');
}

/**
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
