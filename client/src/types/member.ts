import type { PublicUser } from "./friends";

export interface ProjectMember extends PublicUser {
  role: "OWNER" | "MEMBER";
  joinedAt: string;
}

export interface ProjectEvent {
  project: { id: number; name: string } | null;
  by: PublicUser | null;
}
