import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { validateHierarchy, wouldCreateCycle } from '../client/src/lib/validateHierarchy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadFixture(name) {
  const file = path.join(__dirname, '..', 'fixtures', name);
  return JSON.parse(readFileSync(file, 'utf8'));
}

describe('validateHierarchy', () => {
  it('passes for a valid small org', () => {
    const employees = loadFixture('small-org.json');
    const { errors, warnings } = validateHierarchy(employees);
    assert.equal(errors.length, 0);
  });

  it('warns for multiple roots', () => {
    const employees = loadFixture('multi-root.json');
    const { errors, warnings } = validateHierarchy(employees);
    assert.equal(errors.length, 0);
    assert.ok(warnings.some((w) => w.toLowerCase().includes('multiple')));
  });

  it('detects cycles, unknown managers, and self-managers', () => {
    const employees = loadFixture('bad-data.json');
    const { errors, warnings } = validateHierarchy(employees);
    assert.ok(errors.some((e) => e.includes('Cycle')));
    assert.ok(errors.some((e) => e.includes('unknown manager')));
    assert.ok(errors.some((e) => e.includes('own manager')));
    assert.ok(warnings.some((w) => w.includes('empty title')));
  });

  it('detects duplicate IDs', () => {
    const employees = [
      { id: '1', name: 'A', managerId: null, title: 'CEO', department: 'Exec' },
      { id: '1', name: 'B', managerId: null, title: 'CEO', department: 'Exec' },
    ];
    const { errors } = validateHierarchy(employees);
    assert.ok(errors.some((e) => e.includes('Duplicate')));
  });
});

describe('wouldCreateCycle', () => {
  it('returns true when reparenting under a descendant', () => {
    const employees = loadFixture('small-org.json');
    assert.equal(wouldCreateCycle(employees, 'E002', 'E005'), true);
  });

  it('returns false for a valid reparent', () => {
    const employees = loadFixture('small-org.json');
    assert.equal(wouldCreateCycle(employees, 'E005', 'E002'), false);
  });
});
