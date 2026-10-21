/**
 * Standalone test for the lossless task serializer.
 *   node --experimental-strip-types scripts/test-task-serializer.ts
 */
import assert from 'node:assert/strict';
import { appendTask, removeTask, replaceTask, taskToInput } from '../src/lib/taskSerializer.ts';
import type { WorkOrderTask } from '../src/api/ops/types';

const task = (over: Partial<WorkOrderTask>): WorkOrderTask => ({
  id: 1,
  work_order_id: 9,
  type_of_work: 'Pickup',
  work_type_id: 1,
  expense: 85,
  estimated_duration: '2h',
  start_date: '2026-04-03',
  end_date: '2026-04-04',
  assigned_to: 12,
  status: 'in_progress',
  notes: 'Gate 4',
  sort_order: 0,
  assignees: [
    { id: 12, first_name: 'A', last_name: 'B' },
    { id: 13, first_name: 'C', last_name: 'D' },
  ],
  expenses: [
    { id: 5, description: 'Fuel', amount: '85.00', sort_order: 0, evidence_path: '/uploads/x.jpg', evidence_file_name: 'x.jpg' },
  ],
  ...over,
});

// 1. every stored field survives
const full = taskToInput(task({}));
assert.equal(full.id, 1);
assert.deepEqual(full.assigneeIds, [12, 13]);
assert.equal(full.estimatedDuration, '2h');
assert.equal(full.notes, 'Gate 4');
assert.deepEqual(full.expenses, [
  { description: 'Fuel', amount: '85.00', evidencePath: '/uploads/x.jpg', evidenceFileName: 'x.jpg' },
]);

// 2. legacy single assignee still works when the assignees array is missing
assert.deepEqual(taskToInput(task({ assignees: undefined, assigned_to: 7 })).assigneeIds, [7]);
assert.deepEqual(taskToInput(task({ assignees: [], assigned_to: null })).assigneeIds, []);

// 3. replaceTask touches only the target
const tasks = [task({ id: 1 }), task({ id: 2, notes: 'second', assignees: [], assigned_to: null })];
const out = replaceTask(tasks, 2, { status: 'completed' });
assert.equal(out[0]!.status, 'in_progress');
assert.equal(out[1]!.status, 'completed');
assert.equal(out[1]!.notes, 'second');
assert.deepEqual(out[0]!.expenses, taskToInput(tasks[0]!).expenses);

// 4. remove / append keep ids on the survivors and omit id on the new task
assert.deepEqual(removeTask(tasks, 1).map((t) => t.id), [2]);
const appended = appendTask(tasks, { typeOfWork: 'Delivery' });
assert.deepEqual(appended.map((t) => t.id), [1, 2, undefined]);

console.log('task serializer: all assertions passed');
