import express from "express";
import "dotenv/config";
import cors from "cors";
import authRouter from "./routes/auth.route";
import projectRouter from "./routes/project.route";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRouter);
app.use('/api/projects', projectRouter);

export default app;
