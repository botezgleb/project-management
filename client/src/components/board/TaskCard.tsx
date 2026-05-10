import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "../../types/task";
import TaskModal from "./TaskModal";
import "../../css/TaskCard.css";

interface Props {
  task: Task;
  columnId: number;
  onDelete: (columnId: number, taskId: number) => Promise<void>;
  onUpdate: (
    columnId: number,
    taskId: number,
    title: string,
    description: string,
  ) => Promise<void>;
}

export default function TaskCard({
  task,
  columnId,
  onDelete,
  onUpdate,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(
    task.description || "",
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleUpdate = async () => {
    if (!editTitle.trim()) return;
    await onUpdate(columnId, task.id, editTitle.trim(), editDescription.trim());
    setIsEditing(false);
    setIsModalOpen(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("Вы уверены, что хотите удалить эту задачу?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(columnId, task.id);
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      setIsDeleting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleUpdate();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditTitle(task.title);
      setEditDescription(task.description || "");
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setIsEditing(false);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
    setIsEditing(true);
  };

  const dragHandleProps = {
    ...attributes,
    ...listeners,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`task-card ${isDeleting ? "deleting" : ""}`}
        onClick={handleOpenModal}
      >
        <div className="task-drag-handle" {...dragHandleProps}>
          ⋮⋮
        </div>

        <div className="task-content">
          <h4 className="task-title">{task.title}</h4>
          {task.description && (
            <p className="task-description">
              {task.description.substring(0, 50)}...
            </p>
          )}
        </div>

        <div className="task-actions">
          <button
            className="edit-task-btn"
            onClick={handleEditClick}
            title="Редактировать"
            type="button"
          >
            ✎
          </button>
          <button
            className="delete-task-btn"
            onClick={handleDelete}
            title="Удалить"
            type="button"
            disabled={isDeleting}
          >
            ×
          </button>
        </div>
      </div>

      {isModalOpen && (
        <TaskModal
          task={task}
          isEditing={isEditing}
          editTitle={editTitle}
          editDescription={editDescription}
          onEditTitleChange={setEditTitle}
          onEditDescriptionChange={setEditDescription}
          onSave={handleUpdate}
          onClose={() => {
            setIsModalOpen(false);
            setIsEditing(false);
            setEditTitle(task.title);
            setEditDescription(task.description || "");
          }}
          onDelete={handleDelete}
          isDeleting={isDeleting}
          onKeyDown={handleKeyDown}
          onEditModeToggle={() => setIsEditing(true)}
        />
      )}
    </>
  );
}
