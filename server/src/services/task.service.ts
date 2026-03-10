import {
  createTask,
  deleteTask,
  getMaxTaskPosition,
  getOneTask,
  getTasks,
  updateTask,
  updateTaskPosition,
  updateTasksPositionRange,
} from "../repositories/task.repository";
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

  const task = await createTask(data);

  const column = await prisma.column.findUnique({
    where: { id: columnId },
    select: { projectId: true },
  });

  const io = getIO();
  io.to(`project-${column?.projectId}`).emit("task-created", task);

  return task;
};

export const getTasksService = async (columnId: number) => {
  if (!columnId) {
    throw new Error("Нет колонки задачи");
  }

  return await getTasks(columnId);
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

  const updatedTask = await updateTask(taskId, data);

  const column = await prisma.column.findUnique({
    where: { id: columnId },
    select: { projectId: true },
  });

  const io = getIO();

  io.to(`project-${column?.projectId}`).emit("task-updated", updatedTask);

  return updatedTask;
};

export const deleteTaskService = async (columnId: number, taskId: number) => {
  if (!columnId) {
    throw new Error("Нет колонки задачи");
  }

  if (!taskId) {
    throw new Error("Задача не найдена");
  }

  await deleteTask(columnId, taskId);

  const column = await prisma.column.findUnique({
    where: { id: columnId },
    select: { projectId: true },
  });

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

    const allUpdatedTasks = await tx.task.findMany({
      where: { columnId },
      orderBy: { position: "asc" },
    });

    const column = await prisma.column.findUnique({
      where: { id: columnId },
      select: { projectId: true },
    });

    const io = getIO();

    io.to(`project-${column?.projectId}`).emit("tasks-reordered", {
      columnId,
      tasks: allUpdatedTasks,
    });

    return { success: true, tasks: allUpdatedTasks };
  });
};
