import { useEffect, useRef, useState } from "react";
import type { ColumnWithTasks } from "../../types/column";
import { useBoard } from "../../hooks/useBoard";
import {
  assignAllColumnTasksApi,
  updateColumnMetaApi,
} from "../../services/api/workflow.api";
import { getErrorMessage, getInitials } from "../../utils/user";
import { MemberPicker } from "./MemberPicker";
import { CheckIcon, MoreIcon, PencilIcon, TrashIcon, UsersIcon } from "../ui/Icons";
import { toast } from "sonner";

interface Props {
  column: ColumnWithTasks;
  onRename: () => void;
  onDelete: () => void;
}

export const ColumnMenu = ({ column, onRename, onDelete }: Props) => {
  const { projectId, members, myId, reportError } = useBoard();
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // закрытие по клику снаружи и Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setPickerOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setPickerOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    try {
      await action();
    } catch (error) {
      reportError(getErrorMessage(error, fallback));
    }
  };

  const toggleDone = () =>
    run(
      () => updateColumnMetaApi(projectId, column.id, { isDone: !column.isDone }),
      "Не удалось обновить колонку",
    );

  const setResponsible = (responsibleId: number | null) => {
    setPickerOpen(false);
    run(
      () => updateColumnMetaApi(projectId, column.id, { responsibleId }),
      "Не удалось назначить ответственного",
    );
  };

  const assignAll = () => {
    setOpen(false);
    run(async () => {
      const { assigned, total } = await assignAllColumnTasksApi(projectId, column.id);
      toast.success(
        assigned > 0
          ? `Назначено задач: ${assigned} из ${total}`
          : "Все задачи колонки уже назначены на ответственного",
      );
    }, "Не удалось назначить задачи");
  };

  return (
    <div className="column-menu" ref={rootRef}>
      <button
        className={`icon-btn ${open ? "active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        title="Настройки колонки"
        aria-expanded={open}
      >
        <MoreIcon />
      </button>

      {open && (
        <div className="popover column-menu-popover" role="menu">
          <button className="menu-item" onClick={() => { setOpen(false); onRename(); }}>
            <PencilIcon /> Переименовать
          </button>

          <button className="menu-item" onClick={toggleDone} role="menuitemcheckbox" aria-checked={!!column.isDone}>
            <CheckIcon />
            <span className="menu-item-label">
              Колонка «Готово»
              <small>Задачи здесь считаются выполненными</small>
            </span>
            <span className={`switch ${column.isDone ? "on" : ""}`} aria-hidden />
          </button>

          <div className="menu-separator" />

          <button className="menu-item" onClick={() => setPickerOpen((v) => !v)} aria-expanded={pickerOpen}>
            <UsersIcon />
            <span className="menu-item-label">
              Ответственный
              <small>{column.responsible ? column.responsible.name : "Не назначен"}</small>
            </span>
            {column.responsible && (
              <span className="avatar" style={{ width: 24, height: 24, fontSize: 10 }}>
                {getInitials(column.responsible.name)}
              </span>
            )}
          </button>

          {pickerOpen && (
            <div className="menu-picker">
              <MemberPicker
                members={members}
                myId={myId}
                selectedIds={column.responsibleId ? [column.responsibleId] : []}
                onToggle={(id) => setResponsible(id === column.responsibleId ? null : id)}
                onClear={() => setResponsible(null)}
              />
            </div>
          )}

          <button
            className="menu-item"
            onClick={assignAll}
            disabled={!column.responsibleId || column.tasks.length === 0}
            title={!column.responsibleId ? "Сначала выберите ответственного" : undefined}
          >
            <UsersIcon />
            <span className="menu-item-label">
              Назначить все задачи
              <small>на ответственного колонки</small>
            </span>
          </button>

          <div className="menu-separator" />

          <button className="menu-item danger" onClick={() => { setOpen(false); onDelete(); }}>
            <TrashIcon /> Удалить колонку
          </button>
        </div>
      )}
    </div>
  );
};
