import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createTaskApi } from "../../services/api/tasks.api";
import TaskCard from "./TaskCard";
import type { Column } from "../../types/column";
import type { Task } from "../../types/task";
import "../../css/Column.css";

interface Props {
  column: Column & { tasks: Task[] };
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
  onTaskOrderChange: (columnId: number, updatedTasks: Task[]) => void;
  activeTaskId: number | null;
  onTaskDragStart: (event: any) => void;
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
  onTaskDragStart,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const [adding, setAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");

  const taskSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
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
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      await createTaskApi(
        newTaskTitle,
        newTaskDescription,
        column.id,
        projectId,
      );
      setNewTaskTitle("");
      setNewTaskDescription("");
      setAdding(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleTaskDragEndLocal = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = column.tasks.findIndex((t) => t.id === active.id);
    const newIndex = column.tasks.findIndex((t) => t.id === over.id);

    const newTasks = arrayMove(column.tasks, oldIndex, newIndex);

    const tasksWithPositions = newTasks.map((task, idx) => ({
      ...task,
      position: idx + 1,
    }));

    onTaskOrderChange(column.id, tasksWithPositions);

    const movedTask = tasksWithPositions[newIndex];
    onTaskDragEnd(event, column.id, movedTask.position);
  };

  const handleUpdateColumn = async () => {
    if (!editName.trim() || editName === column.name) {
      setIsEditing(false);
      return;
    }
    await onUpdate(column.id, editName.trim());
    setIsEditing(false);
  };

  React.useEffect(() => {
    console.log(`Column ${column.id} received tasks:`, column.tasks);
  }, [column.tasks]);

  return (
    <div ref={setNodeRef} style={style} className="column">
      <div className="column-header">
        <div {...attributes} {...listeners} className="column-drag-handle">
          ⋮⋮
        </div>

        {isEditing ? (
          <input
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
          <h3 onDoubleClick={() => setIsEditing(true)}>{column.name}</h3>
        )}

        {!isEditing && (
          <div className="column-actions">
            <button onClick={() => setIsEditing(true)}>✎</button>
            <button onClick={() => onDelete(column.id)}>×</button>
          </div>
        )}
      </div>

      <div className="tasks">
        <DndContext
          sensors={taskSensors}
          collisionDetection={closestCenter}
          onDragStart={onTaskDragStart}
          onDragEnd={handleTaskDragEndLocal}
        >
          <SortableContext
            items={column.tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {column.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                columnId={column.id}
                onDelete={onTaskDelete}
                onUpdate={onTaskUpdate}
              />
            ))}
          </SortableContext>
        </DndContext>
        {column.tasks.length === 0 && (
          <div className="tasks-empty">Нет задач</div>
        )}
      </div>

      {adding ? (
        <div className="add-task-form">
          <input
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
          />
          <div className="add-task-actions">
            <button onClick={handleAddTask}>Добавить</button>
            <button onClick={() => setAdding(false)}>Отмена</button>
          </div>
        </div>
      ) : (
        <button className="add-task-btn" onClick={() => setAdding(true)}>
          + Добавить задачу
        </button>
      )}
    </div>
  );
}
