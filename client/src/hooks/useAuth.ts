import { AuthContext } from "../contexts/auth/AuthContext";
import { useContext } from "react";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("Ошибка авторизации");
  }

  return context;
};
