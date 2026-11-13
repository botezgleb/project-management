import {
  createTask,
  deleteTask,
  getMaxTaskPosition,
  getOneTask,
  getTasks,
  updateTask,
  updateTaskPosition,
  updateTasksPositionRange,
  getTasksWithRelations,
  getTaskWithRelations,
} from "../repositories/task.repository";
import { toTaskDTO } from "./taskDto";
import { emitColumnTasks, emitTaskUpdates } from "./taskEvents";
import { notifyUser } from "../socket/socket";
import { prisma } from "../utils/prisma";
import { getIO } from "../socket/socket";

export const createTaskService = async (
  title: string,
  description: string,
  columnId: number,
  createdById: number,
) => {
  const maxPosition = await getMaxTaskPosition(columnId);

  const data = {
    title,
    description,
    columnId,
    position: maxPosition + 1,
    createdById,
  };

  if (!title) {
    throw new Error("Пустой заголовок задачи");
  }

  if (title.length > 50) {
    throw new Error("Слишком длинный заголовок");
  }

  const column = await prisma.column.findUnique({
    where: { id: columnId },
    select: {
      projectId: true,
      isDone: true,
      responsibleId: true,
      project: { select: { id: true, name: true } },
    },
  });

  if (!column) {
    throw new Error("Колонка не найдена");
  }

  const created = await prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        ...data,
        // в финальной колонке задача сразу считается выполненной
        completed: column.isDone,
        completedAt: column.isDone ? new Date() : null,
      },
    });

    // новые задачи колонки достаются её ответственному
    if (column.responsibleId) {
      await tx.taskAssignee.create({
        data: { taskId: task.id, userId: column.responsibleId },
      });
    }

    return task;
  });

  const task = toTaskDTO((await getTaskWithRelations(created.id))!);

  const io = getIO();
  io.to(`project-${column.projectId}`).emit("task-created", task);

  if (column.responsibleId && column.responsibleId !== createdById) {
    notifyUser(column.responsibleId, "task:assigned", {
      task: { id: task.id, title: task.title },
      project: column.project,
    });
  }

  return task;
};

export const getTasksService = async (columnId: number) => {
  if (!columnId) {
    throw new Error("Нет колонки задачи");
  }

  const tasks = await getTasksWithRelations(columnId);
  return tasks.map(toTaskDTO);
};

export const updateTaskService = async (
  columnId: number,
  taskId: number,
  title: string,
  description: string,
) => {
  if (!columnId) {
    throw new Error("Нет колонки задачи");
  }

  if (!taskId) {
    throw new Error("Задача не найдена");
  }

  if (!title && !description) {
    throw new Error("Нет данных для обновления");
  }

  if (title && title.length > 50) {
    throw new Error("Слишком длинный заголовок");
  }

  const data = {
    title,
    description,
  };

  const task = await getOneTask(columnId, taskId);

  if (!task) {
    throw new Error("Задача не найдена");
  }

  await updateTask(taskId, data);

  const column = await prisma.column.findUnique({
    where: { id: columnId },
    select: { projectId: true },
  });

  // название могло измениться — обновляем и зависимые задачи (у них список блокеров)
  if (column) await emitTaskUpdates(column.projectId, [taskId]);

  return toTaskDTO((await getTaskWithRelations(taskId))!);
};

export const deleteTaskService = async (columnId: number, taskId: number) => {
  if (!columnId) {
    throw new Error("Нет колонки задачи");
  }

  if (!taskId) {
    throw new Error("Задача не найдена");
  }

  // задачи, которые ждали удаляемую, — у них изменится список блокеров
  const dependents = await prisma.taskDependency.findMany({
    where: { dependsOnId: taskId },
    select: { taskId: true },
  });

  await deleteTask(columnId, taskId);

  const column = await prisma.column.findUnique({
    where: { id: columnId },
    select: { projectId: true },
  });

  if (column && dependents.length > 0) {
    await emitTaskUpdates(
      column.projectId,
      dependents.map((d) => d.taskId),
    );
  }

  const io = getIO();

  io.to(`project-${column?.projectId}`).emit("task-deleted", {
    columnId,
    taskId,
  });

  return { success: true };
};

export const reorderTaskService = async (
  columnId: number,
  taskId: number,
  newPosition: number,
) => {
  const task = await getOneTask(columnId, taskId);

  if (!task) {
    throw new Error("Задача не найдена");
  }

  if (task.position === newPosition) {
    return { success: true };
  }

  const allTasks = await getTasks(columnId);

  const maxPosition = allTasks.length;

  if (newPosition < 1 || newPosition > maxPosition) {
    throw new Error("Некорректная позиция");
  }

  return await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: taskId },
      data: { position: 999999 },
    });

    if (task.position < newPosition) {
      for (let pos = task.position + 1; pos <= newPosition; pos++) {
        const taskToMove = allTasks.find((t) => t.position === pos);
        if (taskToMove) {
          await tx.task.update({
            where: { id: taskToMove.id },
            data: { position: pos - 1 },
          });
        }
      }
    } else {
      for (let pos = task.position - 1; pos >= newPosition; pos--) {
        const taskToMove = allTasks.find((t) => t.position === pos);
        if (taskToMove) {
          await tx.task.update({
            where: { id: taskToMove.id },
            data: { position: pos + 1 },
          });
        }
      }
    }

    await tx.task.update({
      where: { id: taskId },
      data: { position: newPosition },
    });

    return { success: true };
  }).then(async (result) => {
    const column = await prisma.column.findUnique({
      where: { id: columnId },
      select: { projectId: true },
    });
    if (column) await emitColumnTasks(column.projectId, columnId);
    return result;
  });
};
