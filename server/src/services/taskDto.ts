import { Prisma } from "@prisma/client";

const publicUser = { id: true, name: true, username: true } as const;

// всё, что нужно карточке на доске
export const taskInclude = {
  taskAssignees: {
    select: { user: { select: publicUser } },
    orderBy: { createdAt: "asc" },
  },
  subtasks: { select: { completed: true } },
  blockedBy: {
    select: { dependsOn: { select: { id: true, title: true, completed: true } } },
  },
} satisfies Prisma.TaskInclude;

export type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

export const toTaskDTO = (task: TaskWithRelations) => ({
  id: task.id,
  title: task.title,
  description: task.description,
  columnId: task.columnId,
  position: task.position,
  createdById: task.createdById,
  createdAt: task.createdAt,
  completed: task.completed,
  completedAt: task.completedAt,
  assignees: task.taskAssignees.map((a) => a.user),
  subtasksTotal: task.subtasks.length,
  subtasksDone: task.subtasks.filter((s) => s.completed).length,
  blockedBy: task.blockedBy.map((d) => d.dependsOn),
  isBlocked: task.blockedBy.some((d) => !d.dependsOn.completed),
});

export type TaskDTO = ReturnType<typeof toTaskDTO>;
