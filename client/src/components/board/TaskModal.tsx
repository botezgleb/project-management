import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useBoard } from "../../hooks/useBoard";
import { socket } from "../../socket/socket";
import { deleteTaskApi, updateTaskApi } from "../../services/api/tasks.api";
import {
  addDependencyApi,
  getTaskDetailsApi,
  removeDependencyApi,
  updateTaskMetaApi,
} from "../../services/api/workflow.api";
import type { TaskDetails } from "../../types/task";
import { getErrorMessage, getInitials } from "../../utils/user";
import { MemberPicker } from "./MemberPicker";
import { SubtaskTree } from "./SubtaskTree";
import {
  CalendarIcon,
  CheckIcon,
  CloseIcon,
  LinkIcon,
  LockIcon,
  PlusIcon,
  SubtasksIcon,
  TrashIcon,
  UsersIcon,
} from "../ui/Icons";
import "../../css/TaskModal.css";

interface Props {
  taskId: number;
  onClose: () => void;
}

export default function TaskModal({ taskId, onClose }: Props) {
  const { projectId, columns, members, myId } = useBoard();

  // задача берётся из состояния доски — оно обновляется по сокету
  const task = useMemo(
    () => columns.flatMap((c) => c.tasks).find((t) => t.id === taskId) ?? null,
    [columns, taskId],
  );

  const [details, setDetails] = useState<TaskDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [descDraft, setDescDraft] = useState<string | null>(null);
  const [assigneesOpen, setAssigneesOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadDetails = useCallback(async () => {
    try {
      setDetails(await getTaskDetailsApi(projectId, taskId));
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось загрузить задачу"));
    }
  }, [projectId, taskId]);

  useEffect(() => {
    const init = async () => {
      await loadDetails();
    };
    init();
  }, [loadDetails]);

  // подзадачи/зависимости поменялись (у нас или у коллег) — перечитываем
  useEffect(() => {
    const onChanged = (payload: { taskId: number }) => {
      if (payload.taskId === taskId) loadDetails();
    };
    socket.on("subtasks-updated", onChanged);
    return () => {
      socket.off("subtasks-updated", onChanged);
    };
  }, [taskId, loadDetails]);

  // задачу удалили — закрываем окно (с паузой, чтобы пережить промежуточные
  // состояния доски во время переноса между колонками)
  useEffect(() => {
    if (task || !details) return;
    const timer = setTimeout(onClose, 700);
    return () => clearTimeout(timer);
  }, [task, details, onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !editingTitle && descDraft === null) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, editingTitle, descDraft]);

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    try {
      setError(null);
      await action();
    } catch (err) {
      setError(getErrorMessage(err, fallback));
    }
  };

  if (!task) return null;

  const assigneeIds = task.assignees.map((a) => a.id);
  const blockedByIds = new Set(details?.blockedBy.map((b) => b.id) ?? []);
  const dependencyCandidates = columns.flatMap((c) =>
    c.tasks
      .filter((t) => t.id !== task.id && !blockedByIds.has(t.id))
      .map((t) => ({ ...t, columnName: c.name })),
  );

  const saveTitle = () => {
    setEditingTitle(false);
    const title = titleDraft.trim();
    if (!title || title === task.title) return;
    run(
      () => updateTaskApi(title, task.description ?? "", projectId, task.columnId, task.id),
      "Не удалось переименовать задачу",
    );
  };

  const saveDescription = () => {
    const description = (descDraft ?? "").trim();
    setDescDraft(null);
    if (description === (task.description ?? "")) return;
    run(
      () => updateTaskApi(task.title, description, projectId, task.columnId, task.id),
      "Не удалось сохранить описание",
    );
  };

  const toggleAssignee = (userId: number) => {
    const next = assigneeIds.includes(userId)
      ? assigneeIds.filter((id) => id !== userId)
      : [...assigneeIds, userId];
    run(() => updateTaskMetaApi(projectId, task.id, { assigneeIds: next }), "Не удалось назначить");
  };

  const handleDelete = async () => {
    if (!window.confirm("Удалить задачу вместе с подзадачами?")) return;
    setDeleting(true);
    try {
      await deleteTaskApi(projectId, task.columnId, task.id);
      onClose();
    } catch (err) {
      setDeleting(false);
      setError(getErrorMessage(err, "Не удалось удалить задачу"));
    }
  };

  const created = new Date(task.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-sheet glass task-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={task.title}
      >
        <button className="icon-btn task-modal-close" onClick={onClose} title="Закрыть">
          <CloseIcon />
        </button>

        {/* ---------- заголовок ---------- */}
        <div className="task-modal-head">
          <button
            type="button"
            className={`task-check large ${task.completed ? "checked" : ""}`}
            onClick={() =>
              run(
                () => updateTaskMetaApi(projectId, task.id, { completed: !task.completed }),
                "Не удалось обновить задачу",
              )
            }
            aria-label={task.completed ? "Отметить невыполненной" : "Отметить выполненной"}
          >
            <CheckIcon />
          </button>

          {editingTitle ? (
            <input
              className="input task-modal-title-input"
              value={titleDraft}
              maxLength={50}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") setEditingTitle(false);
              }}
              autoFocus
            />
          ) : (
            <h2
              className={`task-modal-title ${task.completed ? "is-completed" : ""}`}
              onClick={() => {
                setTitleDraft(task.title);
                setEditingTitle(true);
              }}
              title="Нажмите, чтобы переименовать"
            >
              {task.title}
            </h2>
          )}
        </div>

        {task.isBlocked && !task.completed && (
          <div className="task-modal-banner">
            <LockIcon /> Задача ждёт выполнения других задач — см. «Зависимости»
          </div>
        )}

        {error && (
          <div className="alert task-modal-alert">
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="Закрыть">
              <CloseIcon width={16} height={16} />
            </button>
          </div>
        )}

        {/* ---------- свойства ---------- */}
        <div className="task-props">
          <div className="task-prop">
            <span className="task-prop-label">Колонка</span>
            <select
              className="task-select"
              value={task.columnId}
              onChange={(e) =>
                run(
                  () => updateTaskMetaApi(projectId, task.id, { columnId: Number(e.target.value) }),
                  "Не удалось перенести задачу",
                )
              }
            >
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.isDone ? " ✓" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="task-prop task-prop-assignees">
            <span className="task-prop-label">Исполнители</span>
            <div className="task-assignees">
              {task.assignees.map((a) => (
                <span key={a.id} className="assignee-chip">
                  <span className="avatar" style={{ width: 22, height: 22, fontSize: 9 }}>
                    {getInitials(a.name)}
                  </span>
                  {a.name}
                  <button
                    type="button"
                    onClick={() => toggleAssignee(a.id)}
                    aria-label={`Снять ${a.name}`}
                  >
                    <CloseIcon />
                  </button>
                </span>
              ))}
              {!assigneeIds.includes(myId ?? -1) && myId && (
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => toggleAssignee(myId)}>
                  Взять себе
                </button>
              )}
              <button
                type="button"
                className={`btn btn-sm ${assigneesOpen ? "btn-primary" : ""}`}
                onClick={() => setAssigneesOpen((v) => !v)}
                aria-expanded={assigneesOpen}
              >
                <UsersIcon /> {task.assignees.length ? "Изменить" : "Назначить"}
              </button>
            </div>
          </div>

          {assigneesOpen && (
            <div className="task-prop-picker">
              <MemberPicker
                members={members}
                myId={myId}
                selectedIds={assigneeIds}
                onToggle={toggleAssignee}
              />
            </div>
          )}

          <div className="task-prop">
            <span className="task-prop-label">Создана</span>
            <span className="task-prop-value">
              <CalendarIcon /> {created}
            </span>
          </div>
        </div>

        {/* ---------- описание ---------- */}
        <section className="task-section">
          <h3>Описание</h3>
          {descDraft !== null ? (
            <div className="task-desc-edit">
              <textarea
                className="input"
                rows={5}
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setDescDraft(null)}
                autoFocus
              />
              <div className="task-desc-actions">
                <button className="btn btn-sm" onClick={() => setDescDraft(null)}>
                  Отмена
                </button>
                <button className="btn btn-sm btn-primary" onClick={saveDescription}>
                  Сохранить
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`task-modal-description ${task.description ? "" : "is-empty"}`}
              onClick={() => setDescDraft(task.description ?? "")}
              title="Нажмите, чтобы изменить"
            >
              {task.description || "Добавить описание…"}
            </div>
          )}
        </section>

        {/* ---------- подзадачи ---------- */}
        <section className="task-section">
          <h3>
            <SubtasksIcon /> Подзадачи
            {task.subtasksTotal > 0 && (
              <span className="task-section-count">
                {task.subtasksDone}/{task.subtasksTotal}
              </span>
            )}
          </h3>
          {details ? (
            <SubtaskTree
              projectId={projectId}
              taskId={task.id}
              subtasks={details.subtasks}
              members={members}
              myId={myId}
              onError={setError}
            />
          ) : (
            <div className="spinner task-section-spinner" />
          )}
        </section>

        {/* ---------- зависимости ---------- */}
        <section className="task-section">
          <h3>
            <LinkIcon /> Зависимости
          </h3>

          <div className="dep-group">
            <span className="dep-group-label">Ждёт выполнения</span>
            {details?.blockedBy.length ? (
              <ul className="dep-list">
                {details.blockedBy.map((d) => (
                  <li key={d.id} className={`dep-item ${d.completed ? "is-done" : ""}`}>
                    <span className="dep-status" aria-label={d.completed ? "Выполнена" : "Не выполнена"}>
                      {d.completed ? <CheckIcon /> : <LockIcon />}
                    </span>
                    <span className="dep-title">{d.title}</span>
                    <span className="dep-column">{d.columnName}</span>
                    <button
                      type="button"
                      className="icon-btn"
                      title="Убрать зависимость"
                      onClick={() =>
                        run(() => removeDependencyApi(projectId, task.id, d.id), "Не удалось убрать зависимость")
                      }
                    >
                      <CloseIcon />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dep-empty">Ни от чего не зависит</p>
            )}

            {dependencyCandidates.length > 0 && (
              <label className="dep-add">
                <PlusIcon />
                <select
                  className="task-select"
                  value=""
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    if (id) {
                      run(() => addDependencyApi(projectId, task.id, id), "Не удалось добавить зависимость");
                    }
                  }}
                >
                  <option value="">Добавить задачу, которую нужно сделать раньше…</option>
                  {dependencyCandidates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} — {t.columnName}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {details && details.blocking.length > 0 && (
            <div className="dep-group">
              <span className="dep-group-label">Блокирует</span>
              <ul className="dep-list">
                {details.blocking.map((d) => (
                  <li key={d.id} className={`dep-item ${d.completed ? "is-done" : ""}`}>
                    <span className="dep-status">{d.completed ? <CheckIcon /> : <LinkIcon />}</span>
                    <span className="dep-title">{d.title}</span>
                    <span className="dep-column">{d.columnName}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="modal-actions task-modal-footer">
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            <TrashIcon /> {deleting ? "Удаление..." : "Удалить задачу"}
          </button>
          <span className="task-modal-spacer" />
          <button className="btn" onClick={onClose}>
            Готово
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
