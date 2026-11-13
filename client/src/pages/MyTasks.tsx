import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMyTasksApi,
  updateSubtaskApi,
  updateTaskMetaApi,
} from "../services/api/workflow.api";
import { socket } from "../socket/socket";
import { CheckIcon, ChevronRightIcon, LockIcon, SubtasksIcon } from "../components/ui/Icons";
import type { MyTasks as MyTasksData } from "../types/stats";
import { getErrorMessage } from "../utils/user";
import "../css/MyTasks.css";

type Filter = "open" | "done" | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "open", label: "Открытые" },
  { id: "done", label: "Выполненные" },
  { id: "all", label: "Все" },
];

export const MyTasks = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<MyTasksData | null>(null);
  const [filter, setFilter] = useState<Filter>("open");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setData(await getMyTasksApi());
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось загрузить задачи"));
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await reload();
    };
    init();

    // назначили новую задачу/подзадачу — обновляем список
    const events = ["task:assigned", "subtask:assigned", "tasks:assigned-bulk", "project:removed"];
    events.forEach((e) => socket.on(e, reload));
    window.addEventListener("focus", reload);
    return () => {
      events.forEach((e) => socket.off(e, reload));
      window.removeEventListener("focus", reload);
    };
  }, [reload]);

  const matches = useCallback(
    (completed: boolean) =>
      filter === "all" || (filter === "open" ? !completed : completed),
    [filter],
  );

  // группировка по проектам
  const groups = useMemo(() => {
    if (!data) return [];
    const map = new Map<number, { project: { id: number; name: string }; tasks: MyTasksData["tasks"] }>();
    data.tasks
      .filter((t) => matches(t.completed))
      .forEach((t) => {
        const group = map.get(t.project.id) ?? { project: t.project, tasks: [] };
        group.tasks.push(t);
        map.set(t.project.id, group);
      });
    return [...map.values()];
  }, [data, matches]);

  const subtasks = data?.subtasks.filter((s) => matches(s.completed)) ?? [];

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
      await reload();
    } catch (err) {
      setError(getErrorMessage(err, "Не удалось обновить"));
    }
  };

  if (!data && !error) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Загрузка задач…</p>
      </div>
    );
  }

  const openCount = data?.tasks.filter((t) => !t.completed).length ?? 0;

  return (
    <div className="page my-tasks-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            My <span>Tasks</span>
          </h1>
          <p className="page-subtitle">
            {openCount > 0 ? `Открытых задач: ${openCount}` : "Все назначенные задачи выполнены"}
          </p>
        </div>
        <div className="segmented" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              className={`segmented-item ${filter === f.id ? "active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)}>OK</button>
        </div>
      )}

      {groups.length === 0 && subtasks.length === 0 ? (
        <div className="empty-state glass my-tasks-empty">
          <h2>{filter === "done" ? "Пока ничего не выполнено" : "Здесь пусто"}</h2>
          <p>Задачи появятся, когда вас назначат исполнителем или ответственным за колонку.</p>
        </div>
      ) : (
        <div className="my-tasks-groups stagger">
          {groups.map(({ project, tasks }) => (
            <section key={project.id} className="my-tasks-group glass">
              <Link to={`/projects/${project.id}`} className="my-tasks-project">
                <span className="my-tasks-project-icon">
                  {project.name.trim().charAt(0).toUpperCase()}
                </span>
                {project.name}
                <ChevronRightIcon className="my-tasks-chevron" />
              </Link>

              <ul className="my-tasks-list">
                {tasks.map((t) => (
                  <li
                    key={t.id}
                    className={`my-task ${t.completed ? "is-completed" : ""}`}
                    onClick={() => navigate(`/projects/${project.id}?task=${t.id}`)}
                  >
                    <button
                      type="button"
                      className={`task-check ${t.completed ? "checked" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        run(() => updateTaskMetaApi(project.id, t.id, { completed: !t.completed }));
                      }}
                      aria-label={t.completed ? "Отметить невыполненной" : "Отметить выполненной"}
                    >
                      <CheckIcon />
                    </button>
                    <div className="my-task-body">
                      <span className="my-task-title">{t.title}</span>
                      <span className="my-task-meta">
                        <span className="badge">{t.column.name}</span>
                        {t.isBlocked && !t.completed && (
                          <span className="badge badge-warning">
                            <LockIcon width={12} height={12} /> ждёт другие задачи
                          </span>
                        )}
                        {t.subtasksTotal > 0 && (
                          <span className="badge">
                            <SubtasksIcon width={12} height={12} /> {t.subtasksDone}/{t.subtasksTotal}
                          </span>
                        )}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {subtasks.length > 0 && (
            <section className="my-tasks-group glass">
              <div className="my-tasks-project static">
                <span className="my-tasks-project-icon sub">
                  <SubtasksIcon width={16} height={16} />
                </span>
                Подзадачи
              </div>
              <ul className="my-tasks-list">
                {subtasks.map((s) => (
                  <li
                    key={s.id}
                    className={`my-task ${s.completed ? "is-completed" : ""}`}
                    onClick={() => navigate(`/projects/${s.project.id}?task=${s.task.id}`)}
                  >
                    <button
                      type="button"
                      className={`task-check ${s.completed ? "checked" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        run(() => updateSubtaskApi(s.project.id, s.id, { completed: !s.completed }));
                      }}
                      aria-label={s.completed ? "Отметить невыполненной" : "Отметить выполненной"}
                    >
                      <CheckIcon />
                    </button>
                    <div className="my-task-body">
                      <span className="my-task-title">{s.title}</span>
                      <span className="my-task-meta">
                        <span className="muted">
                          {s.project.name} · {s.task.title}
                        </span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
