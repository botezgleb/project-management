import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";

// Проверяет, что :columnId (и :taskId, если есть) принадлежат :projectId из URL.
// Без этого участник одного проекта мог менять задачи другого, подставив чужой columnId.
export const columnAccessMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projectId = Number(req.params.projectId);
    const columnId = Number(req.params.columnId);

    if (!Number.isInteger(columnId) || columnId <= 0) {
      return res.status(400).json({ message: "Невалидный ID колонки" });
    }

    const column = await prisma.column.findFirst({
      where: { id: columnId, projectId },
      select: { id: true },
    });

    if (!column) {
      return res.status(404).json({ message: "Колонка не найдена" });
    }

    if (req.params.taskId !== undefined) {
      const taskId = Number(req.params.taskId);
      const task = Number.isInteger(taskId)
        ? await prisma.task.findFirst({ where: { id: taskId, columnId }, select: { id: true } })
        : null;

      if (!task) {
        return res.status(404).json({ message: "Задача не найдена" });
      }
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Ошибка доступа к колонке" });
  }
};
