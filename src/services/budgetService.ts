import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { BudgetTransaction } from '../types';

export async function getBudgetTransactions(projectId?: string): Promise<BudgetTransaction[]> {
  if (!isSupabaseConfigured) return [];

  try {
    let query = supabase
      .from('budget_transactions')
      .select('*')
      .order('transaction_date', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching budget transactions:', error.message);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      projectId: row.project_id,
      transactionType: row.transaction_type,
      description: row.description || '',
      amount: Number(row.amount || 0),
      transactionDate: row.transaction_date,
      category: row.category || 'General',
      createdBy: row.created_by,
      createdAt: row.created_at
    }));
  } catch (err) {
    return [];
  }
}

export async function createBudgetTransaction(tx: Omit<BudgetTransaction, 'id' | 'createdAt'>): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase.from('budget_transactions').insert({
      project_id: tx.projectId,
      transaction_type: tx.transactionType,
      description: tx.description,
      amount: tx.amount,
      transaction_date: tx.transactionDate || new Date().toISOString().split('T')[0],
      category: tx.category,
      created_by: tx.createdBy || null
    });

    if (error) {
      console.warn('Error creating budget transaction:', error.message);
      return false;
    }

    // Add audit log
    try {
      await supabase.from('audit_logs').insert({
        action: 'Budget Transaction Recorded',
        project_id: tx.projectId,
        entity_type: 'budget_transactions',
        description: `${tx.transactionType} of ₹${tx.amount} Cr recorded for category ${tx.category}.`,
        metadata: { amount: tx.amount, type: tx.transactionType }
      });
    } catch (e) {
      console.warn('Notice creating audit log:', e);
    }

    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Format currency in Indian Crores (₹ Cr)
 */
export function formatINR(amountCr: number): string {
  return `₹${amountCr.toFixed(2)} Cr`;
}
