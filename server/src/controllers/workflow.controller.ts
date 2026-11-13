import { Request, Response } from "express";
import {
  addDependencyService,
  createSubtaskService,
  deleteSubtaskService,
  getTaskDetailsService,
  removeDependencyService,
  updateSubtaskService,
  updateTaskMetaService,
} from "../services/workflow.service";
import { getMyTasksService, getProjectStatsService } from "../services/stats.service";

const handle =
  (fn: (req: Request, userId: number, projectId: number) => Promise<unknown>, status = 200) =>
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ message: "Необходима авторизация" });

      const result = await fn(req, userId, Number(req.params.projectId));
      return res.status(status).json(result);
    } catch (error) {
      const message = (error as Error).message;
      const code = /не найден/i.test(message) ? 404 : 400;
      return res.status(code).json({ message });
    }
  };

export const getTaskDetailsController = handle((req, _u, projectId) =>
  getTaskDetailsService(projectId, req.params.taskId),
);

export const updateTaskMetaController = handle((req, userId, projectId) =>
  updateTaskMetaService(projectId, req.params.taskId, req.body ?? {}, userId),
);

export const createSubtaskController = handle(
  (req, _u, projectId) => createSubtaskService(projectId, req.params.taskId, req.body ?? {}),
  201,
);

export const updateSubtaskController = handle((req, userId, projectId) =>
  updateSubtaskService(projectId, req.params.subtaskId, req.body ?? {}, userId),
);

export const deleteSubtaskController = handle((req, _u, projectId) =>
  deleteSubtaskService(projectId, req.params.subtaskId),
);

export const addDependencyController = handle(
  (req, _u, projectId) =>
    addDependencyService(projectId, req.params.taskId, req.body?.dependsOnId),
  201,
);

export const removeDependencyController = handle((req, _u, projectId) =>
  removeDependencyService(projectId, req.params.taskId, req.params.dependsOnId),
);

export const getProjectStatsController = handle((_req, _u, projectId) =>
  getProjectStatsService(projectId),
);

export const getMyTasksController = handle((_req, userId) => getMyTasksService(userId));
