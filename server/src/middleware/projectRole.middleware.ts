import { Request, Response, NextFunction } from "express";
import { ProjectRole } from "@prisma/client";

export const projectRoleMiddleware = (allowedRoles: ProjectRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.projectRole;
    
    if (!role) {
      return res.status(403).json({ message: "Неизвестна роль пользователя" });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(418).json({ message: "Отказано в доступе" });
    }

    next();
  };
};
