import { createContext } from "react";

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  isAuth: boolean;
  user: User | null;
  loading: boolean;
  login: (accessToken: string, user: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
