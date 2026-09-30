import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Project } from '../types';
import { 
  mapProjectToDb, 
  mapDbToProject, 
  fetchProjectsFromSupabase, 
  fetchProjectByIdSupabase, 
  saveProjectToSupabase, 
  updateProjectInSupabase, 
  deleteProjectFromSupabase,
  subscribeProjects as subscribeProjectsDb,
  toValidUuid
} from './supabase/databaseService';

export { mapProjectToDb, mapDbToProject };

/**
 * Fetch all projects from Supabase PostgreSQL (SELECT)
 */
export async function getProjects(): Promise<Project[]> {
  const result = await fetchProjectsFromSupabase();
  if (result.error) {
    console.error('getProjects error:', result.error);
    return [];
  }
  return result.data;
}

/**
 * Fetch a single project by ID (SELECT)
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
  const result = await fetchProjectByIdSupabase(projectId);
  if (result.error) {
    console.error('getProjectById error:', result.error);
    return null;
  }
  return result.data;
}

/**
 * Create or save a project in Supabase (INSERT/UPSERT)
 */
export async function saveProject(project: Project): Promise<boolean> {
  const result = await saveProjectToSupabase(project);
  if (result.error) {
    console.error('saveProject error:', result.error);
    return false;
  }
  return result.success;
}

/**
 * Update project in Supabase (UPDATE)
 */
export async function updateProject(projectId: string, updates: Partial<Project>): Promise<boolean> {
  const result = await updateProjectInSupabase(projectId, updates);
  if (result.error) {
    console.error('updateProject error:', result.error);
    return false;
  }
  return result.success;
}

/**
 * Delete a project from Supabase (DELETE)
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  const result = await deleteProjectFromSupabase(projectId);
  if (result.error) {
    console.error('deleteProject error:', result.error);
    return false;
  }
  return result.success;
}

/**
 * Subscribe to real-time changes on the projects table
 */
export function subscribeProjects(callback: (projects: Project[]) => void) {
  return subscribeProjectsDb(callback);
}

/**
 * Seed initial project records if Supabase table is empty
 */
export async function seedProjectsIfEmpty(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { count, error } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true });

    if (!error && (count === 0 || count === null)) {
      const { seedSupabaseIfEmpty } = await import('./supabase/databaseService');
      return await seedSupabaseIfEmpty();
    }
    return false;
  } catch (err) {
    console.error('Error seeding projects:', err);
    return false;
  }
}
