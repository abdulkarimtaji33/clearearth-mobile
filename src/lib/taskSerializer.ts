import type { TaskInput, WorkOrderTask } from '../api/ops/types';

/**
 * PUT /work-orders/:id replaces the whole task list. To edit one task without damaging the rest,
 * every existing task must be sent back with its `id` and every field the server stores, otherwise
 * assignees, expense lines or evidence paths are silently dropped. This is the single place that
 * conversion lives; it has a standalone test in scripts/test-task-serializer.ts.
 */
export function taskToInput(task: WorkOrderTask): TaskInput {
  const assigneeIds =
    task.assignees && task.assignees.length > 0
      ? task.assignees.map((a) => a.id)
      : task.assigned_to != null
        ? [task.assigned_to]
        : [];

  return {
    id: task.id,
    workTypeId: task.work_type_id,
    typeOfWork: task.type_of_work,
    startDate: task.start_date,
    endDate: task.end_date,
    estimatedDuration: task.estimated_duration,
    status: task.status,
    notes: task.notes,
    assigneeIds,
    expenses: (task.expenses ?? []).map((e) => ({
      description: e.description,
      amount: e.amount,
      evidencePath: e.evidence_path,
      evidenceFileName: e.evidence_file_name,
    })),
  };
}

/** Replace one task (matched by id) and re-serialize all the others untouched. */
export function replaceTask(tasks: WorkOrderTask[], taskId: number, patch: Partial<TaskInput>): TaskInput[] {
  return tasks.map((t) => (t.id === taskId ? { ...taskToInput(t), ...patch } : taskToInput(t)));
}

export function removeTask(tasks: WorkOrderTask[], taskId: number): TaskInput[] {
  return tasks.filter((t) => t.id !== taskId).map(taskToInput);
}

export function appendTask(tasks: WorkOrderTask[], input: TaskInput): TaskInput[] {
  return [...tasks.map(taskToInput), input];
}
