import test from 'node:test';
import assert from 'node:assert';
import { buildOrgTree } from '../client/src/lib/buildOrgTree.js';
import { layoutOrgChart } from '../client/src/lib/layoutOrgChart.js';

test('layoutOrgChart assigns absolute positions for nested org nodes', async () => {
  const employees = [
    { id: 'E001', name: 'Alex Morgan', managerId: null, title: 'CEO', department: 'Executive' },
    { id: 'E002', name: 'Blake Chen', managerId: 'E001', title: 'VP Engineering', department: 'Engineering' },
    { id: 'E003', name: 'Casey Rivera', managerId: 'E002', title: 'Engineering Manager', department: 'Engineering' },
    { id: 'E004', name: 'Dana Patel', managerId: 'E003', title: 'Senior Engineer', department: 'Engineering' },
    { id: 'E005', name: 'Elliot Brooks', managerId: 'E001', title: 'VP People', department: 'People' },
  ];

  const roots = buildOrgTree(employees);
  const layout = await layoutOrgChart(roots);

  assert.equal(layout.nodes.length, 5);

  const positions = new Map(layout.nodes.map((node) => [node.id, node.position]));
  const positionE004 = positions.get('E004');
  const positionE003 = positions.get('E003');
  const positionE002 = positions.get('E002');
  const positionE001 = positions.get('E001');
  const positionE005 = positions.get('E005');

  assert(positionE004, 'E004 should have a position');
  assert(positionE003, 'E003 should have a position');
  assert(positionE002, 'E002 should have a position');
  assert(positionE001, 'E001 should have a position');
  assert(positionE005, 'E005 should have a position');

  assert(positionE002.y > positionE001.y, 'A direct child should be below the root');
  assert(positionE005.y > positionE001.y, 'A direct child should be below the root');
  assert(positionE003.y > positionE002.y, 'A nested child should be below its parent');
  assert(positionE004.y > positionE003.y, 'A deeper nested child should be below its parent');
  assert(positionE004.x !== positionE003.x || positionE004.y !== positionE003.y, 'A descendant should not share the same position as its parent');
});
