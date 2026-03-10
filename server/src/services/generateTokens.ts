import jwt from "jsonwebtoken";
import "dotenv/config";

const accessSecretKey = process.env.ACCESS_SECRET_KEY;
const refreshSecretKey = process.env.REFRESH_SECRET_KEY;

const generateAccessToken = (payload: object) => {
  if (!accessSecretKey) {
    throw new Error("JWT секрет не определен");
  }

  return jwt.sign(payload, accessSecretKey, { expiresIn: "15m" });
}

const generateRefreshToken = (payload: object) => {
  if (!refreshSecretKey) {
    throw new Error("JWT секрет не определен");
  }

  return jwt.sign(payload, refreshSecretKey, { expiresIn: "14d" });
}

export { generateAccessToken, generateRefreshToken };