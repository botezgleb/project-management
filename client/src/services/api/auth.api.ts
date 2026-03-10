import api from "./api";

export const loginApi = async (email: string, password: string) => {
  const response = await api.post("/auth/login", { email, password });

  return {
    accessToken: response.data.accessToken,
    user: response.data.user,
  };
};

export const registerApi = async (
  email: string,
  password: string,
  name: string,
) => {
  const response = await api.post("/auth/register", { email, password, name });

  return {
    accessToken: response.data.accessToken,
    user: response.data.user,
  };
};

export const meApi = async () => {
  const response = await api.get("/auth/me");

  return {
    id: response.data.id,
    email: response.data.email,
    role: response.data.role,
  };
};

export const refreshApi = async () => {
  const response = await api.post("/auth/refresh", {});
  return {
    accessToken: response.data.accessToken,
    user: response.data.user,
  };
};