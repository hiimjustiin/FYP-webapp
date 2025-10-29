import { api } from '../lib/api';

export interface Notification {
  id: string;
  type: 'submission_received' | 'scoring_complete' | 'review_complete' | 'general';
  title: string;
  message: string;
  related_submission_id?: string;
  related_course_id?: string;
  related_project_id?: string;
  is_read: boolean;
  created_at: string;
}

export const notificationService = {
  async getNotifications(limit: number = 20): Promise<Notification[]> {
    const data = await api.get<{ notifications: Notification[] }>(`/notifications?limit=${limit}`);
    return data.notifications;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await api.put(`/notifications/${notificationId}/read`, {});
  },

  async markAllAsRead(): Promise<void> {
    await api.put('/notifications/read-all', {});
  },
};
