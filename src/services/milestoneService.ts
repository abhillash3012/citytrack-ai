import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Milestone } from '../types';

export interface DbMilestonePayload {
  id?: string;
  project_id: string;
  name: string;
  description?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  status: 'Planning' | 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  progress: number;
  is_overdue: boolean;
}

export async function getMilestonesByProjectId(projectId: string): Promise<Milestone[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('planned_end_date', { ascending: true });

    if (error) {
      console.warn('Error fetching milestones from Supabase:', error.message);
      return [];
    }

    return (data || []).map(m => ({
      id: m.id,
      name: m.name,
      category: 'Construction',
      targetDate: m.planned_end_date || '',
      actualDate: m.actual_end_date,
      status: m.status as any,
      weightPercentage: Number(m.progress || 15)
    }));
  } catch (err) {
    console.error('Error in getMilestonesByProjectId:', err);
    return [];
  }
}

export async function createMilestone(milestone: DbMilestonePayload): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { error } = await supabase.from('milestones').insert(milestone);
    if (error) {
      console.warn('Error creating milestone:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error creating milestone:', err);
    return false;
  }
}

export async function updateMilestone(id: string, updates: Partial<DbMilestonePayload>): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { error } = await supabase.from('milestones').update(updates).eq('id', id);
    if (error) {
      console.warn('Error updating milestone:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error updating milestone:', err);
    return false;
  }
}

export async function deleteMilestone(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { error } = await supabase.from('milestones').delete().eq('id', id);
    return !error;
  } catch (err) {
    return false;
  }
}
