import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { FieldUpdate, FieldInspection } from '../types';

export interface SubmitFieldUpdateParams {
  projectId: string;
  projectName: string;
  officerName: string;
  officerId?: string;
  progress: number;
  remarks: string;
  latitude?: number;
  longitude?: number;
  location?: string;
  photoUrl?: string;
  photoPath?: string;
  issueReported?: boolean;
  issueSeverity?: 'Low' | 'Medium' | 'High' | 'Critical';
  aiData?: {
    aiVisualProgress?: number;
    aiDelayProbability?: number;
    aiRiskLevel?: any;
    predictedDelayDays?: number;
    aiExplanation?: string;
    aiGeneratedRemarks?: string;
    constructionActivity?: string;
    visibleWork?: string;
    workersEquipment?: string;
    materials?: string;
    siteCondition?: string;
    safetyConcerns?: string;
    qualityConcerns?: string;
    visualConfidence?: 'HIGH' | 'MEDIUM' | 'LOW';
    recommendations?: string[];
  };
}

/**
 * Submit field update record to Supabase `field_updates` and `inspections` tables
 */
export async function submitFieldUpdate(params: SubmitFieldUpdateParams): Promise<FieldUpdate> {
  const updateId = `FLD-${Date.now()}`;
  const timestamp = new Date().toLocaleString('en-IN');

  const newUpdate: FieldUpdate = {
    id: updateId,
    projectId: params.projectId,
    projectName: params.projectName,
    officerName: params.officerName,
    timestamp,
    latitude: params.latitude || 17.4000,
    longitude: params.longitude || 78.4500,
    reportedProgressPercentage: params.progress,
    photoUrl: params.photoUrl,
    remarks: params.remarks,
    issueReported: params.issueReported,
    issueSeverity: params.issueSeverity,
    aiVisualProgress: params.aiData?.aiVisualProgress,
    aiDelayProbability: params.aiData?.aiDelayProbability,
    aiRiskLevel: params.aiData?.aiRiskLevel,
    predictedDelayDays: params.aiData?.predictedDelayDays,
    aiExplanation: params.aiData?.aiExplanation,
    aiRecommendations: params.aiData?.recommendations
  };

  if (isSupabaseConfigured) {
    try {
      // 1. Insert into field_updates table
      await supabase.from('field_updates').insert({
        project_id: params.projectId,
        field_officer_id: params.officerId || null,
        progress: params.progress,
        remarks: params.remarks,
        latitude: params.latitude || null,
        longitude: params.longitude || null,
        location: params.location || null,
        photo_path: params.photoPath || null,
        photo_url: params.photoUrl || null,
        issue_reported: Boolean(params.issueReported)
      });

      // 2. Also insert into inspections table for visual inspection review pipeline
      if (params.aiData) {
        try {
          await supabase.from('inspections').insert({
            project_id: params.projectId,
            officer_id: params.officerId || null,
            reported_progress: params.progress,
            severity: params.issueSeverity || 'Low',
            ai_visual_progress: params.aiData.aiVisualProgress,
            ai_delay_probability: params.aiData.aiDelayProbability,
            ai_risk_level: params.aiData.aiRiskLevel,
            predicted_delay_days: params.aiData.predictedDelayDays,
            ai_explanation: params.aiData.aiExplanation,
            ai_generated_remarks: params.aiData.aiGeneratedRemarks,
            construction_activity: params.aiData.constructionActivity,
            visible_work: params.aiData.visibleWork,
            workers_equipment: params.aiData.workersEquipment,
            materials: params.aiData.materials,
            site_condition: params.aiData.siteCondition,
            safety_concerns: params.aiData.safetyConcerns,
            quality_concerns: params.aiData.qualityConcerns,
            visual_confidence: params.aiData.visualConfidence,
            current_image_url: params.photoUrl,
            status: 'SUBMITTED'
          });
        } catch (e) {
          console.warn('Notice saving to inspections table:', e);
        }
      }

      // 3. Insert notification for Project Manager
      try {
        await supabase.from('notifications').insert({
          title: `New Field Update: ${params.projectName}`,
          message: `${params.officerName} submitted site update: ${params.progress}% progress reported. ${params.remarks}`,
          type: 'field_update',
          project_id: params.projectId,
          is_read: false
        });
      } catch (e) {
        console.warn('Notice inserting field update notification:', e);
      }

      // 4. If critical or high issue was reported, trigger alert
      if (params.issueReported && (params.issueSeverity === 'High' || params.issueSeverity === 'Critical')) {
        try {
          await supabase.from('alerts').insert({
            project_id: params.projectId,
            title: `Critical Field Issue: ${params.projectName}`,
            message: `Field Officer reported ${params.issueSeverity} severity issue during site inspection. Immediate review required.`,
            severity: params.issueSeverity === 'Critical' ? 'Critical' : 'Warning',
            alert_type: 'Issue Escalated',
            is_read: false
          });
        } catch (e) {
          console.warn('Notice inserting issue alert:', e);
        }
      }

      // 5. Create audit log
      try {
        await supabase.from('audit_logs').insert({
          action: 'Field Update Submitted',
          project_id: params.projectId,
          entity_type: 'field_updates',
          description: `Field inspection submitted by ${params.officerName} with ${params.progress}% progress.`,
          metadata: {
            latitude: params.latitude,
            longitude: params.longitude,
            issueReported: params.issueReported
          }
        });
      } catch (e) {
        console.warn('Notice inserting audit log:', e);
      }

    } catch (err) {
      console.warn('Error syncing field update to Supabase:', err);
    }
  }

  return newUpdate;
}

/**
 * Fetch field updates for a project
 */
export async function getFieldUpdates(projectId: string): Promise<FieldUpdate[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('field_updates')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching field updates:', error.message);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      projectId: row.project_id,
      projectName: row.location || 'Project Site',
      officerName: 'Field Officer',
      timestamp: new Date(row.created_at).toLocaleString('en-IN'),
      latitude: Number(row.latitude || 17.4),
      longitude: Number(row.longitude || 78.4),
      reportedProgressPercentage: Number(row.progress || 0),
      photoUrl: row.photo_url,
      remarks: row.remarks || '',
      issueReported: Boolean(row.issue_reported)
    }));
  } catch (err) {
    return [];
  }
}
