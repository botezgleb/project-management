import type { Relation } from "./friends";

export interface ProfileStats {
  projects: number;
  ownedProjects: number;
  createdTasks: number;
  assignedTasks: number;
  friends: number;
  incomingRequests: number;
  outgoingRequests: number;
}

export interface ProfileProject {
  id: number;
  name: string;
  description: string | null;
  role: "OWNER" | "MEMBER";
  joinedAt: string;
}

export interface Profile {
  id: number;
  email: string;
  name: string;
  username: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
  stats: ProfileStats;
  projects: ProfileProject[];
}

export interface UpdateProfilePayload {
  name?: string;
  username?: string;
}

export interface PublicProfile {
  id: number;
  name: string;
  username: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
  email: string | null;
  isSelf: boolean;
  relation: Relation | null;
  stats: {
    projects: number;
    createdTasks: number;
    assignedTasks: number;
    friends: number;
  };
  mutualProjects: ProfileProject[];
}
