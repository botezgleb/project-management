import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOneProjectApi } from "../services/api/projects.api";
import { getProjectStatsApi } from "../services/api/workflow.api";
import { socket } from "../socket/socket";
import { ProjectTabs } from "../components/project/ProjectTabs";
import { CheckIcon, LockIcon, UsersIcon } from "../components/ui/Icons";
import type { ProjectStats as Stats } from "../types/stats";
import { getErrorMessage, getInitials } from "../utils/user";
import "../css/ProjectStats.css";

interface Tip {
  x: number;
  y: number;
  title: string;
  lines: string[];
}

const percent = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

const shortDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

export const ProjectStats = () => {
  const projectId = Number(useParams().projectId);
  const [stats, setStats] = useState<Stats | null>(null);
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [data, project] = await Promise.all([
          getProjectStatsApi(projectId),
          getOneProjectApi(projectId),
        ]);
        if (cancelled) return;
        setStats(data);
        setProjectName(project.name ?? "");
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "Не удалось загрузить статистику"));
      }
    };
    load();

    // любые изменения задач в проекте — пересчитываем
    socket.emit("join-project", projectId);
    const events = ["tasks-updated", "tasks-reordered", "task-created", "task-deleted", "column-updated", "members-updated"];
    const refresh = () => {
      getProjectStatsApi(projectId).then((d) => !cancelled && setStats(d)).catch(console.error);
    };
    events.forEach((e) => socket.on(e, refresh));
    return () => {
      cancelled = true;
      events.forEach((e) => socket.off(e, refresh));
      socket.emit("leave-project", projectId);
    };
  }, [projectId]);

  const showTip = (e: React.MouseEvent, title: string, lines: string[]) =>
    setTip({ x: e.clientX, y: e.clientY, title, lines });
  const hideTip = () => setTip(null);

  if (error) {
    return (
      <div className="page">
        <div className="alert">{error}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Считаем статистику…</p>
      </div>
    );
  }

  const { totals, byColumn, byMember, activity } = stats;
  const members = [...byMember].sort((a, b) => b.assigned - a.assigned);
  const maxColumn = Math.max(1, ...byColumn.map((c) => c.total));
  const maxDay = Math.max(1, ...activity.map((d) => d.completed));
  const doneLast14 = activity.reduce((sum, d) => sum + d.completed, 0);

  return (
    <div className="page stats-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{projectName || "Проект"}</h1>
          <p className="page-subtitle">Распределение и прогресс задач</p>
        </div>
      </div>

      <div className="board-toolbar">
        <ProjectTabs projectId={projectId} />
      </div>

      {/* ---------- KPI ---------- */}
      <section className="stats-kpis">
        <div className="stat-hero glass">
          <span className="stat-label">Выполнено</span>
          <span className="stat-hero-value">{Math.round(totals.completionRate * 100)}%</span>
          <div
            className="meter"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={totals.tasks}
            aria-valuenow={totals.completed}
            aria-label={`Выполнено ${totals.completed} из ${totals.tasks} задач`}
          >
            <span style={{ width: `${totals.completionRate * 100}%` }} />
          </div>
          <span className="stat-sub">
            {totals.completed} из {totals.tasks} задач
          </span>
        </div>

        <div className="stat-tiles">
          <div className="stat-tile glass">
            <span className="stat-label">Открыто</span>
            <span className="stat-value">{totals.open}</span>
          </div>
          <div className="stat-tile glass">
            <span className="stat-label">
              <LockIcon className="stat-status-icon warning" /> Заблокировано
            </span>
            <span className="stat-value">{totals.blocked}</span>
          </div>
          <div className="stat-tile glass">
            <span className="stat-label">
              <UsersIcon className="stat-status-icon" /> Без исполнителя
            </span>
            <span className="stat-value">{totals.unassigned}</span>
          </div>
          <div className="stat-tile glass">
            <span className="stat-label">Подзадачи</span>
            <span className="stat-value">
              {totals.subtasksDone}
              <span className="stat-value-of"> / {totals.subtasks}</span>
            </span>
          </div>
        </div>
      </section>

      {/* ---------- участники ---------- */}
      <section className="stats-card glass">
        <div className="stats-card-head">
          <h2 className="section-title">Распределение по участникам</h2>
          <span className="stats-card-hint">выполнено из назначенных</span>
        </div>

        <ul className="meter-list">
          {members.map((m) => (
            <li key={m.user.id} className="meter-row">
              <Link to={`/users/${m.user.id}`} className="meter-who">
                <span className="avatar" style={{ width: 34, height: 34, fontSize: 13 }}>
                  {getInitials(m.user.name)}
                </span>
                <span className="meter-name">
                  {m.user.name}
                  <small>{m.role === "OWNER" ? "Владелец" : "Участник"}</small>
                </span>
              </Link>

              <div
                className="meter meter-row-bar"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={m.assigned}
                aria-valuenow={m.completed}
                aria-label={`${m.user.name}: выполнено ${m.completed} из ${m.assigned}`}
                onMouseMove={(e) =>
                  showTip(e, m.user.name, [
                    `Назначено: ${m.assigned}`,
                    `Выполнено: ${m.completed}`,
                    `В работе: ${m.open}`,
                    `Заблокировано: ${m.blocked}`,
                    `Подзадачи: ${m.subtasksDone} / ${m.subtasksAssigned}`,
                  ])
                }
                onMouseLeave={hideTip}
              >
                <span style={{ width: `${percent(m.completed, m.assigned)}%` }} />
              </div>

              <span className="meter-figure">
                {m.completed}
                <span className="muted"> / {m.assigned}</span>
              </span>

              <div className="meter-tags">
                {m.blocked > 0 && (
                  <span className="badge badge-warning">
                    <LockIcon width={12} height={12} /> {m.blocked} ждут
                  </span>
                )}
                {m.subtasksAssigned > 0 && (
                  <span className="badge">
                    подзадачи {m.subtasksDone}/{m.subtasksAssigned}
                  </span>
                )}
                {m.responsibleFor.map((c) => (
                  <span key={c.id} className="badge badge-accent" title="Ответственный за колонку">
                    {c.name}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="stats-grid">
        {/* ---------- колонки ---------- */}
        <section className="stats-card glass">
          <div className="stats-card-head">
            <h2 className="section-title">Задачи по колонкам</h2>
            <div className="legend">
              <span><i className="legend-swatch done" /> Выполнено</span>
              <span><i className="legend-swatch open" /> Открыто</span>
            </div>
          </div>

          {byColumn.length === 0 ? (
            <p className="muted">В проекте пока нет колонок</p>
          ) : (
            <ul className="hbars">
              {byColumn.map((c) => {
                const open = c.total - c.completed;
                return (
                  <li key={c.id} className="hbar-row">
                    <span className="hbar-label">
                      {c.isDone && <CheckIcon className="hbar-done-icon" aria-label="Колонка «Готово»" />}
                      {c.name}
                    </span>
                    <div
                      className="hbar-track"
                      onMouseMove={(e) =>
                        showTip(e, c.name, [
                          `Всего: ${c.total}`,
                          `Выполнено: ${c.completed}`,
                          `Открыто: ${open}`,
                          c.responsible ? `Ответственный: ${c.responsible.name}` : "Без ответственного",
                        ])
                      }
                      onMouseLeave={hideTip}
                    >
                      <div className="hbar" style={{ width: `${(c.total / maxColumn) * 100}%` }}>
                        {c.completed > 0 && <span className="hbar-seg done" style={{ flex: c.completed }} />}
                        {open > 0 && <span className="hbar-seg open" style={{ flex: open }} />}
                      </div>
                      <span className="hbar-value">{c.total}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ---------- активность ---------- */}
        <section className="stats-card glass">
          <div className="stats-card-head">
            <h2 className="section-title">Выполнено за 14 дней</h2>
            <span className="stats-card-hint">{doneLast14} задач</span>
          </div>

          <div className="columns-chart" aria-hidden>
            <div className="columns-max">{maxDay}</div>
            <div className="columns-plot">
              {activity.map((d) => (
                <div
                  key={d.date}
                  className="column-slot"
                  onMouseMove={(e) => showTip(e, shortDate(d.date), [`Выполнено: ${d.completed}`])}
                  onMouseLeave={hideTip}
                >
                  <span
                    className="column-bar"
                    style={{ height: `${(d.completed / maxDay) * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="columns-axis">
              {activity.map((d, i) => (
                <span key={d.date}>
                  {/* каждая третья дата, считая от сегодняшней, — подписи не налезают */}
                  {(activity.length - 1 - i) % 3 === 0 ? shortDate(d.date) : ""}
                </span>
              ))}
            </div>
          </div>

          {/* табличное представление для скринридеров */}
          <table className="visually-hidden">
            <caption>Выполнено задач по дням</caption>
            <tbody>
              {activity.map((d) => (
                <tr key={d.date}>
                  <th scope="row">{shortDate(d.date)}</th>
                  <td>{d.completed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {tip && (
        <div className="chart-tip" style={{ left: tip.x, top: tip.y }} role="tooltip">
          <strong>{tip.title}</strong>
          {tip.lines.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
};
