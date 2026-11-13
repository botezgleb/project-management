import {
  getMaxColumnPosition,
  createColumn,
  getColumns,
  updateColumn,
  deleteColumn,
  reorderColumns,
} from "../repositories/column.repository";
import { getIO, notifyUser } from "../socket/socket";
import { prisma } from "../utils/prisma";
import { emitColumnTasks, emitTaskUpdates } from "./taskEvents";
import { assertProjectMember, getProjectBrief, toPositiveInt } from "./projectGuards";

export const createColumnService = async (projectId: number, name: string) => {
  const maxPosition = await getMaxColumnPosition(projectId);

  const data = {
    name,
    projectId,
    position: maxPosition + 1,
  };

  const newColumn = await createColumn(data);
  
  const io = getIO();

  io.to(`project-${projectId}`).emit("column-created", newColumn);

  return newColumn;
};

export const getColumnsService = async (projectId: number) => {
  return await getColumns(projectId);
};

export const updateColumnService = async (
  projectId: number,
  columnId: number,
  input: { name?: unknown; isDone?: unknown; responsibleId?: unknown },
  actorId?: number,
) => {
  const data: { name?: string; isDone?: boolean; responsibleId?: number | null } = {};

  if (input.name !== undefined) {
    const name = String(input.name).trim();
    if (!name) throw new Error("Введите название колонки");
    data.name = name;
  }

  if (input.isDone !== undefined) {
    data.isDone = Boolean(input.isDone);
  }

  if (input.responsibleId !== undefined) {
    if (input.responsibleId === null) {
      data.responsibleId = null;
    } else {
      const responsibleId = toPositiveInt(input.responsibleId, "ID ответственного");
      await assertProjectMember(projectId, responsibleId);
      data.responsibleId = responsibleId;
    }
  }

  if (Object.keys(data).length === 0) {
    throw new Error("Нет данных для обновления");
  }

  const updatedColumn = await updateColumn(columnId, projectId, data);

  // колонку сделали финальной — всё, что в ней лежит, считается выполненным
  if (data.isDone === true) {
    await prisma.task.updateMany({
      where: { columnId, completed: false },
      data: { completed: true, completedAt: new Date() },
    });
  }

  const io = getIO();
  io.to(`project-${projectId}`).emit("column-updated", updatedColumn);

  if (data.isDone !== undefined) {
    await emitColumnTasks(projectId, columnId);
    // у задач, зависящих от задач этой колонки, мог поменяться isBlocked
    const tasks = await prisma.task.findMany({ where: { columnId }, select: { id: true } });
    if (tasks.length) await emitTaskUpdates(projectId, tasks.map((t) => t.id));
  }

  if (data.responsibleId && data.responsibleId !== actorId) {
    notifyUser(data.responsibleId, "column:responsible", {
      column: { id: updatedColumn.id, name: updatedColumn.name },
      project: await getProjectBrief(projectId),
    });
  }

  return updatedColumn;
};

// назначает все задачи колонки на человека (по умолчанию — на ответственного)
export const assignAllColumnTasksService = async (
  projectId: number,
  columnId: number,
  rawUserId: unknown,
  actorId: number,
) => {
  const column = await prisma.column.findFirst({
    where: { id: columnId, projectId },
    select: { responsibleId: true, name: true },
  });
  if (!column) throw new Error("Колонка не найдена");

  const userId =
    rawUserId !== undefined && rawUserId !== null
      ? toPositiveInt(rawUserId, "ID пользователя")
      : column.responsibleId;

  if (!userId) {
    throw new Error("У колонки нет ответственного — выберите, на кого назначить");
  }

  await assertProjectMember(projectId, userId);

  const tasks = await prisma.task.findMany({ where: { columnId }, select: { id: true } });

  const result = await prisma.taskAssignee.createMany({
    data: tasks.map((t) => ({ taskId: t.id, userId })),
    skipDuplicates: true,
  });

  await emitColumnTasks(projectId, columnId);

  if (result.count > 0 && userId !== actorId) {
    notifyUser(userId, "tasks:assigned-bulk", {
      count: result.count,
      column: { id: columnId, name: column.name },
      project: await getProjectBrief(projectId),
    });
  }

  return { assigned: result.count, total: tasks.length };
};

export const deleteColumnService = async (
  projectId: number,
  columnId: number,
) => {
  const deletedColumn = await deleteColumn(columnId, projectId);

  const io = getIO();

  io.to(`project-${projectId}`).emit("column-deleted", deletedColumn);

  return deletedColumn;
};

export const reorderColumnsService = async (
  projectId: number,
  columns: { id: number; position: number }[],
) => {
  if (!columns.length) {
    throw new Error("Пустой список колонок");
  }

  console.log("Reorder columns service - input:", { projectId, columns });

  const reorderedColumns = await reorderColumns(projectId, columns);
  
  console.log("Reorder columns service - result:", reorderedColumns);

  const io = getIO();
  io.to(`project-${projectId}`).emit("columns-reordered", reorderedColumns);

  return reorderedColumns;
};