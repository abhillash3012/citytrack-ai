import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AlertNotification } from '../types';
import { MOCK_ALERTS } from '../data/mockData';

export async function getAlerts(): Promise<AlertNotification[]> {
  if (!isSupabaseConfigured) return MOCK_ALERTS;

  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching alerts from Supabase:', error.message);
      return MOCK_ALERTS;
    }

    if (data && data.length > 0) {
      return data.map(row => ({
        id: row.id,
        projectId: row.project_id,
        title: row.title,
        message: row.message,
        severity: row.severity === 'Critical' ? 'Critical' : (row.severity === 'Warning' ? 'Warning' : 'Info'),
        timestamp: new Date(row.created_at).toLocaleString('en-IN'),
        isRead: Boolean(row.is_read),
        category: (row.alert_type as any) || 'AI Delay'
      }));
    }

    return MOCK_ALERTS;
  } catch (err) {
    return MOCK_ALERTS;
  }
}

export async function addAlert(alert: AlertNotification): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase.from('alerts').insert({
      project_id: alert.projectId || null,
      title: alert.title,
      message: alert.message,
      severity: alert.severity || 'Warning',
      alert_type: alert.category || 'AI Delay',
      is_read: alert.isRead || false
    });

    return !error;
  } catch (err) {
    return false;
  }
}

export async function markAlertRead(alertId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    return !error;
  } catch (err) {
    return false;
  }
}

export function subscribeAlerts(callback: (alerts: AlertNotification[]) => void) {
  if (!isSupabaseConfigured) return () => {};

  try {
    const channel = supabase
      .channel('alerts_realtime_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        async () => {
          const fresh = await getAlerts();
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
