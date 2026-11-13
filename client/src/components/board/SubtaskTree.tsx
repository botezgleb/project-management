import { useMemo, useState } from "react";
import type { Subtask } from "../../types/task";
import type { ProjectMember } from "../../types/member";
import {
  createSubtaskApi,
  deleteSubtaskApi,
  updateSubtaskApi,
} from "../../services/api/workflow.api";
import { getErrorMessage, getInitials } from "../../utils/user";
import { MemberPicker } from "./MemberPicker";
import { CheckIcon, ChevronRightIcon, PlusIcon, TrashIcon, UsersIcon } from "../ui/Icons";

interface Props {
  projectId: number;
  taskId: number;
  subtasks: Subtask[];
  members: ProjectMember[];
  myId: number | null;
  onError: (message: string) => void;
}

interface NodeProps extends Omit<Props, "subtasks"> {
  node: Subtask;
  childrenOf: Map<number | null, Subtask[]>;
  depth: number;
}

const MAX_VISUAL_DEPTH = 6;

const SubtaskNode = ({ node, childrenOf, depth, projectId, taskId, members, myId, onError }: NodeProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.title);
  const [adding, setAdding] = useState(false);
  const [childTitle, setChildTitle] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const children = childrenOf.get(node.id) ?? [];

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
    } catch (error) {
      onError(getErrorMessage(error, "Не удалось обновить подзадачу"));
    }
  };

  const saveTitle = () => {
    setEditing(false);
    const title = draft.trim();
    if (!title || title === node.title) {
      setDraft(node.title);
      return;
    }
    run(() => updateSubtaskApi(projectId, node.id, { title }));
  };

  const addChild = () => {
    const title = childTitle.trim();
    if (!title) return;
    setChildTitle("");
    run(() => createSubtaskApi(projectId, taskId, title, node.id));
  };

  return (
    <li className="subtask-node" style={{ "--depth": Math.min(depth, MAX_VISUAL_DEPTH) } as React.CSSProperties}>
      <div className={`subtask-row ${node.completed ? "is-completed" : ""}`}>
        {children.length > 0 ? (
          <button
            type="button"
            className={`subtask-caret ${collapsed ? "collapsed" : ""}`}
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Развернуть" : "Свернуть"}
          >
            <ChevronRightIcon />
          </button>
        ) : (
          <span className="subtask-caret-spacer" />
        )}

        <button
          type="button"
          className={`task-check small ${node.completed ? "checked" : ""}`}
          onClick={() => run(() => updateSubtaskApi(projectId, node.id, { completed: !node.completed }))}
          aria-label={node.completed ? "Отметить невыполненной" : "Отметить выполненной"}
        >
          <CheckIcon />
        </button>

        {editing ? (
          <input
            className="input subtask-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveTitle();
              if (e.key === "Escape") {
                setDraft(node.title);
                setEditing(false);
              }
            }}
            autoFocus
          />
        ) : (
          <span className="subtask-title" onDoubleClick={() => setEditing(true)} title="Двойной клик — переименовать">
            {node.title}
          </span>
        )}

        <div className="subtask-actions">
          <button
            type="button"
            className={`subtask-assignee ${node.assignee ? "has-assignee" : ""}`}
            onClick={() => setPickerOpen((v) => !v)}
            title={node.assignee ? `Исполнитель: ${node.assignee.name}` : "Назначить исполнителя"}
          >
            {node.assignee ? (
              <span className="avatar" style={{ width: 22, height: 22, fontSize: 9 }}>
                {getInitials(node.assignee.name)}
              </span>
            ) : (
              <UsersIcon />
            )}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setAdding((v) => !v)}
            title="Добавить вложенную подзадачу"
          >
            <PlusIcon />
          </button>
          <button
            type="button"
            className="icon-btn danger"
            onClick={() => {
              const extra = children.length ? " вместе со вложенными" : "";
              if (window.confirm(`Удалить подзадачу${extra}?`)) {
                run(() => deleteSubtaskApi(projectId, node.id));
              }
            }}
            title="Удалить"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {pickerOpen && (
        <div className="subtask-picker">
          <MemberPicker
            members={members}
            myId={myId}
            selectedIds={node.assignee ? [node.assignee.id] : []}
            onToggle={(id) => {
              setPickerOpen(false);
              run(() =>
                updateSubtaskApi(projectId, node.id, {
                  assigneeId: id === node.assignee?.id ? null : id,
                }),
              );
            }}
            onClear={() => {
              setPickerOpen(false);
              run(() => updateSubtaskApi(projectId, node.id, { assigneeId: null }));
            }}
          />
        </div>
      )}

      {(children.length > 0 || adding) && !collapsed && (
        <ul className="subtask-children">
          {children.map((child) => (
            <SubtaskNode
              key={child.id}
              node={child}
              childrenOf={childrenOf}
              depth={depth + 1}
              projectId={projectId}
              taskId={taskId}
              members={members}
              myId={myId}
              onError={onError}
            />
          ))}
          {adding && (
            <li className="subtask-node" style={{ "--depth": Math.min(depth + 1, MAX_VISUAL_DEPTH) } as React.CSSProperties}>
              <div className="subtask-add-row">
                <input
                  className="input subtask-input"
                  placeholder="Вложенная подзадача"
                  value={childTitle}
                  onChange={(e) => setChildTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addChild();
                    if (e.key === "Escape") setAdding(false);
                  }}
                  autoFocus
                />
                <button type="button" className="btn btn-sm btn-primary" onClick={addChild} disabled={!childTitle.trim()}>
                  Добавить
                </button>
              </div>
            </li>
          )}
        </ul>
      )}
    </li>
  );
};

export const SubtaskTree = ({ subtasks, ...rest }: Props) => {
  const [title, setTitle] = useState("");

  const childrenOf = useMemo(() => {
    const map = new Map<number | null, Subtask[]>();
    subtasks.forEach((s) => {
      const list = map.get(s.parentId) ?? [];
      list.push(s);
      map.set(s.parentId, list);
    });
    return map;
  }, [subtasks]);

  const roots = childrenOf.get(null) ?? [];
  const done = subtasks.filter((s) => s.completed).length;

  const addRoot = async () => {
    const value = title.trim();
    if (!value) return;
    setTitle("");
    try {
      await createSubtaskApi(rest.projectId, rest.taskId, value, null);
    } catch (error) {
      rest.onError(getErrorMessage(error, "Не удалось добавить подзадачу"));
    }
  };

  return (
    <div className="subtasks">
      {subtasks.length > 0 && (
        <div
          className="subtasks-progress"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={subtasks.length}
          aria-valuenow={done}
          aria-label={`Выполнено подзадач: ${done} из ${subtasks.length}`}
        >
          <span style={{ width: `${(done / subtasks.length) * 100}%` }} />
        </div>
      )}

      <ul className="subtask-list">
        {roots.map((node) => (
          <SubtaskNode key={node.id} node={node} childrenOf={childrenOf} depth={0} {...rest} />
        ))}
      </ul>

      <div className="subtask-add-row">
        <input
          className="input subtask-input"
          placeholder="Новая подзадача"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addRoot()}
        />
        <button type="button" className="btn btn-sm" onClick={addRoot} disabled={!title.trim()}>
          <PlusIcon /> Добавить
        </button>
      </div>
    </div>
  );
};
