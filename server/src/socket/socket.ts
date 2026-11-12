import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import "dotenv/config";
import type { AccessJwtPayload } from "../types/consts";

let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-project", (projectId: number) => {
      console.log("JOIN PROJECT", projectId);
      socket.join(`project-${projectId}`);
    });

    socket.on("leave-project", (projectId: number) => {
      socket.leave(`project-${projectId}`);
    });

    // личная комната пользователя — для уведомлений (заявки, добавление в проект)
    socket.on("authenticate", (token: unknown) => {
      for (const room of socket.rooms) {
        if (room.startsWith("user-")) socket.leave(room);
      }

      if (typeof token !== "string" || !process.env.ACCESS_SECRET_KEY) return;

      try {
        const decoded = jwt.verify(
          token,
          process.env.ACCESS_SECRET_KEY,
        ) as AccessJwtPayload;
        socket.join(`user-${decoded.userId}`);
      } catch {
        socket.emit("auth-error");
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};

export const getIO = () => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};


export const notifyUser = (userId: number, event: string, payload?: unknown) => {
  if (!io) return;
  io.to(`user-${userId}`).emit(event, payload);
};
