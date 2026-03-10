import React, { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";

import { getTasksApi, createTaskApi } from "../../services/api/tasks.api";
import type { Column as ColumnType } from "../../types/column";
import type { Task as TaskType } from "../../types/task";
import TaskCard from "./TaskCard";
import "../../css/Column.css";

interface Props {
  column: ColumnType;
  projectId: number;
  onDelete: (columnId: number) => Promise<void>;
  onUpdate: (columnId: number, newName: string) => Promise<void>;
  onTaskDelete: (columnId: number, taskId: number) => Promise<void>;
  onTaskUpdate: (
    columnId: number,
    taskId: number,
    title: string,
    description: string,
  ) => Promise<void>;
  onTaskDragEnd: (
    event: DragEndEvent,
    columnId: number,
    newPosition: number,
  ) => void;
  onTaskOrderChange: (columnId: number, tasks: TaskType[]) => void;
  activeTaskId: number | null;
  onTaskDragStart: (event: DragStartEvent) => void;
}

export default function ColumnComponent({
  column,
  projectId,
  onDelete,
  onUpdate,
  onTaskDelete,
  onTaskUpdate,
  onTaskDragEnd,
  onTaskOrderChange,
  activeTaskId,
  onTaskDragStart,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [taskError, setTaskError] = useState<string | null>(null);

  const taskSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    disabled: isEditing || adding,
    data: {
      type: "column",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    loadTasks();
  }, [column.id]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await getTasksApi(projectId, column.id);
      const tasksData = Array.isArray(response)
        ? response
        : response.data || [];
      setTasks(
        tasksData.sort((a: TaskType, b: TaskType) => a.position - b.position),
      );
    } catch (error) {
      console.error(error);
      setTaskError("Не удалось загрузить задачи");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      const response = await createTaskApi(
        newTaskTitle.trim(),
        newTaskDescription.trim(),
        column.id,
        projectId,
      );
      const newTask = response.data || response;
      const updatedTasks = [...tasks, { ...newTask, position: tasks.length + 1 }];
      setTasks(updatedTasks);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setAdding(false);
      setTaskError(null);
    } catch (error) {
      console.error(error);
      setTaskError("Не удалось создать задачу");
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await onTaskDelete(column.id, taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error(error);
      setTaskError("Не удалось удалить задачу");
    }
  };

  const handleUpdateTask = async (
    taskId: number,
    title: string,
    description: string,
  ) => {
    try {
      await onTaskUpdate(column.id, taskId, title, description);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, title, description } : t)),
      );
    } catch (error) {
      console.error(error);
      setTaskError("Не удалось обновить задачу");
    }
  };

  const handleTaskDragEndLocal = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);

    const newTasks = arrayMove(tasks, oldIndex, newIndex);
    
    const tasksWithNewPositions = newTasks.map((task, index) => ({
      ...task,
      position: index + 1
    }));
    
    setTasks(tasksWithNewPositions);
    onTaskOrderChange(column.id, tasksWithNewPositions);

    const movedTask = tasksWithNewPositions[newIndex];
    onTaskDragEnd(event, column.id, movedTask.position);
  };

  const handleUpdateColumn = async () => {
    if (!editName.trim() || editName === column.name) {
      setIsEditing(false);
      setEditName(column.name);
      return;
    }

    try {
      await onUpdate(column.id, editName.trim());
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleColumnKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      handleUpdateColumn();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditName(column.name);
    }
  };

  const handleDeleteColumn = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("Вы уверены, что хотите удалить эту колонку?")) {
      return;
    }
    await onDelete(column.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  };

  const dragHandleProps = {
    ...attributes,
    ...listeners,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="column">
        <div className="column-header">
          <div className="column-drag-handle" {...dragHandleProps}>
            ⋮⋮
          </div>

          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleUpdateColumn}
              onKeyDown={handleColumnKeyDown}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="column-edit-input"
            />
          ) : (
            <h3 onDoubleClick={handleEditClick}>{column.name}</h3>
          )}

          <div className="column-actions">
            <button
              className="edit-column-btn"
              onClick={handleEditClick}
              title="Редактировать"
              type="button"
            >
              ✎
            </button>
            <button
              className="delete-column-btn"
              onClick={handleDeleteColumn}
              title="Удалить"
              type="button"
            >
              ×
            </button>
          </div>
        </div>

        {taskError && (
          <div className="column-error">
            <p>{taskError}</p>
            <button onClick={() => setTaskError(null)}>×</button>
          </div>
        )}

        <div className="tasks">
          {loading ? (
            <div className="tasks-loading">Загрузка...</div>
          ) : (
            <DndContext
              sensors={taskSensors}
              collisionDetection={closestCenter}
              onDragStart={onTaskDragStart}
              onDragEnd={handleTaskDragEndLocal}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <SortableContext
                items={tasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="tasks-list">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      columnId={column.id}
                      onDelete={handleDeleteTask}
                      onUpdate={handleUpdateTask}
                    />
                  ))}
                </div>
              </SortableContext>
              
              <DragOverlay
                dropAnimation={{
                  duration: 200,
                  easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                }}
              >
                {activeTaskId && tasks.find((t) => t.id === activeTaskId) ? (
                  <div style={{ 
                    width: 'calc(100% - 4px)',
                    maxWidth: '300px',
                    transform: 'rotate(2deg) scale(1.02)',
                    boxShadow: '8px 8px 0 rgba(0, 0, 0, 0.15)',
                    cursor: 'grabbing',
                  }}>
                    <TaskCard
                      task={tasks.find((t) => t.id === activeTaskId)!}
                      columnId={column.id}
                      onDelete={handleDeleteTask}
                      onUpdate={handleUpdateTask}
                      isOverlay={true}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
          {tasks.length === 0 && !loading && (
            <div className="tasks-empty">Нет задач</div>
          )}
        </div>

        {adding ? (
          <div className="add-task-form">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Название задачи"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddTask();
                }
                if (e.key === "Escape") setAdding(false);
              }}
              autoFocus
            />
            <textarea
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="Описание (необязательно)"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  e.preventDefault();
                  handleAddTask();
                }
                if (e.key === "Escape") setAdding(false);
              }}
            />
            <div className="add-task-actions">
              <button onClick={handleAddTask} type="button">
                Добавить
              </button>
              <button onClick={() => setAdding(false)} type="button">
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <button
            className="add-task-btn"
            onClick={() => setAdding(true)}
            type="button"
          >
            + Добавить задачу
          </button>
        )}
      </div>
    </div>
  );
}