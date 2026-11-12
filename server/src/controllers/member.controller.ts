import { Request, Response } from "express";
import {
  addMemberService,
  getMembersService,
  removeMemberService,
} from "../services/member.service";

export const getMembersController = async (req: Request, res: Response) => {
  try {
    const result = await getMembersService(Number(req.params.projectId));
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const addMemberController = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?.userId;
    if (!ownerId) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    const result = await addMemberService(
      Number(req.params.projectId),
      ownerId,
      req.body?.userId,
    );
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const removeMemberController = async (req: Request, res: Response) => {
  try {
    const requesterId = req.user?.userId;
    if (!requesterId) {
      return res.status(401).json({ message: "Необходима авторизация" });
    }

    const result = await removeMemberService(
      Number(req.params.projectId),
      requesterId,
      req.projectRole,
      req.params.userId,
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};
