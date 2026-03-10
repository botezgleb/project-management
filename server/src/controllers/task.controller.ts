import { Request, Response } from "express";
import {
  createTaskService,
  deleteTaskService,
  getTasksService,
  reorderTaskService,
  updateTaskService,
} from "../services/task.service";

export const createTaskController = async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    const columnId = Number(req.params.columnId);
    const createdById = req.user?.userId;

    if (!createdById) {
      return res.status(401).json({ message: "Нет ID пользователя" });
    }

    const result = await createTaskService(
      title,
      description,
      columnId,
      createdById,
    );
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const getTasksController = async (req: Request, res: Response) => {
  try {
    const columnId = Number(req.params.columnId);
    const result = await getTasksService(columnId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const updateTaskController = async (req: Request, res: Response) => {
  try {
    const columnId = Number(req.params.columnId);
    const taskId = Number(req.params.taskId);
    const { title, description } = req.body;

    const result = await updateTaskService(
      columnId,
      taskId,
      title,
      description,
    );

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteTaskController = async (req: Request, res: Response) => {
  try {
    const columnId = Number(req.params.columnId);
    const taskId = Number(req.params.taskId);

    const result = await deleteTaskService(columnId, taskId);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const reorderTaskController = async (req: Request, res: Response) => {
  try {
    const columnId = Number(req.params.columnId);
    const taskId = Number(req.params.taskId);
    const { newPosition } = req.body;
    const newPositionNum = Number(newPosition);

    if (!Number.isInteger(newPositionNum) || newPositionNum < 1) {
      return res.status(400).json({ message: "Некорректная позиция" });
    }

    const result = await reorderTaskService(columnId, taskId, newPositionNum);
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: (error as Error).message });
  }
};