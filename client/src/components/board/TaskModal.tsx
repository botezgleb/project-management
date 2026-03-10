import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import type { Task } from "../../types/task";
import "../../css/TaskModal.css";

interface Props {
  task: Task;
  isEditing: boolean;
  editTitle: string;
  editDescription: string;
  onEditTitleChange: (value: string) => void;
  onEditDescriptionChange: (value: string) => void;
  onSave: () => Promise<void>;
  onClose: () => void;
  onDelete: (e: React.MouseEvent) => Promise<void>;
  isDeleting: boolean;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onEditModeToggle: () => void;
}

export default function TaskModal({
  task,
  isEditing,
  editTitle,
  editDescription,
  onEditTitleChange,
  onEditDescriptionChange,
  onSave,
  onClose,
  onDelete,
  isDeleting,
  onKeyDown,
  onEditModeToggle,
}: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const modalContent = (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="task-modal-close" onClick={onClose}>×</button>
        
        {isEditing ? (
          <div className="task-modal-content">
            <h2>Редактирование задачи</h2>
            
            <div className="task-modal-form">
              <div className="task-modal-field">
                <label>Название</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => onEditTitleChange(e.target.value)}
                  onKeyDown={onKeyDown}
                  autoFocus
                  placeholder="Введите название задачи"
                />
              </div>

              <div className="task-modal-field">
                <label>Описание</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => onEditDescriptionChange(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={8}
                  placeholder="Введите описание задачи"
                />
              </div>

              <div className="task-modal-actions">
                <button className="task-modal-btn task-modal-btn-primary" onClick={onSave}>
                  Сохранить
                </button>
                <button className="task-modal-btn" onClick={onClose}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="task-modal-content">
            <div className="task-modal-header">
              <h2>{task.title}</h2>
            </div>

            {task.description ? (
              <div className="task-modal-description">
                <p>{task.description}</p>
              </div>
            ) : (
              <div className="task-modal-description task-modal-description-empty">
                <p>Нет описания</p>
              </div>
            )}

            <div className="task-modal-footer">
              <button 
                className="task-modal-btn task-modal-btn-primary"
                onClick={onEditModeToggle}
              >
                Редактировать
              </button>
              <button 
                className="task-modal-btn task-modal-btn-danger"
                onClick={onDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Удаление..." : "Удалить"}
              </button>
              <button className="task-modal-btn" onClick={onClose}>
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    modalContent,
    document.body
  );
}