import { supabase } from './config';
import { Project, AIDelayPrediction } from '../../types';
import { calculateAIPrediction, calculateHealthScore } from '../aiEngine';

export interface SavedRiskPrediction extends AIDelayPrediction {
  predictionId: string;
  projectId: string;
  riskScore: number;
  modelVersion: string;
  generatedAt: string;
}

/**
 * Execute AI Delay Prediction calculation and persist record to Supabase
 */
export async function generateAndSaveAIRiskPredictionSupabase(project: Project): Promise<AIDelayPrediction> {
  const prediction = calculateAIPrediction(project);
  const health = calculateHealthScore({ ...project, aiPrediction: prediction });

  const recordId = `PRED-${project.id}-${Date.now()}`;
  const riskRecord: SavedRiskPrediction = {
    ...prediction,
    predictionId: recordId,
    projectId: project.id,
    riskScore: health.risk,
    modelVersion: 'CityTrack-Predict-v2.4-Neural',
    generatedAt: new Date().toISOString()
  };

  try {
    const { error } = await supabase.from('risk_predictions').upsert({
      id: recordId,
      prediction_id: recordId,
      project_id: project.id,
      risk_score: health.risk,
      model_version: riskRecord.modelVersion,
      generated_at: riskRecord.generatedAt,
      data_json: riskRecord,
      timestamp: new Date().toISOString()
    });
    if (error) {
      console.warn('Supabase risk_predictions notice:', error.message);
    }
  } catch (err) {
    console.warn('Supabase risk_predictions error notice:', err);
  }

  return prediction;
}
