import {
  getMaxColumnPosition,
  createColumn,
  getColumns,
  updateColumn,
  deleteColumn,
  reorderColumns,
} from "../repositories/column.repository";
import { getIO } from "../socket/socket";

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
  name: string,
) => {
  const data = { name };

  const updatedColumn = await updateColumn(columnId, projectId, data);

  const io = getIO();

  io.to(`project-${projectId}`).emit("column-updated", updatedColumn);

  return updatedColumn;
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