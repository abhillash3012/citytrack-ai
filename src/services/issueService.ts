import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Issue } from '../types';

export async function getIssuesByProjectId(projectId: string): Promise<Issue[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching issues:', error.message);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      projectId: row.project_id,
      projectName: row.title,
      reportedBy: row.reported_by || 'Officer',
      reportedAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
      type: row.issue_type as any,
      severity: row.severity,
      status: row.status,
      description: row.description,
      assignedTo: row.assigned_to,
      resolutionNotes: row.resolution
    }));
  } catch (err) {
    console.error('Error in getIssuesByProjectId:', err);
    return [];
  }
}

export async function createIssue(issue: Omit<Issue, 'id' | 'reportedAt'>): Promise<Issue> {
  const issueId = `ISS-${Date.now()}`;
  const reportedAt = new Date().toISOString().split('T')[0];

  const newIssue: Issue = {
    ...issue,
    id: issueId,
    reportedAt
  };

  if (isSupabaseConfigured) {
    try {
      await supabase.from('issues').insert({
        project_id: issue.projectId,
        issue_type: issue.type,
        title: issue.description.slice(0, 60),
        description: issue.description,
        severity: issue.severity,
        status: issue.status || 'Open',
        reported_by: null,
        assigned_to: null
      });

      // If High or Critical severity, create alert
      if (issue.severity === 'High' || issue.severity === 'Critical') {
        try {
          await supabase.from('alerts').insert({
            project_id: issue.projectId,
            title: `High Severity Issue: ${issue.projectName}`,
            message: `${issue.type} reported: ${issue.description}`,
            severity: issue.severity === 'Critical' ? 'Critical' : 'Warning',
            alert_type: 'Issue Escalated',
            is_read: false
          });
        } catch (e) {
          console.warn('Notice creating alert for issue:', e);
        }
      }

      // Add audit log
      try {
        await supabase.from('audit_logs').insert({
          action: 'Issue Created',
          project_id: issue.projectId,
          entity_type: 'issues',
          description: `New issue registered: ${issue.type} (${issue.severity} severity).`,
          metadata: { severity: issue.severity, type: issue.type }
        });
      } catch (e) {
        console.warn('Notice creating audit log for issue:', e);
      }
    } catch (err) {
      console.warn('Error saving issue to Supabase:', err);
    }
  }

  return newIssue;
}

export async function resolveIssue(issueId: string, resolutionNotes?: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase
      .from('issues')
      .update({
        status: 'Resolved',
        resolution: resolutionNotes || 'Resolved by site management.',
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', issueId);

    if (error) {
      console.warn('Error resolving issue in Supabase:', error.message);
      return false;
    }

    try {
      await supabase.from('audit_logs').insert({
        action: 'Issue Resolved',
        entity_type: 'issues',
        entity_id: issueId,
        description: `Issue ${issueId} resolved. Notes: ${resolutionNotes || 'None'}`
      });
    } catch (e) {
      console.warn('Notice creating audit log:', e);
    }

    return true;
  } catch (err) {
    return false;
  }
}
