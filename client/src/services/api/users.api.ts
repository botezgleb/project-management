import api from "./api";
import type {
  Profile,
  PublicProfile,
  UpdateProfilePayload,
} from "../../types/profile";

export const getProfileApi = async (): Promise<Profile> => {
  const response = await api.get("/users/me");

  return response.data;
};

export const updateProfileApi = async (
  data: UpdateProfilePayload,
): Promise<Profile> => {
  const response = await api.patch("/users/me", data);

  return response.data;
};

export const getPublicProfileApi = async (
  userId: number,
): Promise<PublicProfile> => {
  const response = await api.get(`/users/${userId}`);

  return response.data;
};
