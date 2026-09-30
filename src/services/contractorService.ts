import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Contractor } from '../types';
import { MOCK_CONTRACTORS } from '../data/mockData';

export async function getContractors(): Promise<Contractor[]> {
  if (!isSupabaseConfigured) return MOCK_CONTRACTORS;

  try {
    const { data, error } = await supabase
      .from('contractors')
      .select('*')
      .order('performance_score', { ascending: false });

    if (error) {
      console.warn('Error fetching contractors from Supabase:', error.message);
      return MOCK_CONTRACTORS;
    }

    if (data && data.length > 0) {
      return data.map(row => {
        const json = (row.data_json && typeof row.data_json === 'object') ? row.data_json : {};
        return {
          id: row.code || row.id || json.id || 'CON-001',
          name: row.name || json.name || 'Contractor Entity',
          code: row.code || json.code || 'CON-001',
          contactPerson: json.contactPerson || row.company_name || 'Representative',
          email: row.email || json.email || 'contact@contractor.in',
          phone: row.phone || json.phone || '+91 98490 12345',
          rating: Number(row.performance_score ?? json.rating ?? 75),
          totalProjectsAssigned: json.totalProjectsAssigned || 5,
          completedProjects: json.completedProjects || 3,
          delayedProjectsCount: json.delayedProjectsCount || 1,
          scheduleScore: Number(row.schedule_score ?? json.scheduleScore ?? 75),
          qualityScore: Number(row.quality_score ?? json.qualityScore ?? 80),
          budgetScore: Number(row.budget_score ?? json.budgetScore ?? 75),
          reliabilityScore: Number(row.reliability_score ?? json.reliabilityScore ?? 75),
          overallScore: Number(row.performance_score ?? json.overallScore ?? 75)
        };
      });
    }

    return MOCK_CONTRACTORS;
  } catch (err) {
    return MOCK_CONTRACTORS;
  }
}

export async function saveContractor(contractor: Contractor): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase.from('contractors').upsert({
      code: contractor.code || contractor.id,
      name: contractor.name,
      company_name: contractor.name,
      email: contractor.email,
      phone: contractor.phone,
      performance_score: contractor.overallScore || contractor.rating,
      schedule_score: contractor.scheduleScore,
      quality_score: contractor.qualityScore,
      budget_score: contractor.budgetScore,
      reliability_score: contractor.reliabilityScore,
      data_json: contractor
    }, { onConflict: 'code' });

    return !error;
  } catch (err) {
    return false;
  }
}

export function subscribeContractors(callback: (contractors: Contractor[]) => void) {
  if (!isSupabaseConfigured) return () => {};

  try {
    const channel = supabase
      .channel('contractors_realtime_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contractors' },
        async () => {
          const fresh = await getContractors();
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
