import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { applyReparent, calculateReportMetrics, computeChanges, getDescendantIds } from '../client/src/lib/reorgEngine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadFixture(name) {
  const file = path.join(__dirname, '..', 'fixtures', name);
  return JSON.parse(readFileSync(file, 'utf8'));
}

describe('applyReparent', () => {
  it('updates managerId on success', () => {
    const employees = loadFixture('small-org.json');
    const result = applyReparent(employees, 'E005', 'E002');
    assert.equal(result.ok, true);
    const updated = result.employees.find((e) => e.id === 'E005');
    assert.equal(updated.managerId, 'E002');
  });

  it('rejects cycle-creating moves', () => {
    const employees = loadFixture('small-org.json');
    const result = applyReparent(employees, 'E002', 'E005');
    assert.equal(result.ok, false);
    assert.match(result.error, /cycle/i);
  });

  it('rejects self-manager', () => {
    const employees = loadFixture('small-org.json');
    const result = applyReparent(employees, 'E002', 'E002');
    assert.equal(result.ok, false);
  });
});

describe('computeChanges', () => {
  it('lists employees whose manager changed', () => {
    const original = loadFixture('small-org.json');
    const scenario = original.map((e) => ({ ...e }));
    scenario.find((e) => e.id === 'E005').managerId = 'E002';

    const changes = computeChanges(original, scenario);
    assert.equal(changes.length, 1);
    assert.equal(changes[0].employeeId, 'E005');
    assert.equal(changes[0].fromManagerName, 'Dave Kim');
    assert.equal(changes[0].toManagerName, 'Bob Smith');
  });
});

describe('getDescendantIds', () => {
  it('returns all reports recursively', () => {
    const employees = loadFixture('small-org.json');
    const descendants = getDescendantIds(employees, 'E002');
    assert.deepEqual(descendants.sort(), ['E004', 'E005', 'E006', 'E009']);
  });
});

describe('calculateReportMetrics', () => {
  it('computes direct reports and total descendants', () => {
    const employees = loadFixture('small-org.json');
    const metrics = calculateReportMetrics(employees);
    assert.equal(metrics.get('E002').directReports, 2);
    assert.equal(metrics.get('E002').spanCount, 4);
    assert.equal(metrics.get('E004').directReports, 2);
    assert.equal(metrics.get('E004').spanCount, 2);
  });
});
