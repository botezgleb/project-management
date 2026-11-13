import { Request, Response } from "express";
import {
  createColumnService,
  getColumnsService,
  updateColumnService,
  assignAllColumnTasksService,
  deleteColumnService,
  reorderColumnsService,
} from "../services/column.service";

export const createColumnController = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Название проекта обязательно!" });
    }

    const projectId = Number(req.params.projectId);

    if (!projectId) {
      return res.status(404).json({ message: "Проект не найден" });
    }

    const result = await createColumnService(projectId, name);
    return res.status(201).json(result);
  } catch (error) {
    console.error("Create column error:", error);
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const getColumnsController = async (req: Request, res: Response) => {
  try {
    const projectId = Number(req.params.projectId);

    if (!projectId) {
      return res.status(404).json({ message: "Проект не найден" });
    }

    const result = await getColumnsService(projectId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const updateColumnController = async (req: Request, res: Response) => {
  try {
    const projectId = Number(req.params.projectId);
    const columnId = Number(req.params.columnId);
    const { name, isDone, responsibleId } = req.body ?? {};

    const result = await updateColumnService(
      projectId,
      columnId,
      { name, isDone, responsibleId },
      req.user?.userId,
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const assignAllColumnTasksController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Необходима авторизация" });

    const result = await assignAllColumnTasksService(
      Number(req.params.projectId),
      Number(req.params.columnId),
      req.body?.userId,
      userId,
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteColumnController = async (req: Request, res: Response) => {
  try {
    const projectId = Number(req.params.projectId);
    const columnId = Number(req.params.columnId);

    const result = await deleteColumnService(projectId, columnId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const reorderColumnsController = async (req: Request, res: Response) => {
  try {
    const projectId = Number(req.params.projectId);
    const { columns } = req.body;

    const result = await reorderColumnsService(projectId, columns);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Reorder columns controller error:", error);
    return res.status(400).json({ message: (error as Error).message });
  }
};