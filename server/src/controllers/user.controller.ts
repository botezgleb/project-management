import { Request, Response } from "express";
import {
  getProfileService,
  getPublicProfileService,
  updateProfileService,
} from "../services/user.service";

export const getProfileController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    const result = await getProfileService(userId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const updateProfileController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    const { name, username } = req.body;
    const result = await updateProfileService(userId, { name, username });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const getPublicProfileController = async (req: Request, res: Response) => {
  try {
    const viewerId = req.user?.userId;

    if (!viewerId) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    const result = await getPublicProfileService(viewerId, req.params.userId);
    return res.status(200).json(result);
  } catch (error) {
    const message = (error as Error).message;
    const status = message === "Пользователь не найден" ? 404 : 400;
    return res.status(status).json({ message });
  }
};
