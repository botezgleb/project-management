import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createTaskApi } from "../../services/api/tasks.api";
import TaskCard, { TaskCardBody, TaskCardOverlay } from "./TaskCard";
import { SORT_TRANSITION, dropAnimation, useBoardSensors } from "./dnd";
import { CheckIcon, GripIcon, PlusIcon } from "../ui/Icons";
import { ColumnMenu } from "./ColumnMenu";
import { useBoard } from "../../hooks/useBoard";
import { getInitials } from "../../utils/user";
import type { Column } from "../../types/column";
import type { Task } from "../../types/task";
import "../../css/Column.css";

interface Props {
  column: Column & { tasks: Task[] };
  projectId: number;
  onDelete: (columnId: number) => Promise<void>;
  onUpdate: (columnId: number, newName: string) => Promise<void>;
  onTaskDelete: (columnId: number, taskId: number) => Promise<void>;
  onTaskDragEnd: (event: DragEndEvent, columnId: number, newPosition: number) => void;
  onTaskOrderChange: (columnId: number, updatedTasks: Task[]) => void;
}

// превью колонки, которое «летит» за курсором
export const ColumnOverlay = ({ column }: { column: Column & { tasks: Task[] } }) => (
  <div className="column drag-overlay-item">
    <div className="column-header">
      <span className="column-grip" aria-hidden>
        <GripIcon />
      </span>
      <h3>{column.name}</h3>
      <span className="column-count">{column.tasks.length}</span>
    </div>
    <div className="tasks">
      {column.tasks.slice(0, 6).map((task) => (
        <div key={task.id} className="task-card">
          <TaskCardBody task={task} />
        </div>
      ))}
      {column.tasks.length === 0 && <div className="tasks-empty">Нет задач</div>}
    </div>
  </div>
);

export default function ColumnComponent({
  column,
  projectId,
  onDelete,
  onUpdate,
  onTaskDelete,
  onTaskDragEnd,
  onTaskOrderChange,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const [adding, setAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  const taskSensors = useBoardSensors(5);
  const { onlyMine, myId } = useBoard();

  // фильтр «Только мои»: перетаскивание выключаем, позиции считаются по полному списку
  const visibleTasks = onlyMine
    ? column.tasks.filter((t) => t.assignees.some((a) => a.id === myId))
    : column.tasks;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: column.id,
      disabled: isEditing || adding,
      transition: SORT_TRANSITION,
    });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const activeTask = column.tasks.find((t) => t.id === activeTaskId) ?? null;

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      await createTaskApi(newTaskTitle, newTaskDescription, column.id, projectId);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setAdding(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleTaskDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as number);
  };

  const handleTaskDragEnd = (event: DragEndEvent) => {
    setActiveTaskId(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = column.tasks.findIndex((t) => t.id === active.id);
    const newIndex = column.tasks.findIndex((t) => t.id === over.id);

    const tasksWithPositions = arrayMove(column.tasks, oldIndex, newIndex).map(
      (task, idx) => ({ ...task, position: idx + 1 }),
    );

    onTaskOrderChange(column.id, tasksWithPositions);
    onTaskDragEnd(event, column.id, tasksWithPositions[newIndex].position);
  };

  const handleUpdateColumn = async () => {
    if (!editName.trim() || editName === column.name) {
      setIsEditing(false);
      return;
    }
    await onUpdate(column.id, editName.trim());
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`column glass ${isDragging ? "is-placeholder" : ""} ${column.isDone ? "is-done-column" : ""}`}
    >
      <div
        className={`column-header ${isEditing ? "" : "is-draggable"}`}
        {...attributes}
        {...listeners}
      >
        <span className="column-grip" aria-hidden>
          <GripIcon />
        </span>

        {isEditing ? (
          <input
            className="input column-name-input"
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleUpdateColumn}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUpdateColumn();
              if (e.key === "Escape") setIsEditing(false);
            }}
            autoFocus
          />
        ) : (
          <>
            <h3 onDoubleClick={() => setIsEditing(true)}>{column.name}</h3>
            {column.isDone && (
              <span className="column-done-badge" title="Колонка «Готово»: задачи здесь выполнены">
                <CheckIcon />
              </span>
            )}
            <span className="column-count">
              {onlyMine ? `${visibleTasks.length}/${column.tasks.length}` : column.tasks.length}
            </span>
            <div className="column-actions" onPointerDown={(e) => e.stopPropagation()}>
              {column.responsible && (
                <span
                  className="avatar column-responsible"
                  title={`Ответственный: ${column.responsible.name}`}
                >
                  {getInitials(column.responsible.name)}
                </span>
              )}
              <ColumnMenu
                column={column}
                onRename={() => setIsEditing(true)}
                onDelete={() => {
                  if (window.confirm(`Удалить колонку «${column.name}» вместе с задачами?`)) {
                    onDelete(column.id);
                  }
                }}
              />
            </div>
          </>
        )}
      </div>

      <div className="tasks">
        <DndContext
          sensors={taskSensors}
          collisionDetection={closestCenter}
          onDragStart={handleTaskDragStart}
          onDragEnd={handleTaskDragEnd}
          onDragCancel={() => setActiveTaskId(null)}
        >
          <SortableContext
            items={column.tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {visibleTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                columnId={column.id}
                onDelete={onTaskDelete}
                dragDisabled={onlyMine}
              />
            ))}
          </SortableContext>

          {/* портал в body: у стеклянной колонки есть backdrop-filter,
              который ломает position: fixed у оверлея */}
          {createPortal(
            <DragOverlay dropAnimation={dropAnimation} modifiers={[restrictToVerticalAxis]}>
              {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
            </DragOverlay>,
            document.body,
          )}
        </DndContext>

        {visibleTasks.length === 0 && !adding && (
          <div className="tasks-empty">{onlyMine ? "Ваших задач нет" : "Нет задач"}</div>
        )}
      </div>

      {adding ? (
        <div className="add-task-form">
          <input
            className="input"
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
            className="input"
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            placeholder="Описание (необязательно)"
            rows={2}
          />
          <div className="add-task-actions">
            <button className="btn btn-sm" onClick={() => setAdding(false)}>
              Отмена
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim()}
            >
              Добавить
            </button>
          </div>
        </div>
      ) : (
        <button className="add-task-btn" onClick={() => setAdding(true)}>
          <PlusIcon /> Добавить задачу
        </button>
      )}
    </div>
  );
}
