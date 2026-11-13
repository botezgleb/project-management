import { prisma } from "../utils/prisma";
import { taskInclude, toTaskDTO } from "./taskDto";

const publicUser = { id: true, name: true, username: true } as const;
const DAY = 24 * 60 * 60 * 1000;

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export const getProjectStatsService = async (projectId: number) => {
  const [columns, tasks, members] = await Promise.all([
    prisma.column.findMany({
      where: { projectId },
      orderBy: { position: "asc" },
      select: { id: true, name: true, isDone: true, responsible: { select: publicUser } },
    }),
    prisma.task.findMany({
      where: { column: { projectId } },
      select: {
        id: true,
        columnId: true,
        completed: true,
        completedAt: true,
        taskAssignees: { select: { userId: true } },
        blockedBy: { select: { dependsOn: { select: { completed: true } } } },
        subtasks: { select: { completed: true, assigneeId: true } },
      },
    }),
    prisma.projectMember.findMany({
      where: { projectId },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: { role: true, user: { select: publicUser } },
    }),
  ]);

  const isBlocked = (t: (typeof tasks)[number]) =>
    !t.completed && t.blockedBy.some((d) => !d.dependsOn.completed);

  const allSubtasks = tasks.flatMap((t) => t.subtasks);
  const completedCount = tasks.filter((t) => t.completed).length;

  const totals = {
    tasks: tasks.length,
    completed: completedCount,
    open: tasks.length - completedCount,
    blocked: tasks.filter(isBlocked).length,
    unassigned: tasks.filter((t) => !t.completed && t.taskAssignees.length === 0).length,
    subtasks: allSubtasks.length,
    subtasksDone: allSubtasks.filter((s) => s.completed).length,
    completionRate: tasks.length ? completedCount / tasks.length : 0,
  };

  const byColumn = columns.map((c) => {
    const inColumn = tasks.filter((t) => t.columnId === c.id);
    return {
      id: c.id,
      name: c.name,
      isDone: c.isDone,
      responsible: c.responsible,
      total: inColumn.length,
      completed: inColumn.filter((t) => t.completed).length,
    };
  });

  const byMember = members.map(({ role, user }) => {
    const mine = tasks.filter((t) => t.taskAssignees.some((a) => a.userId === user.id));
    const mySubtasks = allSubtasks.filter((s) => s.assigneeId === user.id);
    const done = mine.filter((t) => t.completed).length;
    return {
      user,
      role,
      assigned: mine.length,
      completed: done,
      open: mine.length - done,
      blocked: mine.filter(isBlocked).length,
      subtasksAssigned: mySubtasks.length,
      subtasksDone: mySubtasks.filter((s) => s.completed).length,
      responsibleFor: columns
        .filter((c) => c.responsible?.id === user.id)
        .map((c) => ({ id: c.id, name: c.name })),
    };
  });

  // выполнено по дням за последние 14 дней
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const activity = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(today.getTime() - (13 - i) * DAY);
    return { date: dayKey(date), completed: 0 };
  });
  const index = new Map(activity.map((a, i) => [a.date, i]));
  tasks.forEach((t) => {
    if (!t.completed || !t.completedAt) return;
    const i = index.get(dayKey(t.completedAt));
    const day = i !== undefined ? activity[i] : undefined;
    if (day) day.completed += 1;
  });

  return { totals, byColumn, byMember, activity };
};

export const getMyTasksService = async (userId: number) => {
  const [tasks, subtasks] = await Promise.all([
    prisma.task.findMany({
      where: { taskAssignees: { some: { userId } } },
      include: {
        ...taskInclude,
        column: {
          select: { id: true, name: true, isDone: true, project: { select: { id: true, name: true } } },
        },
      },
      orderBy: [{ completed: "asc" }, { createdAt: "desc" }],
    }),
    prisma.subtask.findMany({
      where: { assigneeId: userId },
      select: {
        id: true,
        title: true,
        completed: true,
        task: {
          select: {
            id: true,
            title: true,
            column: { select: { project: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: [{ completed: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  return {
    tasks: tasks.map((t) => ({
      ...toTaskDTO(t),
      column: { id: t.column.id, name: t.column.name, isDone: t.column.isDone },
      project: t.column.project,
    })),
    subtasks: subtasks.map((s) => ({
      id: s.id,
      title: s.title,
      completed: s.completed,
      task: { id: s.task.id, title: s.task.title },
      project: s.task.column.project,
    })),
  };
};
