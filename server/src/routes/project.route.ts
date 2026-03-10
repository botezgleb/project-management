import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { projectAccessMiddleware } from "../middleware/projectAccess.middleware";
import { projectRoleMiddleware } from "../middleware/projectRole.middleware";
import {
  createProjectController,
  getProjectsController,
  getOneProjectController,
  deleteProjectController,
  updateProjectController,
} from "../controllers/project.controller";
import {
  createColumnController,
  getColumnsController,
  updateColumnController,
  deleteColumnController,
  reorderColumnsController,
} from "../controllers/column.controller";
import { ProjectRole } from "@prisma/client";
import {
  createTaskController,
  deleteTaskController,
  getTasksController,
  reorderTaskController,
  updateTaskController,
} from "../controllers/task.controller";

const router = Router();

// проекты
router.post("/", authMiddleware, createProjectController);
router.get("/", authMiddleware, getProjectsController);
router.get(
  "/:projectId",
  authMiddleware,
  projectAccessMiddleware,
  getOneProjectController,
);
router.delete(
  "/:projectId",
  authMiddleware,
  projectAccessMiddleware,
  projectRoleMiddleware([ProjectRole.OWNER]),
  deleteProjectController,
);
router.patch(
  "/:projectId",
  authMiddleware,
  projectAccessMiddleware,
  projectRoleMiddleware([ProjectRole.OWNER]),
  updateProjectController,
);

// колонки
router.post(
  "/:projectId/column",
  authMiddleware,
  projectAccessMiddleware,
  createColumnController,
);
router.get(
  "/:projectId/columns",
  authMiddleware,
  projectAccessMiddleware,
  getColumnsController,
);
router.patch(
  "/:projectId/column/:columnId",
  authMiddleware,
  projectAccessMiddleware,
  updateColumnController,
);
router.delete(
  "/:projectId/column/:columnId",
  authMiddleware,
  projectAccessMiddleware,
  deleteColumnController,
);
router.patch(
  "/:projectId/columns/reorder",
  authMiddleware,
  projectAccessMiddleware,
  reorderColumnsController,
);

// задачи
router.post(
  "/:projectId/column/:columnId",
  authMiddleware,
  projectAccessMiddleware,
  createTaskController,
);
router.get(
  "/:projectId/column/:columnId",
  authMiddleware,
  projectAccessMiddleware,
  getTasksController,
);
router.put(
  "/:projectId/column/:columnId/:taskId",
  authMiddleware,
  projectAccessMiddleware,
  updateTaskController,
);
router.delete(
  "/:projectId/column/:columnId/:taskId",
  authMiddleware,
  projectAccessMiddleware,
  deleteTaskController,
);
router.patch(
  "/:projectId/column/:columnId/:taskId",
  authMiddleware,
  projectAccessMiddleware,
  reorderTaskController,
);

export default router;
