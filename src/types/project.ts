export interface CreateProjectData {
  name: string;
  description?: string;
  type: 'SINGLE' | 'ORGANIZATION';
}

export interface InviteUserData {
  email: string;
  role: 'ADMIN' | 'MEMBER';
}