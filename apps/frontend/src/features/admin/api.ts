import { get, patch } from '@/lib/request';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  username: string | null;
  image: string | null;
  role: 'user' | 'admin';
  emailVerified: boolean;
  phoneNumber: string | null;
  phoneNumberVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDetail extends AdminUser {
  _count: {
    practiceRecords: number;
    mockExamRecords: number;
    vocabularyWords: number;
  };
}

export interface AdminUsersResult {
  list: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listUsers(params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
}) {
  return get<AdminUsersResult>('/admin/users', params);
}

export async function getUserDetail(id: string) {
  return get<AdminUserDetail>(`/admin/users/${id}`);
}

export async function updateUserRole(id: string, role: 'user' | 'admin') {
  return patch<AdminUser>(`/admin/users/${id}/role`, { role });
}
