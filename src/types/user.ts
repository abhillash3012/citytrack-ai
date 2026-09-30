import { UserRole } from './index';

export interface Profile {
  id: string; // matches auth.users.id
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  department?: string;
  designation?: string;
  organization?: string;
  status: 'Active' | 'Inactive';
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSessionUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone?: string;
}
