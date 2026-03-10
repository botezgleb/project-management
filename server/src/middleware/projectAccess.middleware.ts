import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";

export const projectAccessMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const projectId = Number(req.params.projectId);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" })
    }

    const projectMember = await prisma.projectMember.findFirst({
      where: {
        userId,
        projectId,
      },
    });

    if (!projectMember) {
      return res.status(403).json({ message: "Нет доступа к проекту" });
    }

    req.projectRole = projectMember.role;

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ошибка доступа к проекту" });
  }
};