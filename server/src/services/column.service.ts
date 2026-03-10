import {
  getMaxColumnPosition,
  createColumn,
  getColumns,
  updateColumn,
  deleteColumn,
  reorderColumns,
} from "../repositories/column.repository";

export const createColumnService = async (projectId: number, name: string) => {
  const maxPosition = await getMaxColumnPosition(projectId);

  const data = {
    name,
    projectId,
    position: maxPosition + 1,
  };

  const newColumn = await createColumn(data);

  return newColumn;
};

export const getColumnsService = async (projectId: number) => {
  return await getColumns(projectId);
};

export const updateColumnService = async (
  projectId: number,
  columnId: number,
  name: string,
) => {
  const data = { name };

  return await updateColumn(columnId, projectId, data);
};

export const deleteColumnService = async (
  projectId: number,
  columnId: number,
) => {
  const deletedColumn = await deleteColumn(columnId, projectId);

  return deletedColumn;
};

export const reorderColumnsService = async (
  projectId: number,
  columns: { id: number; position: number }[],
) => {
  if (!columns.length) {
    throw new Error("Пустой список колонок");
  }

  return await reorderColumns(projectId, columns);
};
