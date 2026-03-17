import React, { useEffect, useCallback, useReducer } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

import {
  getColumnsApi,
  reorderColumnsApi,
  createColumnApi,
  deleteColumnApi,
  updateColumnApi,
} from "../../services/api/columns.api";
import {
  deleteTaskApi,
  getTasksApi,
  updateTaskApi,
  reorderTaskApi,
} from "../../services/api/tasks.api";
import type { Column } from "../../types/column";
import type { Task } from "../../types/task";
import { boardReducer, initialState } from "./boardReducer";
import ColumnComponent from "./Column";
import "../../css/Board.css";
import { socket } from "../../socket/socket";

interface Props {
  projectId: number;
}

export const Board = ({ projectId }: Props) => {
  const [state, dispatch] = useReducer(boardReducer, initialState);
  const { columns, loading, error, adding, newColumnName, activeTaskId } = state;

  const columnSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const loadColumns = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const res = await getColumnsApi(projectId);
      const columnsData = Array.isArray(res) ? res : res.data || [];

      const columnsWithTasks = await Promise.all(
        columnsData.map(async (col: Column) => {
          try {
            const tasksRes = await getTasksApi(projectId, col.id);
            const tasks = Array.isArray(tasksRes) ? tasksRes : tasksRes.data || [];
            return {
              ...col,
              tasks: tasks.sort((a: Task, b: Task) => a.position - b.position),
            };
          } catch (error) {
            console.error(`Failed to load tasks for column ${col.id}:`, error);
            return { ...col, tasks: [] };
          }
        }),
      );

      dispatch({ type: "SET_COLUMNS", payload: columnsWithTasks });
      dispatch({ type: "SET_ERROR", payload: null });
    } catch (error) {
      console.error(error);
      dispatch({ type: "SET_ERROR", payload: "Не удалось загрузить колонки" });
      dispatch({ type: "SET_COLUMNS", payload: [] });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [projectId]);

  useEffect(() => {
    loadColumns();
  }, [loadColumns]);

  useEffect(() => {
    socket.emit("join-project", projectId);
    return () => {
      socket.emit("leave-project", projectId);
    };
  }, [projectId]);

  useEffect(() => {
    const handleTaskCreated = (task: Task) => {
      console.log("SOCKET: task-created received", task);
      dispatch({ type: "ADD_TASK", payload: { columnId: task.columnId, task } });
    };

    const handleTaskUpdated = (task: Task) => {
      console.log("SOCKET: task-updated received", task);
      dispatch({ type: "UPDATE_TASK", payload: { columnId: task.columnId, task } });
    };

    const handleTaskDeleted = ({ columnId, taskId }: { columnId: number; taskId: number }) => {
      console.log("SOCKET: task-deleted received", { columnId, taskId });
      dispatch({ type: "DELETE_TASK", payload: { columnId, taskId } });
    };

    const handleTasksReordered = ({ columnId, tasks }: { columnId: number; tasks: Task[] }) => {
      console.log("SOCKET: tasks-reordered received", { columnId, tasks });
      dispatch({ type: "REORDER_TASKS", payload: { columnId, tasks } });
    };

    const handleColumnCreated = (column: Column) => {
      console.log("SOCKET: column-created received", column);
      dispatch({ type: "ADD_COLUMN", payload: column });
    };

    const handleColumnUpdated = (column: Column) => {
      console.log("SOCKET: column-updated received", column);
      dispatch({ type: "UPDATE_COLUMN", payload: { id: column.id, name: column.name } });
    };

    const handleColumnDeleted = (deletedColumn: { id: number }) => {
      console.log("SOCKET: column-deleted received", deletedColumn);
      dispatch({ type: "DELETE_COLUMN", payload: deletedColumn.id });
    };

    const handleColumnsReordered = (reorderedColumns: Column[]) => {
      console.log("SOCKET: columns-reordered received", reorderedColumns);
      if (!reorderedColumns || !Array.isArray(reorderedColumns)) {
        console.error("Invalid reordered columns data:", reorderedColumns);
        return;
      }
      dispatch({ type: "REORDER_COLUMNS", payload: reorderedColumns });
    };

    socket.on("task-created", handleTaskCreated);
    socket.on("task-updated", handleTaskUpdated);
    socket.on("task-deleted", handleTaskDeleted);
    socket.on("tasks-reordered", handleTasksReordered);
    socket.on("column-created", handleColumnCreated);
    socket.on("column-updated", handleColumnUpdated);
    socket.on("column-deleted", handleColumnDeleted);
    socket.on("columns-reordered", handleColumnsReordered);

    return () => {
      socket.off("task-created", handleTaskCreated);
      socket.off("task-updated", handleTaskUpdated);
      socket.off("task-deleted", handleTaskDeleted);
      socket.off("tasks-reordered", handleTasksReordered);
      socket.off("column-created", handleColumnCreated);
      socket.off("column-updated", handleColumnUpdated);
      socket.off("column-deleted", handleColumnDeleted);
      socket.off("columns-reordered", handleColumnsReordered);
    };
  }, []);

  useEffect(() => {
    const handleConnect = () => console.log("Socket connected:", socket.id);
    const handleDisconnect = () => console.log("Socket disconnected");
    const handleConnectError = (error: Error) => console.error("Socket connection error:", error);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, []);

  const handleColumnDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = columns.findIndex((c) => c.id === active.id);
    const newIndex = columns.findIndex((c) => c.id === over.id);
    const newColumns = arrayMove(columns, oldIndex, newIndex);
    
    dispatch({ type: "SET_COLUMNS", payload: newColumns });

    try {
      await reorderColumnsApi(
        projectId,
        newColumns.map((c, idx) => ({ id: c.id, position: idx + 1 })),
      );
    } catch (error) {
      console.error(error);
      dispatch({ type: "SET_ERROR", payload: "Не удалось сохранить порядок колонок" });
    }
  };

  const handleTaskDragStart = (event: DragStartEvent) => {
    dispatch({ type: "SET_ACTIVE_TASK", payload: event.active.id as number });
  };

  const handleTaskDragEnd = async (
    event: DragEndEvent,
    columnId: number,
    newPosition: number,
  ) => {
    dispatch({ type: "SET_ACTIVE_TASK", payload: null });
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    try {
      await reorderTaskApi(projectId, columnId, active.id as number, newPosition);
    } catch (error) {
      console.error(error);
      dispatch({ type: "SET_ERROR", payload: "Не удалось сохранить порядок задач" });
    }
  };

  const handleTaskOrderChange = (columnId: number, updatedTasks: Task[]) => {
    dispatch({ type: "REORDER_TASKS", payload: { columnId, tasks: updatedTasks } });
  };

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) return;

    try {
      const newColumn = await createColumnApi(projectId, newColumnName.trim());
      dispatch({ type: "ADD_COLUMN", payload: newColumn });
      dispatch({ type: "SET_NEW_COLUMN_NAME", payload: "" });
      dispatch({ type: "SET_ADDING", payload: false });
      dispatch({ type: "SET_ERROR", payload: null });
    } catch (error) {
      console.error(error);
      dispatch({ type: "SET_ERROR", payload: "Не удалось создать колонку" });
    }
  };

  const handleDeleteColumn = async (columnId: number) => {
    try {
      dispatch({ type: "SET_ERROR", payload: null });
      dispatch({ type: "DELETE_COLUMN", payload: columnId });
      await deleteColumnApi(projectId, columnId);
    } catch (error) {
      console.error(error);
      dispatch({ type: "SET_ERROR", payload: "Не удалось удалить колонку" });
      await loadColumns();
    }
  };

  const handleUpdateColumn = async (columnId: number, newName: string) => {
    try {
      dispatch({ type: "SET_ERROR", payload: null });
      await updateColumnApi(projectId, columnId, newName);
      dispatch({ type: "UPDATE_COLUMN", payload: { id: columnId, name: newName } });
    } catch (error) {
      console.error(error);
      dispatch({ type: "SET_ERROR", payload: "Не удалось обновить колонку" });
      throw error;
    }
  };

  const handleTaskDelete = async (columnId: number, taskId: number) => {
    await deleteTaskApi(projectId, columnId, taskId);
  };

  const handleTaskUpdate = async (
    columnId: number,
    taskId: number,
    title: string,
    description: string,
  ) => {
    await updateTaskApi(title, description, projectId, columnId, taskId);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch({ type: "SET_ADDING", payload: true });
  };

  const handleCancelAdd = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    dispatch({ type: "SET_ADDING", payload: false });
    dispatch({ type: "SET_NEW_COLUMN_NAME", payload: "" });
  };

  if (loading) {
    return (
      <div className="board-loading">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="board">
      <div className="board-header">
        <h2>
          Project <span>Board</span>
        </h2>
      </div>

      {error && (
        <div className="board-error">
          <p>{error}</p>
          <button onClick={() => dispatch({ type: "SET_ERROR", payload: null })}>
            Закрыть
          </button>
        </div>
      )}

      <DndContext
        sensors={columnSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleColumnDragEnd}
      >
        <SortableContext
          items={columns.map((c) => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="board-columns">
            {columns.map((column) => (
              <ColumnComponent
                key={column.id}
                column={column}
                projectId={projectId}
                onDelete={handleDeleteColumn}
                onUpdate={handleUpdateColumn}
                onTaskDelete={handleTaskDelete}
                onTaskUpdate={handleTaskUpdate}
                onTaskDragEnd={handleTaskDragEnd}
                onTaskOrderChange={handleTaskOrderChange}
                activeTaskId={activeTaskId}
                onTaskDragStart={handleTaskDragStart}
              />
            ))}

            {adding ? (
              <div className="add-column-form">
                <input
                  type="text"
                  value={newColumnName}
                  onChange={(e) => 
                    dispatch({ type: "SET_NEW_COLUMN_NAME", payload: e.target.value })
                  }
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === "Enter") handleAddColumn();
                    if (e.key === "Escape") handleCancelAdd(e);
                  }}
                  placeholder="Название колонки"
                  autoFocus
                />
                <div className="add-column-actions">
                  <button onClick={handleAddColumn} type="button">
                    Добавить
                  </button>
                  <button onClick={handleCancelAdd} type="button">
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="add-column-btn"
                onClick={handleAddClick}
                type="button"
              >
                <span>+</span> Добавить колонку
              </button>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};