import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuditLog } from '../types';
import { MOCK_AUDIT_LOGS } from '../data/mockData';

export async function getAuditLogs(): Promise<AuditLog[]> {
  if (!isSupabaseConfigured) return MOCK_AUDIT_LOGS;

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.warn('Error fetching audit logs:', error.message);
      return MOCK_AUDIT_LOGS;
    }

    if (data && data.length > 0) {
      return data.map(row => ({
        id: row.id,
        user: row.metadata?.user || 'Government Official',
        role: row.metadata?.role || 'Administrator',
        action: row.action,
        projectId: row.project_id,
        timestamp: new Date(row.created_at).toLocaleString('en-IN'),
        ipAddress: row.metadata?.ipAddress || '10.20.40.105 (Verified Session)',
        device: row.metadata?.device || 'CityTrack Gov Portal',
        details: row.description
      }));
    }

    return MOCK_AUDIT_LOGS;
  } catch (err) {
    return MOCK_AUDIT_LOGS;
  }
}

export async function addAuditLog(log: AuditLog): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase.from('audit_logs').insert({
      action: log.action,
      project_id: log.projectId || null,
      entity_type: 'system',
      description: log.details || `${log.action} executed by ${log.user}`,
      metadata: {
        user: log.user,
        role: log.role,
        ipAddress: log.ipAddress,
        device: log.device,
        rawTimestamp: log.timestamp
      }
    });

    return !error;
  } catch (err) {
    return false;
  }
}

export function subscribeAuditLogs(callback: (logs: AuditLog[]) => void) {
  if (!isSupabaseConfigured) return () => {};

  try {
    const channel = supabase
      .channel('audit_logs_realtime_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'audit_logs' },
        async () => {
          const fresh = await getAuditLogs();
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
