import app from "./app";
import http from "http";
import { initSocket } from "./socket/socket";

const PORT = process.env.SERVER_PORT;

const start = async () => {
  try {
    const server = http.createServer(app);

    initSocket(server);

    server.listen(PORT, () => {
      console.log(`Server is running on: http://localhost:${PORT}`);
    });
    
  } catch (error) {
    console.error("Errorr starting the server:", error);
  }
};

start();
