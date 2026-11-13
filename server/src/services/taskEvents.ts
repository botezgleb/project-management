import { prisma } from "../utils/prisma";
import { getIO } from "../socket/socket";
import {
  getTasksWithRelations,
  getTasksWithRelationsByIds,
} from "../repositories/task.repository";
import { toTaskDTO } from "./taskDto";

const emit = (projectId: number, event: string, payload: unknown) => {
  try {
    getIO().to(`project-${projectId}`).emit(event, payload);
  } catch (error) {
    console.error(error);
  }
};

// рассылает свежие версии задач + тех, кто от них зависит (у них меняется isBlocked)
export const emitTaskUpdates = async (projectId: number, taskIds: number[]) => {
  const dependents = await prisma.taskDependency.findMany({
    where: { dependsOnId: { in: taskIds } },
    select: { taskId: true },
  });

  const ids = [...new Set([...taskIds, ...dependents.map((d) => d.taskId)])];
  const tasks = await getTasksWithRelationsByIds(ids);

  emit(projectId, "tasks-updated", tasks.map(toTaskDTO));
};

// полностью обновляет список задач колонки у всех клиентов
export const emitColumnTasks = async (projectId: number, columnId: number) => {
  const tasks = await getTasksWithRelations(columnId);
  emit(projectId, "tasks-reordered", { columnId, tasks: tasks.map(toTaskDTO) });
};

export const emitProjectEvent = emit;
