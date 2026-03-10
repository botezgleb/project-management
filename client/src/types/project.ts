export interface Project {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  role: 'OWNER' | 'MEMBER' | undefined;
  owner: {
    id: number | undefined;
    name: string | undefined;
  };
  membersCount: number;
}