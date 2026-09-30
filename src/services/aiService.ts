import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Project, AIDelayPrediction } from '../types';
import { calculateAIPrediction, calculateHealthScore } from './aiEngine';

/**
 * Runs the deterministic AI delay prediction engine on a project,
 * calculates health score, and saves the prediction record to Supabase `ai_predictions` table.
 */
export async function generateAndSaveAIRiskPrediction(project: Project): Promise<AIDelayPrediction> {
  const prediction = calculateAIPrediction(project);
  const healthScore = calculateHealthScore({ ...project, aiPrediction: prediction });

  if (isSupabaseConfigured) {
    try {
      const scheduleRisk = prediction.riskFactors.find(r => r.category === 'Schedule Risk')?.details || 'Schedule baseline tracking';
      const budgetRisk = prediction.riskFactors.find(r => r.category === 'Budget Risk')?.details || 'Capital expenditure tracking';
      const contractorRisk = prediction.riskFactors.find(r => r.category === 'Contractor Risk')?.details || 'Contractor milestone delivery';
      const procurementRisk = prediction.riskFactors.find(r => r.category === 'Procurement Risk')?.details || 'Procurement pipeline';

      // 1. Insert prediction record into ai_predictions table
      try {
        await supabase.from('ai_predictions').insert({
          project_id: project.id,
          delay_probability: prediction.delayProbability,
          predicted_delay_days: prediction.predictedDelayDays,
          risk_level: prediction.riskLevel,
          health_score: healthScore.overall,
          schedule_risk: scheduleRisk,
          budget_risk: budgetRisk,
          contractor_risk: contractorRisk,
          procurement_risk: procurementRisk,
          explanation: prediction.explanation,
          recommendations: prediction.recommendations
        });
      } catch (e) {
        console.warn('Notice saving ai_predictions record to Supabase:', e);
      }

      // 2. Update projects table with the calculated AI metrics
      try {
        await supabase
          .from('projects')
          .update({
            delay_probability: prediction.delayProbability,
            predicted_delay_days: prediction.predictedDelayDays,
            health_score: healthScore.overall,
            risk_level: prediction.riskLevel
          })
          .or(`project_id.eq.${project.id},id.eq.${project.id}`);
      } catch (e) {
        console.warn('Notice updating project AI metrics in Supabase:', e);
      }

      // 3. Record audit log
      try {
        await supabase.from('audit_logs').insert({
          action: 'AI Prediction Generated',
          project_id: project.id,
          entity_type: 'ai_predictions',
          description: `AI delay risk analysis generated for ${project.name}: ${prediction.delayProbability}% delay risk (${prediction.predictedDelayDays} days predicted delay).`,
          metadata: {
            delayProbability: prediction.delayProbability,
            predictedDelayDays: prediction.predictedDelayDays,
            riskLevel: prediction.riskLevel
          }
        });
      } catch (e) {
        console.warn('Notice inserting audit log:', e);
      }

    } catch (err) {
      console.warn('Error saving AI prediction to Supabase:', err);
    }
  }

  return prediction;
}
