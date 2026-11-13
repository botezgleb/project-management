import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "../../types/task";
import { SORT_TRANSITION } from "./dnd";
import { AvatarStack } from "./AvatarStack";
import { CheckIcon, LockIcon, SubtasksIcon, TrashIcon } from "../ui/Icons";
import { useBoard } from "../../hooks/useBoard";
import { updateTaskMetaApi } from "../../services/api/workflow.api";
import { getErrorMessage } from "../../utils/user";
import "../../css/TaskCard.css";

interface Props {
  task: Task;
  columnId: number;
  onDelete: (columnId: number, taskId: number) => Promise<void>;
  dragDisabled?: boolean;
}

interface BodyProps {
  task: Task;
  completed?: boolean;
  onToggle?: (e: React.MouseEvent) => void;
  actions?: React.ReactNode;
}

// чистая разметка карточки — используется и в списке, и в оверлее перетаскивания
export const TaskCardBody = ({ task, completed = task.completed, onToggle, actions }: BodyProps) => {
  const pendingBlockers = task.blockedBy.filter((b) => !b.completed);
  const hasMeta =
    task.subtasksTotal > 0 || task.assignees.length > 0 || (task.isBlocked && !completed);

  return (
    <>
      <button
        type="button"
        className={`task-check ${completed ? "checked" : ""}`}
        onClick={onToggle}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label={completed ? "Отметить невыполненной" : "Отметить выполненной"}
        aria-pressed={completed}
        tabIndex={onToggle ? 0 : -1}
      >
        <CheckIcon />
      </button>

      <div className="task-content">
        <h4 className="task-title">{task.title}</h4>
        {task.description && <p className="task-description">{task.description}</p>}

        {hasMeta && (
          <div className="task-meta">
            {task.isBlocked && !completed && (
              <span
                className="task-pill task-pill-blocked"
                title={`Ждёт: ${pendingBlockers.map((b) => b.title).join(", ")}`}
              >
                <LockIcon /> Ждёт {pendingBlockers.length}
              </span>
            )}
            {task.subtasksTotal > 0 && (
              <span
                className={`task-pill ${task.subtasksDone === task.subtasksTotal ? "task-pill-done" : ""}`}
                title="Подзадачи"
              >
                <SubtasksIcon /> {task.subtasksDone}/{task.subtasksTotal}
              </span>
            )}
            <span className="task-meta-spacer" />
            <AvatarStack users={task.assignees} />
          </div>
        )}
      </div>

      {actions && <div className="task-actions">{actions}</div>}
    </>
  );
};

export const TaskCardOverlay = ({ task }: { task: Task }) => (
  <div className={`task-card drag-overlay-item ${task.completed ? "is-completed" : ""}`}>
    <TaskCardBody task={task} />
  </div>
);

export default function TaskCard({ task, columnId, onDelete, dragDisabled }: Props) {
  const { projectId, openTask, reportError } = useBoard();
  const [isDeleting, setIsDeleting] = useState(false);
  // оптимистичная галочка: показываем новое значение, пока сервер не подтвердит
  const [pending, setPending] = useState<{ from: boolean; value: boolean } | null>(null);
  const completed = pending && pending.from === task.completed ? pending.value : task.completed;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: task.id,
      disabled: dragDisabled,
      transition: SORT_TRANSITION,
    });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const value = !completed;
    setPending({ from: task.completed, value });
    try {
      await updateTaskMetaApi(projectId, task.id, { completed: value });
    } catch (error) {
      setPending(null);
      reportError(getErrorMessage(error, "Не удалось обновить задачу"));
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Удалить эту задачу?")) return;

    setIsDeleting(true);
    try {
      await onDelete(columnId, task.id);
    } catch (error) {
      setIsDeleting(false);
      reportError(getErrorMessage(error, "Не удалось удалить задачу"));
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "task-card",
        isDragging && "is-placeholder",
        isDeleting && "deleting",
        completed && "is-completed",
        task.isBlocked && !completed && "is-blocked",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => openTask(task.id)}
      {...attributes}
      {...listeners}
    >
      <TaskCardBody
        task={task}
        completed={completed}
        onToggle={handleToggle}
        actions={
          <button
            className="icon-btn danger"
            onClick={handleDelete}
            onPointerDown={(e) => e.stopPropagation()}
            title="Удалить"
            type="button"
            disabled={isDeleting}
          >
            <TrashIcon />
          </button>
        }
      />
    </div>
  );
}
