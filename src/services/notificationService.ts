import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DbNotification } from '../types/database';

export interface AppNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  projectId?: string;
  createdAt: string;
}

export async function getNotifications(userId?: string): Promise<AppNotification[]> {
  if (!isSupabaseConfigured) return [];

  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching notifications:', error.message);
      return [];
    }

    return (data || []).map((row: DbNotification) => ({
      id: row.id,
      userId: row.user_id || undefined,
      title: row.title,
      message: row.message,
      type: row.type,
      isRead: row.is_read,
      projectId: row.project_id || undefined,
      createdAt: row.created_at
    }));
  } catch (err) {
    return [];
  }
}

export async function createNotification(notif: Omit<AppNotification, 'id' | 'createdAt'>): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: notif.userId || null,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      is_read: notif.isRead || false,
      project_id: notif.projectId || null
    });

    return !error;
  } catch (err) {
    return false;
  }
}

export async function markNotificationRead(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    return !error;
  } catch (err) {
    return false;
  }
}

export function subscribeNotifications(callback: (notifications: AppNotification[]) => void) {
  if (!isSupabaseConfigured) return () => {};

  try {
    const channel = supabase
      .channel('notifications_realtime_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        async () => {
          const fresh = await getNotifications();
          callback(fresh);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    return () => {};
  }
}
