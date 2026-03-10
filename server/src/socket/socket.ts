import { Server } from "socket.io";

let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-project", (projectId: number) => {
      socket.join(`project-${projectId}`);
    });

    socket.on("leave-project", (projectId: number) => {
      socket.leave(`project-${projectId}`);
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