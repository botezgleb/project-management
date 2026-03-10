export interface AccessJwtPayload {
  userId: number;
  role: string;
  email: string;
  name: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
}
