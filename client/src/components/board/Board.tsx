import React, { useEffect, useState, useCallback } from "react";
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
import ColumnComponent from "./Column";
import "../../css/Board.css";
import { socket } from "../../socket/socket";

interface ColumnWithTasks extends Column {
  tasks: Task[];
}

interface Props {
  projectId: number;
}

export default function Board({ projectId }: Props) {
  const [columns, setColumns] = useState<ColumnWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  const columnSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const loadColumns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getColumnsApi(projectId);
      const columnsData = Array.isArray(res) ? res : res.data || [];

      const columnsWithTasks = await Promise.all(
        columnsData.map(async (col: Column) => {
          try {
            const tasksRes = await getTasksApi(projectId, col.id);
            const tasks = Array.isArray(tasksRes)
              ? tasksRes
              : tasksRes.data || [];
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

      setColumns(columnsWithTasks);
      setError(null);
    } catch (error) {
      console.error(error);
      setError("Не удалось загрузить колонки");
      setColumns([]);
    } finally {
      setLoading(false);
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
      setColumns((prev) =>
        prev.map((col) =>
          col.id === task.columnId
            ? { ...col, tasks: [...col.tasks, task] }
            : col,
        ),
      );
    };

    const handleTaskUpdated = (task: Task) => {
      console.log("SOCKET: task-updated received", task);
      setColumns((prev) =>
        prev.map((col) =>
          col.id === task.columnId
            ? {
                ...col,
                tasks: col.tasks.map((t) => (t.id === task.id ? task : t)),
              }
            : col,
        ),
      );
    };

    const handleTaskDeleted = ({
      columnId,
      taskId,
    }: {
      columnId: number;
      taskId: number;
    }) => {
      console.log("SOCKET: task-deleted received", { columnId, taskId });
      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId
            ? {
                ...col,
                tasks: col.tasks.filter((t) => t.id !== taskId),
              }
            : col,
        ),
      );
    };

    const handleTasksReordered = ({
      columnId,
      tasks,
    }: {
      columnId: number;
      tasks: Task[];
    }) => {
      console.log("SOCKET: tasks-reordered received", { columnId, tasks });
      setColumns((prev) =>
        prev.map((col) => (col.id === columnId ? { ...col, tasks } : col)),
      );
    };

    socket.on("task-created", handleTaskCreated);
    socket.on("task-updated", handleTaskUpdated);
    socket.on("task-deleted", handleTaskDeleted);
    socket.on("tasks-reordered", handleTasksReordered);

    return () => {
      socket.off("task-created", handleTaskCreated);
      socket.off("task-updated", handleTaskUpdated);
      socket.off("task-deleted", handleTaskDeleted);
      socket.off("tasks-reordered", handleTasksReordered);
    };
  }, []);

  useEffect(() => {
    const handleColumnCreated = (column: Column) => {
      console.log("SOCKET: column-created received", column);
      setColumns((prev) => [...prev, { ...column, tasks: [] }]);
    };

    const handleColumnUpdated = (column: Column) => {
      console.log("SOCKET: column-updated received", column);
      setColumns((prev) =>
        prev.map((col) =>
          col.id === column.id ? { ...col, name: column.name } : col,
        ),
      );
    };

    const handleColumnDeleted = (deletedColumn: { id: number }) => {
      console.log("SOCKET: column-deleted received", deletedColumn);
      setColumns((prev) => prev.filter((col) => col.id !== deletedColumn.id));
    };

    const handleColumnsReordered = (reorderedColumns: Column[]) => {
      console.log("SOCKET: columns-reordered received", reorderedColumns);

      if (!reorderedColumns || !Array.isArray(reorderedColumns)) {
        console.error("Invalid reordered columns data:", reorderedColumns);
        return;
      }

      setColumns((prev) => {
        console.log("Previous columns:", prev);

        const tasksMap = new Map(prev.map((col) => [col.id, col.tasks]));

        const updatedColumns: ColumnWithTasks[] = reorderedColumns
          .map((col) => {
            if (!col || typeof col.id === "undefined") {
              console.error("Invalid column in reordered data:", col);
              return null;
            }
            return {
              ...col,
              tasks: tasksMap.get(col.id) || [],
            };
          })
          .filter((col): col is ColumnWithTasks => col !== null);

        console.log("Updated columns:", updatedColumns);
        return updatedColumns;
      });
    };

    socket.on("column-created", handleColumnCreated);
    socket.on("column-updated", handleColumnUpdated);
    socket.on("column-deleted", handleColumnDeleted);
    socket.on("columns-reordered", handleColumnsReordered);

    return () => {
      socket.off("column-created", handleColumnCreated);
      socket.off("column-updated", handleColumnUpdated);
      socket.off("column-deleted", handleColumnDeleted);
      socket.off("columns-reordered", handleColumnsReordered);
    };
  }, []);

  useEffect(() => {
    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected");
    };

    const handleConnectError = (error: Error) => {
      console.error("Socket connection error:", error);
    };

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
    setColumns(newColumns);

    try {
      await reorderColumnsApi(
        projectId,
        newColumns.map((c, idx) => ({ id: c.id, position: idx + 1 })),
      );
    } catch (error) {
      console.error(error);
      setError("Не удалось сохранить порядок колонок");
    }
  };

  const handleTaskDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as number);
  };

  const handleTaskDragEnd = async (
    event: DragEndEvent,
    columnId: number,
    newPosition: number,
  ) => {
    setActiveTaskId(null);
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    try {
      await reorderTaskApi(
        projectId,
        columnId,
        active.id as number,
        newPosition,
      );
    } catch (error) {
      console.error(error);
      setError("Не удалось сохранить порядок задач");
    }
  };

  const handleTaskOrderChange = (columnId: number, updatedTasks: Task[]) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, tasks: updatedTasks } : col,
      ),
    );
  };

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) return;

    try {
      const newColumn = await createColumnApi(projectId, newColumnName.trim());
      setColumns([...columns, { ...newColumn, tasks: [] }]);
      setNewColumnName("");
      setAdding(false);
      setError(null);
    } catch (error) {
      console.error(error);
      setError("Не удалось создать колонку");
    }
  };

  const handleDeleteColumn = async (columnId: number) => {
    try {
      setError(null);
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
      await deleteColumnApi(projectId, columnId);
    } catch (error) {
      console.error(error);
      setError("Не удалось удалить колонку");
      await loadColumns();
    }
  };

  const handleUpdateColumn = async (columnId: number, newName: string) => {
    try {
      setError(null);
      await updateColumnApi(projectId, columnId, newName);
      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId ? { ...col, name: newName } : col,
        ),
      );
    } catch (error) {
      console.error(error);
      setError("Не удалось обновить колонку");
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
    setAdding(true);
  };

  const handleCancelAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    setAdding(false);
    setNewColumnName("");
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
          <button onClick={() => setError(null)}>Закрыть</button>
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
                  onChange={(e) => setNewColumnName(e.target.value)}
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
}
