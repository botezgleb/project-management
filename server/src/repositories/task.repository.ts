import { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { taskInclude } from "../services/taskDto";

export const createTask = async (data: {
  title: string;
  description: string;
  columnId: number;
  position: number;
  createdById: number;
}) => {
  return await prisma.task.create({
    data,
  });
};

export const getTasks = async (columnId: number) => {
  return await prisma.task.findMany({
    where: { columnId },
    orderBy: { position: "asc" },
  });
};

export const getTasksWithRelations = async (columnId: number) => {
  return await prisma.task.findMany({
    where: { columnId },
    orderBy: { position: "asc" },
    include: taskInclude,
  });
};

export const getTaskWithRelations = async (taskId: number) => {
  return await prisma.task.findUnique({
    where: { id: taskId },
    include: taskInclude,
  });
};

export const getTasksWithRelationsByIds = async (taskIds: number[]) => {
  if (taskIds.length === 0) return [];
  return await prisma.task.findMany({
    where: { id: { in: taskIds } },
    include: taskInclude,
  });
};

export const getOneTask = async (columnId: number, taskId: number) => {
  return await prisma.task.findFirst({
    where: {
      id: taskId,
      columnId,
    },
  });
};

export const updateTask = async (
  taskId: number,
  data: {
    title: string;
    description: string;
  },
) => {
  return await prisma.task.update({
    where: {
      id: taskId,
    },
    data,
  });
};

export const deleteTask = async (columnId: number, taskId: number) => {
  return await prisma.task.delete({
    where: {
      id: taskId,
      columnId,
    },
  });
};

export const getMaxTaskPosition = async (columnId: number) => {
  const result = await prisma.task.aggregate({
    where: { columnId },
    _max: { position: true },
  });

  return result._max.position ?? 0;
};

export const updateTaskPosition = async (
  tx: Prisma.TransactionClient,
  taskId: number,
  newPosition: number,
) => {
  return await tx.task.update({
    where: { id: taskId },
    data: { position: newPosition },
  });
};

export const updateTasksPositionRange = async (
  tx: Prisma.TransactionClient,
  columnId: number,
  startPos: number,
  endPos: number,
  increment: number,
) => {
  return await tx.task.updateMany({
    where: { 
      columnId,
      position: {
        gte: startPos,
        lte: endPos
      }
    },
    data: {
      position: {
        increment: increment
      }
    }
  });
};