import { Request, Response } from "express";
import {
  createProjectService,
  deleteProjectService,
  getOneProjectService,
  getProjectsService,
  updateProjectService,
} from "../services/project.service";
import { UpdateProjectData } from "../types/consts";

export const createProjectController = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const ownerId = req.user?.userId;

    if (!ownerId) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    const result = await createProjectService(name, description, ownerId);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const getProjectsController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (userId !== undefined) {
      const result = await getProjectsService(userId);
      return res.status(200).json(result);
    } else {
      return res.status(401).json({ message: "Нет ID пользователя" });
    }
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const getOneProjectController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const projectId = Number(req.params.id);

    if (!userId) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }
    if (!projectId || isNaN(projectId)) {
      return res.status(400).json({ message: "Невалидный ID проекта" });
    }

    const result = await getOneProjectService(userId, projectId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteProjectController = async (req: Request, res: Response) => {
  try {
    const projectId = Number(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Невалидный ID проекта" });
    }
    const result = await deleteProjectService(projectId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const updateProjectController = async (req: Request, res: Response) => {
  try {
    const projectId = Number(req.params.projectId);
    const data: UpdateProjectData = req.body;

    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Невалидный ID проекта" });
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "Нет данных для обновления" });
    }

    const result = await updateProjectService(projectId, data);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};
