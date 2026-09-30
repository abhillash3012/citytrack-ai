import { Project, RiskLevel } from '../types';

export interface PhotoInspectionInput {
  project: Project;
  currentPhotoUrl: string;
  beforePhotoUrl?: string;
  officerNotes?: string;
}

export interface PhotoInspectionResult {
  aiVisualProgress: number;
  aiDelayProbability: number;
  aiRiskLevel: RiskLevel;
  predictedDelayDays: number;
  constructionActivity: string;
  visibleWork: string;
  workersEquipmentVisible: string;
  materialsObserved: string;
  siteCondition: string;
  safetyQualityConcerns: string;
  visualAnalysisConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  aiExplanation: string;
  aiGeneratedRemarks: string;
  aiRecommendations: string[];
  isDemoPrediction: boolean;
  beforeAfterComparison?: {
    progressDelta: number;
    visualSummary: string;
    keyChanges: string[];
  };
}

/**
 * AI Photo Inspection Analysis Engine
 * Integrates image data with project metadata (schedule, budget, milestones, issues, contractor performance)
 * Supports real Gemini Vision API if API key is set, otherwise provides a realistic AI Demo Analysis fallback.
 */
export async function runAIPhotoInspection(input: PhotoInspectionInput): Promise<PhotoInspectionResult> {
  const { project, currentPhotoUrl, beforePhotoUrl, officerNotes } = input;
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // Try real vision API if key exists and is valid
  if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY' && currentPhotoUrl.startsWith('data:image')) {
    try {
      const realResult = await callGeminiVisionApi(apiKey, project, currentPhotoUrl, beforePhotoUrl, officerNotes);
      if (realResult) {
        return realResult;
      }
    } catch (err) {
      console.warn('Real AI Vision API call failed, switching to AI Demo Analysis fallback:', err);
    }
  }

  // Fallback: AI Demo Analysis (clearly labeled as AI Demo Prediction)
  return generateDemoPhotoInspection(project, currentPhotoUrl, beforePhotoUrl, officerNotes);
}

/**
 * Call Google Gemini Vision REST API
 */
async function callGeminiVisionApi(
  apiKey: string,
  project: Project,
  currentPhotoDataUrl: string,
  beforePhotoDataUrl?: string,
  officerNotes?: string
): Promise<PhotoInspectionResult | null> {
  const base64Data = currentPhotoDataUrl.split(',')[1];
  if (!base64Data) return null;

  const prompt = `
You are an expert Civil Engineering Site Auditor and AI Inspection Engine for government infrastructure projects.
Analyze this construction site photo for the project "${project.name}" (${project.id}, Department: ${project.department}).

PROJECT DATABASE METRICS:
- Expected Physical Progress: ${project.expectedProgressPercentage}%
- Reported Actual Progress: ${project.actualProgressPercentage}%
- Total Budget: ₹${project.totalBudgetCr} Cr (Spent: ₹${project.spentBudgetCr} Cr)
- Overdue Milestones: ${project.milestones.filter(m => m.status === 'Overdue').length}
- Open Issues: ${project.issues.filter(i => i.status !== 'Resolved').length}
- Contractor: ${project.contractorName}
${officerNotes ? `- Field Officer Notes: ${officerNotes}` : ''}

Respond ONLY with valid JSON in this exact structure:
{
  "aiVisualProgress": 54,
  "aiDelayProbability": 78,
  "aiRiskLevel": "High",
  "predictedDelayDays": 18,
  "constructionActivity": "Detailed photo-specific description of visible activity...",
  "visibleWork": "Detailed breakdown of completed and remaining visible work...",
  "workersEquipmentVisible": "Specific visible workers and heavy machinery...",
  "materialsObserved": "Specific construction materials identified...",
  "siteCondition": "Detailed site cleanliness and organization observation...",
  "safetyQualityConcerns": "Specific safety and quality concerns supported by visual evidence...",
  "visualAnalysisConfidence": "HIGH",
  "aiExplanation": "Visual Observation: [What photo shows]. Project-Based Prediction: [What project data indicates].",
  "aiGeneratedRemarks": "Professional official inspection remarks...",
  "aiRecommendations": [
    "Conduct immediate site inspection",
    "Review contractor manpower and equipment",
    "Check material availability",
    "Resolve pending procurement issues",
    "Escalate overdue milestones"
  ]
}
`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Data
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      response_mime_type: "application/json"
    }
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini Vision API HTTP Error ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return null;

  const parsed = JSON.parse(rawText);
  let riskLevel: RiskLevel = 'High';
  const rawRisk = String(parsed.aiRiskLevel || '').toUpperCase();
  if (rawRisk === 'CRITICAL') riskLevel = 'Critical';
  else if (rawRisk === 'HIGH') riskLevel = 'High';
  else if (rawRisk === 'MEDIUM') riskLevel = 'Medium';
  else if (rawRisk === 'LOW') riskLevel = 'Low';

  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
  const rawConf = String(parsed.visualAnalysisConfidence || '').toUpperCase();
  if (rawConf === 'MEDIUM') confidence = 'MEDIUM';
  else if (rawConf === 'LOW') confidence = 'LOW';

  return {
    ...parsed,
    aiRiskLevel: riskLevel,
    visualAnalysisConfidence: confidence,
    isDemoPrediction: false
  };
}

/**
 * AI Demo Analysis Fallback
 * Generates photo-specific, data-informed photo inspection results labeled as "AI Demo Prediction"
 */
function generateDemoPhotoInspection(
  project: Project,
  currentPhotoUrl: string,
  beforePhotoUrl?: string,
  officerNotes?: string
): PhotoInspectionResult {
  const isDemoProject = project.id === 'PRJ-GHMC-2026-001' || project.name.includes('Urban Road');
  const expected = project.expectedProgressPercentage || 72;
  const actual = project.actualProgressPercentage || 54;
  const progressGap = expected - actual;
  const overdueCount = project.milestones.filter(m => m.status === 'Overdue').length;
  const openIssuesCount = project.issues.filter(i => i.status !== 'Resolved').length;
  const budgetSpentPct = Math.round(((project.spentBudgetCr || 5) / (project.totalBudgetCr || 10)) * 100);

  // Photo variation detection based on URL / features
  const isExcavationPhoto = currentPhotoUrl.includes('1541888946425') || currentPhotoUrl.toLowerCase().includes('excavat');
  const isFlyoverPhoto = currentPhotoUrl.includes('1503387762') || currentPhotoUrl.toLowerCase().includes('flyover') || currentPhotoUrl.toLowerCase().includes('pier');

  // Exact specifications for Urban Road Improvement Project demo
  if (isDemoProject) {
    let beforeAfterComparison;
    if (beforePhotoUrl) {
      beforeAfterComparison = {
        progressDelta: 16,
        visualSummary: "Comparison against baseline photo shows sub-grade earthwork completed, GSB (Granular Sub-Base) layer laid, and utility trenching initiated.",
        keyChanges: [
          "Sub-base compaction progressed across 1.8 km corridor",
          "Stormwater RCC drain pipes positioned along embankment",
          "Contractor equipment mobilized (1 heavy roller, 2 tippers visible)"
        ]
      };
    }

    if (isExcavationPhoto) {
      return {
        aiVisualProgress: 52,
        aiDelayProbability: 78,
        aiRiskLevel: 'High',
        predictedDelayDays: 18,
        constructionActivity: "Deep storm drain trenching, utility pipeline excavation, and sub-grade channel excavation.",
        visibleWork: "Trench excavation 80% completed; storm culvert pipe positioning in progress; backfilling pending.",
        workersEquipmentVisible: "1 Tracked Excavator (20-ton), 1 Backhoe Loader, 8 Site Workers",
        materialsObserved: "RCC storm culvert pipes, crushed stone aggregate, bedding gravel",
        siteCondition: "Active trench excavation with excavated soil stockpiles alongside shoulder. Standing water in lower section.",
        safetyQualityConcerns: "Possible safety concern: Open trench requires perimeter warning mesh barricading near public access path.",
        visualAnalysisConfidence: "HIGH",
        aiExplanation: "Visual Observation: Deep drain excavation and culvert placement visible in photo. Project-Based Prediction: Project is at 54% actual vs 72% expected progress with 2 overdue milestones and 78% budget utilization.",
        aiGeneratedRemarks: "Trench excavation and culvert installation active. Drainage work progressing but site safety barricading requires immediate reinforcement.",
        aiRecommendations: [
          "Conduct immediate site inspection",
          "Review contractor manpower and equipment",
          "Check material availability",
          "Resolve pending procurement issues",
          "Escalate overdue milestones"
        ],
        isDemoPrediction: true,
        beforeAfterComparison
      };
    }

    if (isFlyoverPhoto) {
      return {
        aiVisualProgress: 56,
        aiDelayProbability: 78,
        aiRiskLevel: 'High',
        predictedDelayDays: 18,
        constructionActivity: "Structural RCC pier cap shuttering, rebar binding, and concrete pouring prep.",
        visibleWork: "Pier foundation completed; pier column cast; pier cap shuttering and rebar cage bound.",
        workersEquipmentVisible: "1 Mobile Hydraulic Crane (50-ton), 1 Concrete Pump Truck, 12 Steel Fixers",
        materialsObserved: "FE-550 TMT Steel Rebar, M-45 Grade Concrete, Heavy Steel Shuttering Plates",
        siteCondition: "Active elevated structural zone. Formwork and scaffolding erected with safety net protection.",
        safetyQualityConcerns: "Requires closer inspection: Elevated work platform harness tie-off compliance for steel binding crew.",
        visualAnalysisConfidence: "HIGH",
        aiExplanation: "Visual Observation: Elevated pier cap shuttering and rebar cage visible in photo. Project-Based Prediction: Project physical completion (54%) lags planned timeline (72%) with 2 overdue procurement/approval milestones.",
        aiGeneratedRemarks: "Elevated structural work progressing actively with pier cap shuttering in place. Execution pacing requires monitoring to catch up with schedule.",
        aiRecommendations: [
          "Conduct immediate site inspection",
          "Review contractor manpower and equipment",
          "Check material availability",
          "Resolve pending procurement issues",
          "Escalate overdue milestones"
        ],
        isDemoPrediction: true,
        beforeAfterComparison
      };
    }

    // Default Road Photo for Urban Road Improvement Project Demo
    return {
      aiVisualProgress: 54,
      aiDelayProbability: 78,
      aiRiskLevel: 'High',
      predictedDelayDays: 18,
      constructionActivity: "Sub-base compaction, utility trenching, and stormwater drain channel positioning in active progress along the arterial corridor.",
      visibleWork: "Granular sub-base layer 65% laid; utility ducting in progress; final asphalt surfacing pending.",
      workersEquipmentVisible: "2 Heavy Road Rollers, 1 Excavator, 14 Field Workers",
      materialsObserved: "Wet Mix Macadam (WMM) aggregate, RCC drain pipes, Bitumen emulsion drums",
      siteCondition: "Sub-grade earthwork active with heavy rollers. Material aggregate stockpiled along road shoulder.",
      safetyQualityConcerns: "Possible safety concern: Inadequate perimeter hazard barricading near active public traffic lane.",
      visualAnalysisConfidence: "HIGH",
      aiExplanation: "Visual Observation: Road sub-base compaction and aggregate spreading visible in uploaded photograph. Project-Based Prediction: The project is at 54% actual progress against 72% expected progress, with 2 overdue milestones and 3 unresolved issues indicating elevated delay risk.",
      aiGeneratedRemarks: "Road construction is actively progressing, with base-layer work visible at the site. However, execution appears slower than the planned schedule and material availability may be affecting progress. Immediate site follow-up is recommended.",
      aiRecommendations: [
        "Conduct immediate site inspection",
        "Review contractor manpower and equipment",
        "Check material availability",
        "Resolve pending procurement issues",
        "Escalate overdue milestones"
      ],
      isDemoPrediction: true,
      beforeAfterComparison
    };
  }

  // Dynamic fallback logic for other projects
  let aiVisualProgress = actual;
  let aiDelayProbability = 20 + (progressGap * 2) + (overdueCount * 12) + (openIssuesCount * 5);
  aiDelayProbability = Math.min(95, Math.max(10, Math.round(aiDelayProbability)));

  let aiRiskLevel: RiskLevel = 'Low';
  if (aiDelayProbability >= 70) aiRiskLevel = 'Critical';
  else if (aiDelayProbability >= 50) aiRiskLevel = 'High';
  else if (aiDelayProbability >= 30) aiRiskLevel = 'Medium';

  let predictedDelayDays = progressGap > 0 ? Math.round(progressGap * 1.1 + overdueCount * 4 + openIssuesCount * 2) : 0;

  const activityByType: Record<string, string> = {
    'Roads': 'Asphalt resurfacing, sub-base compaction, and concrete curb stone placement.',
    'Bridges & Flyovers': 'Pier cap reinforcement shuttering and girder launcher beam positioning.',
    'Hospitals': 'Multi-story structural RCC slab shuttering and electrical conduit rough-in.',
    'Schools': 'Brick masonry wall construction and external plastering work.',
    'Water Supply': 'High-density polyethylene (HDPE) main pipeline trench excavation and joint welding.',
    'Drainage': 'Reinforced concrete storm drain channel casting and culvert excavation.',
    'Public Buildings': 'Structural steel frame erection and floor slab concrete pouring.',
    'Smart Lighting': 'Smart street light pole foundation casting and underground cable ducting.',
    'Waste Management': 'Compacting liner layer installation and leachate drainage channel piping.'
  };

  const activity = activityByType[project.projectType] || 'Structural civil work and site excavation in progress.';
  const condition = `Active site operations observed. Physical progress estimated visually around ${aiVisualProgress}%. Equipment and material stockpiles present.`;
  const concerns = aiRiskLevel === 'High' || aiRiskLevel === 'Critical'
    ? 'Possible safety concern: Barricading and site safety warning signage require strengthening.'
    : 'Minor site housekeeping required; safety helmets observed on site personnel.';

  let remarks = `Construction work for ${project.name} is progressing with ${activity.toLowerCase()} Visible site progress aligns with ~${aiVisualProgress}%.`;
  if (progressGap > 10) {
    remarks += ` However, visual site execution pacing appears behind the planned schedule (${expected}% expected). Close monitoring of contractor deployment recommended.`;
  } else {
    remarks += ` Site execution is pacing satisfactorily according to schedule targets.`;
  }

  const recs: string[] = [
    'Conduct immediate site inspection',
    'Review contractor manpower and equipment deployment',
    'Verify quality test reports for recently completed structural sections',
    'Track material procurement supply chain'
  ];

  if (overdueCount > 0) recs.push('Escalate overdue milestones with project engineer');
  if (aiRiskLevel === 'High' || aiRiskLevel === 'Critical') recs.push('Update completion forecast and issue milestone delay warning');

  let beforeAfterComparison;
  if (beforePhotoUrl) {
    beforeAfterComparison = {
      progressDelta: Math.max(5, Math.round(progressGap > 0 ? 12 : 20)),
      visualSummary: `Comparing before baseline photo against current inspection photo shows clear visual structural advancement (+${Math.max(5, Math.round(progressGap > 0 ? 12 : 20))}% progress).`,
      keyChanges: [
        'Foundation & sub-structure completed',
        'Super-structure elements erected since previous baseline',
        'Site clearing and excavation boundary widened'
      ]
    };
  }

  return {
    aiVisualProgress,
    aiDelayProbability,
    aiRiskLevel,
    predictedDelayDays,
    constructionActivity: activity,
    visibleWork: `Phase 1 civil work ${aiVisualProgress}% complete; Phase 2 structural work pending.`,
    workersEquipmentVisible: "Contractor heavy machinery and site labor crew active on-site.",
    materialsObserved: "Raw construction aggregates, structural steel, and piping materials.",
    siteCondition: condition,
    safetyQualityConcerns: concerns,
    visualAnalysisConfidence: "HIGH",
    aiExplanation: `Visual Observation: ${activity} visible in photo. Project-Based Prediction: Actual progress (${aiVisualProgress}%) vs expected (${expected}%). ${overdueCount} milestone(s) overdue and budget utilization at ${budgetSpentPct}%.`,
    aiGeneratedRemarks: remarks,
    aiRecommendations: recs.slice(0, 5),
    isDemoPrediction: true,
    beforeAfterComparison
  };
}
