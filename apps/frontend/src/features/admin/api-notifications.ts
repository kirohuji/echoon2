import { get, post } from '@/lib/request';

export interface AdminNotificationItem {
  id: string;
  title: string;
  content: string;
  type: 'broadcast' | 'targeted';
  sentById: string;
  sentBy: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
  _count: { reads: number; targets: number };
}

export interface AdminNotificationListResult {
  list: AdminNotificationItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SearchUserResult {
  id: string;
  email: string;
  name: string;
  username: string | null;
  image: string | null;
}

export async function listNotifications(params: {
  page?: number;
  pageSize?: number;
}) {
  return get<AdminNotificationListResult>('/admin/notifications', params);
}

export async function createNotification(data: {
  title: string;
  content: string;
  type: 'broadcast' | 'targeted';
  targetUserIds?: string[];
}) {
  return post('/admin/notifications', data);
}

export async function searchUsers(keyword: string) {
  return get<SearchUserResult[]>('/admin/notifications/search-users', { keyword });
}
