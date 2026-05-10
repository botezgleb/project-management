import { prisma } from "../utils/prisma";

export const getMaxColumnPosition = async (projectId: number) => {
  const result = await prisma.column.aggregate({
    where: { projectId },
    _max: { position: true },
  });

  return result._max.position ?? 0;
};

export const createColumn = async (data: {
  name: string;
  projectId: number;
  position: number;
}) => {
  const newColumn = await prisma.column.create({
    data,
  });

  return newColumn;
};

export const getColumns = async (projectId: number) => {
  const columns = await prisma.column.findMany({
    where: { projectId },
    orderBy: { position: "asc" },
  });

  return columns;
};

export const updateColumn = async (
  columnId: number,
  projectId: number,
  data: { name: string },
) => {
  const updatedColumn = await prisma.column.update({
    where: {
      id: columnId,
      projectId: projectId,
    },
    data,
  });

  return updatedColumn;
};

export const deleteColumn = async (columnId: number, projectId: number) => {
  const columnToDelete = await prisma.column.findFirst({
    where: {
      id: columnId,
      projectId: projectId,
    },
    select: { position: true },
  });

  if (!columnToDelete) {
    throw new Error("Колонка не найдена");
  }

  const [deletedColumn] = await prisma.$transaction([
    prisma.column.delete({
      where: {
        id: columnId,
        projectId: projectId,
      },
    }),
    prisma.column.updateMany({
      where: {
        projectId: projectId,
        position: {
          gt: columnToDelete.position,
        },
      },
      data: {
        position: {
          decrement: 1,
        },
      },
    }),
  ]);

  return deletedColumn;
};

export const reorderColumns = async (
  projectId: number,
  columns: { id: number; position: number }[],
) => {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.column.findMany({
      where: {
        projectId,
        id: { in: columns.map((c) => c.id) },
      },
      select: { id: true },
    });

    if (existing.length !== columns.length) {
      throw new Error("Некоторые колонки не принадлежат проекту");
    }

    await tx.column.updateMany({
      where: { projectId },
      data: {
        position: {
          increment: 1000,
        },
      },
    });

    for (const column of columns) {
      await tx.column.update({
        where: { id: column.id },
        data: { position: column.position },
      });
    }

    const updatedColumns = await tx.column.findMany({
      where: { projectId },
      orderBy: { position: "asc" },
    });

    return updatedColumns;
  });
};
