import express from "express";
import "dotenv/config";
import cors from "cors";

// routes
import authRouter from "./routes/auth.route";
import projectRouter from "./routes/project.route";
import cookieParser from "cookie-parser";
import friendsRouter from "./routes/friends.route";
import userRouter from "./routes/user.route";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);
app.use("/api/friends", friendsRouter);
app.use("/api/users", userRouter);

export default app;
