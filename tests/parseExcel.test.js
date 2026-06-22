import test from 'node:test';
import assert from 'node:assert';
import { detectColumnMap, extractRows, findHeaderRow, resolveColumnMap } from '../client/src/lib/parseExcel.js';

test('extractRows returns rows when given a simple row matrix', () => {
  const rows = extractRows([
    ['Employee ID', 'Name'],
    ['E001', 'Alex Morgan'],
  ]);
  assert.deepEqual(rows, [
    ['Employee ID', 'Name'],
    ['E001', 'Alex Morgan'],
  ]);
});

test('extractRows returns the first sheet data when given a sheet array', () => {
  const rows = extractRows([
    {
      sheet: 'Headcount',
      data: [
        ['Employee ID', 'Name'],
        ['E001', 'Alex Morgan'],
      ],
    },
  ]);
  assert.deepEqual(rows, [
    ['Employee ID', 'Name'],
    ['E001', 'Alex Morgan'],
  ]);
});

test('detectColumnMap recognizes Employee and Manager headers', () => {
  const map = detectColumnMap(['Employee', 'Name', 'Manager', 'Title', 'Department']);
  assert.equal(map.id, 0);
  assert.equal(map.name, 1);
  assert.equal(map.managerId, 2);
});

test('resolveColumnMap falls back on common header patterns', () => {
  const map = resolveColumnMap(['Emp ID', 'Full Name', 'Boss', 'Job Title', 'Dept']);
  assert.equal(map.id, 0);
  assert.equal(map.name, 1);
  assert.equal(map.managerId, 2);
});

test('extractRows prefers the sheet with required headers when multiple sheets are present', () => {
  const rows = extractRows([
    {
      sheet: 'Cover',
      data: [
        ['Notes'],
        ['This workbook contains the org chart on the next sheet.'],
      ],
    },
    {
      sheet: 'Data',
      data: [
        ['Employee ID', 'Name'],
        ['E001', 'Alex Morgan'],
      ],
    },
  ]);
  assert.deepEqual(rows, [
    ['Employee ID', 'Name'],
    ['E001', 'Alex Morgan'],
  ]);
});

test('findHeaderRow finds headers below the first row', () => {
  const result = findHeaderRow([
    ['Notes'],
    ['Employee ID', 'Name', 'Manager'],
    ['E001', 'Alex Morgan', ''],
  ]);
  assert.equal(result?.headerIndex, 1);
  assert.equal(result?.columnMap.id, 0);
  assert.equal(result?.columnMap.name, 1);
  assert.equal(result?.columnMap.managerId, 2);
});

test('extractRows selects the sheet that contains the org header row', () => {
  const rows = extractRows([
    {
      sheet: 'Cover',
      data: [
        ['Notes'],
        ['This is not the org sheet'],
      ],
    },
    {
      sheet: 'Data',
      data: [
        ['Notes'],
        ['Employee ID', 'Name', 'Manager'],
        ['E001', 'Alex Morgan', ''],
      ],
    },
  ]);
  assert.deepEqual(rows, [
    ['Notes'],
    ['Employee ID', 'Name', 'Manager'],
    ['E001', 'Alex Morgan', ''],
  ]);
});

test('extractRows returns an empty array for invalid input', () => {
  assert.deepEqual(extractRows(null), []);
  assert.deepEqual(extractRows([]), []);
  assert.deepEqual(extractRows([{}]), []);
});
