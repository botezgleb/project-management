import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { projectAccessMiddleware } from "../middleware/projectAccess.middleware";
import { projectRoleMiddleware } from "../middleware/projectRole.middleware";
import { columnAccessMiddleware } from "../middleware/columnAccess.middleware";
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
  assignAllColumnTasksController,
} from "../controllers/column.controller";
import { ProjectRole } from "@prisma/client";
import {
  createTaskController,
  deleteTaskController,
  getTasksController,
  reorderTaskController,
  updateTaskController,
} from "../controllers/task.controller";

import {
  addDependencyController,
  createSubtaskController,
  deleteSubtaskController,
  getProjectStatsController,
  getTaskDetailsController,
  removeDependencyController,
  updateSubtaskController,
  updateTaskMetaController,
} from "../controllers/workflow.controller";
import {
  addMemberController,
  getMembersController,
  removeMemberController,
} from "../controllers/member.controller";

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

// участники
router.get(
  "/:projectId/members",
  authMiddleware,
  projectAccessMiddleware,
  getMembersController,
);
router.post(
  "/:projectId/members",
  authMiddleware,
  projectAccessMiddleware,
  projectRoleMiddleware([ProjectRole.OWNER]),
  addMemberController,
);
router.delete(
  "/:projectId/members/:userId",
  authMiddleware,
  projectAccessMiddleware,
  removeMemberController,
);

// статистика
router.get(
  "/:projectId/stats",
  authMiddleware,
  projectAccessMiddleware,
  getProjectStatsController,
);

// задачи: детали, выполнение, перенос, исполнители
router.get("/:projectId/tasks/:taskId", authMiddleware, projectAccessMiddleware, getTaskDetailsController);
router.patch("/:projectId/tasks/:taskId", authMiddleware, projectAccessMiddleware, updateTaskMetaController);

// подзадачи
router.post("/:projectId/tasks/:taskId/subtasks", authMiddleware, projectAccessMiddleware, createSubtaskController);
router.patch("/:projectId/subtasks/:subtaskId", authMiddleware, projectAccessMiddleware, updateSubtaskController);
router.delete("/:projectId/subtasks/:subtaskId", authMiddleware, projectAccessMiddleware, deleteSubtaskController);

// зависимости
router.post("/:projectId/tasks/:taskId/dependencies", authMiddleware, projectAccessMiddleware, addDependencyController);
router.delete(
  "/:projectId/tasks/:taskId/dependencies/:dependsOnId",
  authMiddleware,
  projectAccessMiddleware,
  removeDependencyController,
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
  columnAccessMiddleware,
  updateColumnController,
);
router.delete(
  "/:projectId/column/:columnId",
  authMiddleware,
  projectAccessMiddleware,
  columnAccessMiddleware,
  deleteColumnController,
);
router.post(
  "/:projectId/column/:columnId/assign-all",
  authMiddleware,
  projectAccessMiddleware,
  columnAccessMiddleware,
  assignAllColumnTasksController,
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
  columnAccessMiddleware,
  createTaskController,
);
router.get(
  "/:projectId/column/:columnId",
  authMiddleware,
  projectAccessMiddleware,
  columnAccessMiddleware,
  getTasksController,
);
router.put(
  "/:projectId/column/:columnId/:taskId",
  authMiddleware,
  projectAccessMiddleware,
  columnAccessMiddleware,
  updateTaskController,
);
router.delete(
  "/:projectId/column/:columnId/:taskId",
  authMiddleware,
  projectAccessMiddleware,
  columnAccessMiddleware,
  deleteTaskController,
);
router.patch(
  "/:projectId/column/:columnId/:taskId",
  authMiddleware,
  projectAccessMiddleware,
  columnAccessMiddleware,
  reorderTaskController,
);

export default router;
