import api from "./api";
import type {
  Colleague,
  FriendRequests,
  RelationStatus,
  UserSearchResult,
} from "../../types/friends";

export const getFriendsApi = async (): Promise<Colleague[]> => {
  const response = await api.get("/friends");
  return response.data;
};

export const searchUsersApi = async (q: string): Promise<UserSearchResult[]> => {
  const response = await api.get("/friends/search", { params: { q } });
  return response.data;
};

export const getFriendRequestsApi = async (): Promise<FriendRequests> => {
  const response = await api.get("/friends/requests");
  return response.data;
};

export const sendFriendRequestApi = async (
  receiverId: number,
): Promise<{ status: RelationStatus; requestId: number | null }> => {
  const response = await api.post("/friends/requests", { receiverId });
  return response.data;
};

export const acceptFriendRequestApi = async (requestId: number) => {
  const response = await api.post(`/friends/requests/${requestId}/accept`);
  return response.data;
};

export const rejectFriendRequestApi = async (requestId: number) => {
  const response = await api.post(`/friends/requests/${requestId}/reject`);
  return response.data;
};

export const cancelFriendRequestApi = async (requestId: number) => {
  const response = await api.delete(`/friends/requests/${requestId}`);
  return response.data;
};

export const removeFriendApi = async (friendId: number) => {
  const response = await api.delete(`/friends/${friendId}`);
  return response.data;
};
