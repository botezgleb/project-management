import { prisma } from "../utils/prisma";
import { notifyUser } from "../socket/socket";
import { getTaskWithRelations } from "../repositories/task.repository";
import { toTaskDTO } from "./taskDto";
import { emitColumnTasks, emitProjectEvent, emitTaskUpdates } from "./taskEvents";
import {
  assertProjectMember,
  getProjectBrief,
  getTaskInProject,
  toPositiveInt,
} from "./projectGuards";

const publicUser = { id: true, name: true, username: true } as const;

/* ============================================================
   Детали задачи (для модалки)
   ============================================================ */
export const getTaskDetailsService = async (projectId: number, rawTaskId: unknown) => {
  const taskId = toPositiveInt(rawTaskId, "ID задачи");
  await getTaskInProject(projectId, taskId);

  const [task, subtasks, blockedBy, blocking] = await Promise.all([
    getTaskWithRelations(taskId),
    prisma.subtask.findMany({
      where: { taskId },
      select: {
        id: true,
        parentId: true,
        title: true,
        completed: true,
        position: true,
        assignee: { select: publicUser },
      },
      orderBy: [{ position: "asc" }, { id: "asc" }],
    }),
    prisma.taskDependency.findMany({
      where: { taskId },
      select: {
        dependsOn: {
          select: { id: true, title: true, completed: true, column: { select: { name: true } } },
        },
      },
    }),
    prisma.taskDependency.findMany({
      where: { dependsOnId: taskId },
      select: {
        task: {
          select: { id: true, title: true, completed: true, column: { select: { name: true } } },
        },
      },
    }),
  ]);

  const flatten = (t: { id: number; title: string; completed: boolean; column: { name: string } }) => ({
    id: t.id,
    title: t.title,
    completed: t.completed,
    columnName: t.column.name,
  });

  return {
    task: toTaskDTO(task!),
    subtasks,
    blockedBy: blockedBy.map((d) => flatten(d.dependsOn)),
    blocking: blocking.map((d) => flatten(d.task)),
  };
};

/* ============================================================
   Выполнение, перенос, исполнители
   ============================================================ */
export const updateTaskMetaService = async (
  projectId: number,
  rawTaskId: unknown,
  input: { completed?: unknown; columnId?: unknown; assigneeIds?: unknown },
  actorId: number,
) => {
  const taskId = toPositiveInt(rawTaskId, "ID задачи");
  const task = await getTaskInProject(projectId, taskId);
  let touched = false;
  const moved = input.columnId !== undefined && Number(input.columnId) !== task.columnId;

  // --- перенос в другую колонку ---
  if (moved) {
    const targetId = toPositiveInt(input.columnId, "ID колонки");
    const target = await prisma.column.findFirst({
      where: { id: targetId, projectId },
      select: { id: true, isDone: true },
    });
    if (!target) throw new Error("Колонка не найдена");

    await prisma.$transaction(async (tx) => {
      const max = await tx.task.aggregate({
        where: { columnId: targetId },
        _max: { position: true },
      });

      // финальная колонка закрывает задачу, выход из неё — открывает
      const completed = target.isDone ? true : task.column.isDone ? false : task.completed;

      await tx.task.update({
        where: { id: taskId },
        data: {
          columnId: targetId,
          position: (max._max.position ?? 0) + 1,
          completed,
          completedAt: completed ? (task.completedAt ?? new Date()) : null,
        },
      });

      // закрываем «дыру» в старой колонке. Сдвиг в два шага, иначе
      // уникальный индекс (columnId, position) ловит временный конфликт
      await tx.task.updateMany({
        where: { columnId: task.columnId, position: { gt: task.position } },
        data: { position: { increment: 100000 } },
      });
      await tx.task.updateMany({
        where: { columnId: task.columnId, position: { gt: 100000 } },
        data: { position: { decrement: 100001 } },
      });
    });

    // сначала колонка назначения: у клиента задача не «пропадает» ни на миг
    await emitColumnTasks(projectId, targetId);
    await emitColumnTasks(projectId, task.columnId);
    touched = true;
  }

  // --- галочка «выполнено» ---
  // при переносе статус уже выставлен правилом колонки
  if (input.completed !== undefined && !moved) {
    const completed = Boolean(input.completed);
    if (completed !== task.completed) {
      await prisma.task.update({
        where: { id: taskId },
        data: { completed, completedAt: completed ? new Date() : null },
      });
      touched = true;
    }
  }

  // --- исполнители (полная замена списка) ---
  if (input.assigneeIds !== undefined) {
    if (!Array.isArray(input.assigneeIds)) {
      throw new Error("assigneeIds должен быть массивом");
    }
    const ids = [...new Set(input.assigneeIds.map((v) => toPositiveInt(v, "ID исполнителя")))];

    const members = await prisma.projectMember.findMany({
      where: { projectId, userId: { in: ids } },
      select: { userId: true },
    });
    if (members.length !== ids.length) {
      throw new Error("Исполнителем может быть только участник проекта");
    }

    const before = await prisma.taskAssignee.findMany({
      where: { taskId },
      select: { userId: true },
    });

    await prisma.$transaction([
      prisma.taskAssignee.deleteMany({ where: { taskId, userId: { notIn: ids } } }),
      prisma.taskAssignee.createMany({
        data: ids.map((userId) => ({ taskId, userId })),
        skipDuplicates: true,
      }),
    ]);

    const beforeIds = new Set(before.map((b) => b.userId));
    const added = ids.filter((id) => !beforeIds.has(id) && id !== actorId);
    if (added.length) {
      const project = await getProjectBrief(projectId);
      added.forEach((userId) =>
        notifyUser(userId, "task:assigned", {
          task: { id: taskId, title: task.title },
          project,
        }),
      );
    }
    touched = true;
  }

  if (touched) await emitTaskUpdates(projectId, [taskId]);

  return toTaskDTO((await getTaskWithRelations(taskId))!);
};

/* ============================================================
   Подзадачи (дерево)
   ============================================================ */
const emitSubtasksChanged = async (projectId: number, taskId: number) => {
  emitProjectEvent(projectId, "subtasks-updated", { taskId });
  // счётчик «3/5» на карточке
  await emitTaskUpdates(projectId, [taskId]);
};

const getSubtaskInProject = async (projectId: number, subtaskId: number) => {
  const subtask = await prisma.subtask.findFirst({
    where: { id: subtaskId, task: { column: { projectId } } },
    include: { task: { select: { id: true, title: true } } },
  });
  if (!subtask) throw new Error("Подзадача не найдена");
  return subtask;
};

export const createSubtaskService = async (
  projectId: number,
  rawTaskId: unknown,
  input: { title?: unknown; parentId?: unknown },
) => {
  const taskId = toPositiveInt(rawTaskId, "ID задачи");
  await getTaskInProject(projectId, taskId);

  const title = String(input.title ?? "").trim();
  if (!title) throw new Error("Введите название подзадачи");
  if (title.length > 200) throw new Error("Слишком длинное название");

  let parentId: number | null = null;
  if (input.parentId !== undefined && input.parentId !== null) {
    parentId = toPositiveInt(input.parentId, "ID родительской подзадачи");
    const parent = await prisma.subtask.findFirst({ where: { id: parentId, taskId } });
    if (!parent) throw new Error("Родительская подзадача не найдена");
  }

  const max = await prisma.subtask.aggregate({
    where: { taskId, parentId },
    _max: { position: true },
  });

  const subtask = await prisma.subtask.create({
    data: { taskId, parentId, title, position: (max._max.position ?? 0) + 1 },
  });

  await emitSubtasksChanged(projectId, taskId);
  return subtask;
};

export const updateSubtaskService = async (
  projectId: number,
  rawSubtaskId: unknown,
  input: { title?: unknown; completed?: unknown; assigneeId?: unknown },
  actorId: number,
) => {
  const subtaskId = toPositiveInt(rawSubtaskId, "ID подзадачи");
  const subtask = await getSubtaskInProject(projectId, subtaskId);

  const data: { title?: string; completed?: boolean; assigneeId?: number | null } = {};

  if (input.title !== undefined) {
    const title = String(input.title).trim();
    if (!title) throw new Error("Введите название подзадачи");
    data.title = title;
  }

  if (input.completed !== undefined) data.completed = Boolean(input.completed);

  if (input.assigneeId !== undefined) {
    if (input.assigneeId === null) {
      data.assigneeId = null;
    } else {
      const assigneeId = toPositiveInt(input.assigneeId, "ID исполнителя");
      await assertProjectMember(projectId, assigneeId);
      data.assigneeId = assigneeId;
    }
  }

  if (Object.keys(data).length === 0) throw new Error("Нет данных для обновления");

  const updated = await prisma.subtask.update({ where: { id: subtaskId }, data });

  // закрыли родителя — закрываем и всю ветку под ним
  if (data.completed === true) {
    let frontier = [subtaskId];
    while (frontier.length) {
      const children = await prisma.subtask.findMany({
        where: { parentId: { in: frontier } },
        select: { id: true },
      });
      frontier = children.map((c) => c.id);
      if (frontier.length) {
        await prisma.subtask.updateMany({
          where: { id: { in: frontier } },
          data: { completed: true },
        });
      }
    }
  }

  if (data.assigneeId && data.assigneeId !== actorId && data.assigneeId !== subtask.assigneeId) {
    notifyUser(data.assigneeId, "subtask:assigned", {
      subtask: { id: subtaskId, title: updated.title },
      task: subtask.task,
      project: await getProjectBrief(projectId),
    });
  }

  await emitSubtasksChanged(projectId, subtask.taskId);
  return updated;
};

export const deleteSubtaskService = async (projectId: number, rawSubtaskId: unknown) => {
  const subtaskId = toPositiveInt(rawSubtaskId, "ID подзадачи");
  const subtask = await getSubtaskInProject(projectId, subtaskId);

  // дочерние удалятся каскадом
  await prisma.subtask.delete({ where: { id: subtaskId } });

  await emitSubtasksChanged(projectId, subtask.taskId);
  return { success: true };
};

/* ============================================================
   Зависимости
   ============================================================ */
// есть ли путь from → … → to по рёбрам «зависит от»
const dependsTransitively = async (fromTaskId: number, toTaskId: number) => {
  const seen = new Set<number>([fromTaskId]);
  let frontier = [fromTaskId];

  while (frontier.length) {
    const edges = await prisma.taskDependency.findMany({
      where: { taskId: { in: frontier } },
      select: { dependsOnId: true },
    });
    const next: number[] = [];
    for (const { dependsOnId } of edges) {
      if (dependsOnId === toTaskId) return true;
      if (!seen.has(dependsOnId)) {
        seen.add(dependsOnId);
        next.push(dependsOnId);
      }
    }
    frontier = next;
  }
  return false;
};

export const addDependencyService = async (
  projectId: number,
  rawTaskId: unknown,
  rawDependsOnId: unknown,
) => {
  const taskId = toPositiveInt(rawTaskId, "ID задачи");
  const dependsOnId = toPositiveInt(rawDependsOnId, "ID блокирующей задачи");

  if (taskId === dependsOnId) throw new Error("Задача не может зависеть от самой себя");

  await getTaskInProject(projectId, taskId);
  await getTaskInProject(projectId, dependsOnId);

  // A ждёт B, а B (через цепочку) уже ждёт A → цикл
  if (await dependsTransitively(dependsOnId, taskId)) {
    throw new Error("Получится цикл: эта задача уже (косвенно) ждёт текущую");
  }

  await prisma.taskDependency.upsert({
    where: { taskId_dependsOnId: { taskId, dependsOnId } },
    create: { taskId, dependsOnId },
    update: {},
  });

  await emitTaskUpdates(projectId, [taskId]);
  emitProjectEvent(projectId, "subtasks-updated", { taskId });
  emitProjectEvent(projectId, "subtasks-updated", { taskId: dependsOnId });
  return { success: true };
};

export const removeDependencyService = async (
  projectId: number,
  rawTaskId: unknown,
  rawDependsOnId: unknown,
) => {
  const taskId = toPositiveInt(rawTaskId, "ID задачи");
  const dependsOnId = toPositiveInt(rawDependsOnId, "ID блокирующей задачи");
  await getTaskInProject(projectId, taskId);

  await prisma.taskDependency.deleteMany({ where: { taskId, dependsOnId } });

  await emitTaskUpdates(projectId, [taskId]);
  emitProjectEvent(projectId, "subtasks-updated", { taskId });
  emitProjectEvent(projectId, "subtasks-updated", { taskId: dependsOnId });
  return { success: true };
};
