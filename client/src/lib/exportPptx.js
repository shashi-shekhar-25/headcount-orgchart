import PptxGenJS from 'pptxgenjs';
import { buildOrgTree, flattenOrgTree } from './buildOrgTree.js';

/** @typedef {import('./types.js').Employee} Employee */

/**
 * @param {Employee[]} employees
 * @returns {Promise<Blob>}
 */
export async function exportOrgChartPptx(employees) {
  const roots = buildOrgTree(employees);
  const flatEmployees = flattenOrgTree(roots);
  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';

  const titleSlide = pptx.addSlide();
  titleSlide.addText('Headcount Org Chart', {
    x: 0.5,
    y: 0.5,
    fontSize: 32,
    bold: true,
    color: '363636',
  });
  titleSlide.addText(`Exported on ${new Date().toLocaleDateString()}`, {
    x: 0.5,
    y: 1.4,
    fontSize: 14,
    color: '6b7280',
  });
  titleSlide.addText(`Total employees: ${employees.length}`, {
    x: 0.5,
    y: 2.0,
    fontSize: 18,
    color: '1f2937',
  });

  for (const employee of flatEmployees) {
    const slide = pptx.addSlide();
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.45,
      y: 0.5,
      w: 9.0,
      h: 4.5,
      fill: 'f8fafc',
      line: { color: 'cbd5e1', width: 1.5 },
      radius: 12,
    });

    slide.addText(employee.name, {
      x: 0.75,
      y: 0.75,
      fontSize: 28,
      bold: true,
      color: '1f2937',
    });

    slide.addText(employee.title || 'No title', {
      x: 0.75,
      y: 1.45,
      fontSize: 18,
      color: '475569',
    });

    const managerName = employee.managerId
      ? employeeById.get(employee.managerId)?.name ?? 'Unknown manager'
      : 'No manager';

    slide.addText([
      { text: 'Department: ', options: { bold: true } },
      { text: employee.department || 'Unassigned' },
    ], {
      x: 0.75,
      y: 2.2,
      fontSize: 14,
      color: '334155',
    });

    slide.addText([
      { text: 'Manager: ', options: { bold: true } },
      { text: managerName },
    ], {
      x: 0.75,
      y: 2.75,
      fontSize: 14,
      color: '334155',
    });

    slide.addText([
      { text: 'Reports / Span: ', options: { bold: true } },
      { text: `${employee.directReportCount}/${employee.spanCount}` },
    ], {
      x: 0.75,
      y: 3.3,
      fontSize: 14,
      color: '111827',
    });

    slide.addText(`Depth: ${employee.depth}`, {
      x: 0.75,
      y: 3.85,
      fontSize: 14,
      color: '475569',
    });
  }

  const blob = await pptx.write('blob');
  return blob;
}
