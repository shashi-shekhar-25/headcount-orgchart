import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildOrgTree, flattenTree } from '../client/src/lib/buildOrgTree.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadFixture(name) {
  const file = path.join(__dirname, '..', 'fixtures', name);
  return JSON.parse(readFileSync(file, 'utf8'));
}

describe('buildOrgTree', () => {
  it('builds a single-root tree with correct depths', () => {
    const employees = loadFixture('small-org.json');
    const roots = buildOrgTree(employees);

    assert.equal(roots.length, 1);
    assert.equal(roots[0].id, 'E001');
    assert.equal(roots[0].depth, 0);
    assert.equal(roots[0].children.length, 2);

    const eve = roots[0].children
      .find((c) => c.id === 'E002')
      ?.children.find((c) => c.id === 'E004')
      ?.children.find((c) => c.id === 'E005');

    assert.ok(eve);
    assert.equal(eve.depth, 3);
  });

  it('sorts children alphabetically by name', () => {
    const employees = loadFixture('small-org.json');
    const roots = buildOrgTree(employees);
    const childNames = roots[0].children.map((c) => c.name);
    assert.deepEqual(childNames, ['Bob Smith', 'Carol Lee']);
  });

  it('computes direct report counts and span counts', () => {
    const employees = loadFixture('small-org.json');
    const roots = buildOrgTree(employees);
    const ceo = roots[0];
    const vpEngineering = ceo.children.find((child) => child.id === 'E002');
    const engineeringManager = vpEngineering.children.find((child) => child.id === 'E004');

    assert.equal(ceo.directReportCount, 2);
    assert.equal(ceo.spanCount, 9);
    assert.equal(vpEngineering.directReportCount, 2);
    assert.equal(vpEngineering.spanCount, 4);
    assert.equal(engineeringManager.directReportCount, 2);
    assert.equal(engineeringManager.spanCount, 2);
  });

  it('returns multiple roots for multi-root fixture', () => {
    const employees = loadFixture('multi-root.json');
    const roots = buildOrgTree(employees);
    assert.equal(roots.length, 2);
    assert.deepEqual(
      roots.map((r) => r.id).sort(),
      ['R1', 'R2']
    );
  });

  it('flattenTree returns all nodes', () => {
    const employees = loadFixture('small-org.json');
    const roots = buildOrgTree(employees);
    const flat = flattenTree(roots);
    assert.equal(flat.length, employees.length);
  });
});
