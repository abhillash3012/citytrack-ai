import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { runAIPhotoInspection, PhotoInspectionResult } from '../services/photoInspectionEngine';
import { uploadSiteInspectionPhoto } from '../services/supabase/storageService';
import { 
  Camera, 
  MapPin, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Smartphone, 
  Sparkles,
  BrainCircuit,
  FileCheck,
  RotateCcw,
  Edit3,
  Check,
  Building2,
  Calendar,
  IndianRupee,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Trash2,
  ImageIcon,
  Loader2,
  Info,
  Sliders,
  Eye,
  AlertCircle,
  X
} from 'lucide-react';

export const FieldOfficerModule: React.FC = () => {
  const { projects, submitFieldUpdate, setActiveTab, userProfile, isLoading, databaseError, refreshFromSupabase } = useApp();

  // State: Project Selection (defaults to first assigned project)
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');

  // Auto-select assigned project when projects change
  useEffect(() => {
    if (projects.length > 0 && (!selectedProjectId || !projects.some(p => p.id === selectedProjectId))) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  // State: Photos (Supabase Private Storage 'inspections' bucket & preview URLs)
  const [currentPhotoSrc, setCurrentPhotoSrc] = useState<string>(
    'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=1200&q=80'
  );
  const [beforePhotoSrc, setBeforePhotoSrc] = useState<string | null>(null);

  // State: Inspection Form Fields
  const [officerName, setOfficerName] = useState<string>(userProfile?.fullName || 'Field Officer');
  const [officerNotes, setOfficerNotes] = useState<string>('Sub-base compaction active. Bitumen & aggregate delivery ongoing.');

  useEffect(() => {
    if (userProfile?.fullName) {
      setOfficerName(userProfile.fullName);
    }
  }, [userProfile]);

  // State: AI Loading Steps
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStepIndex, setAnalysisStepIndex] = useState<number>(0);

  // State: AI Result
  const [aiResult, setAiResult] = useState<PhotoInspectionResult | null>(null);

  // State: Remarks Editing Mode
  const [editableRemarks, setEditableRemarks] = useState<string>('');
  const [isRemarksAccepted, setIsRemarksAccepted] = useState<boolean>(false);
  const [isEditingRemarks, setIsEditingRemarks] = useState<boolean>(false);

  // State: UI Feedback & submission loading
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [isSubmittingInspection, setIsSubmittingInspection] = useState<boolean>(false);

  // Selected Project Data
  const selectedProj = projects.find(p => p.id === selectedProjectId) || projects[0];
  const overdueCount = selectedProj?.milestones?.filter(m => m.status === 'Overdue').length || 0;
  const openIssuesCount = selectedProj?.issues?.filter(i => i.status !== 'Resolved').length || 0;
  const budgetSpentPct = Math.round(((selectedProj?.spentBudgetCr || 0) / (selectedProj?.totalBudgetCr || 1)) * 100);

  // Reset analysis when project changes
  useEffect(() => {
    setAiResult(null);
    setEditableRemarks('');
    setIsRemarksAccepted(false);
    setErrorMsg(null);
  }, [selectedProjectId]);

  // Animated Loading Steps
  const loadingSteps = [
    'Detecting construction activity...',
    'Analyzing visible work & site structures...',
    'Estimating visual progress percentage...',
    'Checking safety & site quality conditions...',
    'Comparing previous inspection baseline...',
    'Checking project schedule & milestones...',
    'Calculating delay probability & risk level...',
    'Generating inspection remarks & recommendations...'
  ];

  // AI Analysis Execution
  const handleAnalyzeWithAI = async () => {
    if (!currentPhotoSrc) {
      setErrorMsg('Please upload or select a Current Construction Site Photo before analyzing.');
      return;
    }

    setErrorMsg(null);
    setIsAnalyzing(true);
    setAnalysisStepIndex(0);
    setAiResult(null);
    setIsRemarksAccepted(false);

    // Step-by-step progress animation
    const stepInterval = setInterval(() => {
      setAnalysisStepIndex(prev => {
        if (prev < loadingSteps.length - 1) return prev + 1;
        return prev;
      });
    }, 450);

    try {
      const result = await runAIPhotoInspection({
        project: selectedProj,
        currentPhotoUrl: currentPhotoSrc,
        beforePhotoUrl: beforePhotoSrc || undefined,
        officerNotes: officerNotes
      });

      clearInterval(stepInterval);
      setAnalysisStepIndex(loadingSteps.length - 1);
      
      setTimeout(() => {
        setAiResult(result);
        setEditableRemarks(result.aiGeneratedRemarks);
        setIsAnalyzing(false);
      }, 400);

    } catch (err: any) {
      clearInterval(stepInterval);
      setIsAnalyzing(false);
      setErrorMsg('AI Photo Inspection failed: ' + (err.message || 'An unexpected error occurred.'));
    }
  };

  // State: Storage upload & Preview
  const [isUploadingCurrent, setIsUploadingCurrent] = useState<boolean>(false);
  const [isUploadingBefore, setIsUploadingBefore] = useState<boolean>(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Upload Photo Handlers (Supabase Storage 'inspections' bucket)
  const handleCurrentPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Invalid file format. Please upload a JPG, PNG, or WebP construction photo.');
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setErrorMsg('Image file size too large. Please select an image smaller than 15MB.');
        return;
      }
      setIsUploadingCurrent(true);
      setErrorMsg(null);
      try {
        const uploadResult = await uploadSiteInspectionPhoto(file, selectedProj.id, userProfile?.id);
        setCurrentPhotoSrc(uploadResult.url);
        setAiResult(null); // Reset AI result when image changes
      } catch (err: any) {
        console.warn('Notice uploading to Supabase Storage:', err);
        const fallbackUrl = URL.createObjectURL(file);
        setCurrentPhotoSrc(fallbackUrl);
        setAiResult(null);
      } finally {
        setIsUploadingCurrent(false);
      }
    }
  };

  const handleBeforePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Invalid file format. Please upload a JPG or PNG before photo.');
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setErrorMsg('Image file size too large. Please select an image smaller than 15MB.');
        return;
      }
      setIsUploadingBefore(true);
      setErrorMsg(null);
      try {
        const uploadResult = await uploadSiteInspectionPhoto(file, selectedProj.id, userProfile?.id);
        setBeforePhotoSrc(uploadResult.url);
        setAiResult(null);
      } catch (err: any) {
        console.warn('Notice uploading before photo to Supabase Storage:', err);
        const fallbackUrl = URL.createObjectURL(file);
        setBeforePhotoSrc(fallbackUrl);
        setAiResult(null);
      } finally {
        setIsUploadingBefore(false);
      }
    }
  };

  // Sample Photos for quick judging / demo without file dialog
  const setSampleRoadPhoto = () => {
    setCurrentPhotoSrc('https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=1200&q=80');
    setAiResult(null);
  };
  const setSampleExcavationPhoto = () => {
    setCurrentPhotoSrc('https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=1200&q=80');
    setAiResult(null);
  };
  const setSampleFlyoverPhoto = () => {
    setCurrentPhotoSrc('https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80');
    setAiResult(null);
  };

  const setSampleBeforePhoto = () => {
    setBeforePhotoSrc('https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=1200&q=80');
    setAiResult(null);
  };

  // Submission Handler
  const handleSubmitInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProj) return;

    if (!aiResult) {
      setErrorMsg('Please click "Analyze Site with AI" to generate AI results before submitting.');
      return;
    }

    const finalRemarks = editableRemarks.trim() || aiResult.aiGeneratedRemarks;

    setIsSubmittingInspection(true);
    setErrorMsg(null);

    try {
      // Submit Field Update with AI Metadata to App Context & Supabase
      await submitFieldUpdate({
        projectId: selectedProj.id,
        projectName: selectedProj.name,
        officerName: officerName,
        latitude: selectedProj.latitude,
        longitude: selectedProj.longitude,
        reportedProgressPercentage: aiResult.aiVisualProgress,
        photoUrl: currentPhotoSrc,
        remarks: finalRemarks,
        issueReported: aiResult.aiRiskLevel === 'High' || aiResult.aiRiskLevel === 'Critical',
        issueSeverity: aiResult.aiRiskLevel === 'Critical' ? 'Critical' : aiResult.aiRiskLevel === 'High' ? 'High' : 'Low',
        aiVisualProgress: aiResult.aiVisualProgress,
        aiDelayProbability: aiResult.aiDelayProbability,
        aiRiskLevel: aiResult.aiRiskLevel,
        predictedDelayDays: aiResult.predictedDelayDays,
        aiExplanation: aiResult.aiExplanation,
        aiRecommendations: aiResult.aiRecommendations,
        beforeImageReference: beforePhotoSrc || undefined,
        afterImageReference: currentPhotoSrc,
        isDemoPrediction: aiResult.isDemoPrediction
      });

      setSubmittedSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit inspection to Supabase.');
    } finally {
      setIsSubmittingInspection(false);
    }
  };

  // State 1: Loading telemetry from Supabase
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto my-8 bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center shadow-2xl space-y-4">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mx-auto"></div>
        <h2 className="text-lg font-bold text-white font-display">Loading Field Updates...</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Synchronizing assigned infrastructure projects and site telemetry from Supabase...
        </p>
      </div>
    );
  }

  // State 2: Real Supabase Database Connection / Query Error
  if (databaseError) {
    return (
      <div className="max-w-4xl mx-auto my-8 bg-slate-900 border border-rose-900/50 rounded-3xl p-12 text-center shadow-2xl space-y-4">
        <div className="w-12 h-12 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white font-display">Unable to load projects from Supabase</h2>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          The database request encountered an error:
        </p>
        <p className="text-xs text-rose-400 max-w-md mx-auto font-mono bg-slate-950/80 p-3 rounded-xl border border-rose-900/40">
          {databaseError}
        </p>
        <button
          onClick={() => {
            console.log('User triggered Supabase retry for Field Updates');
            refreshFromSupabase();
          }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // State 3: Successful query with zero assigned rows
  if (projects.length === 0 || !selectedProj) {
    return (
      <div className="max-w-4xl mx-auto my-8 bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center shadow-2xl space-y-4">
        <div className="w-12 h-12 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl flex items-center justify-center mx-auto">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white font-display">No Projects Currently Assigned</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          No infrastructure projects are currently assigned to this Field Officer profile in Supabase. Check with your Administrator or Project Manager.
        </p>
        <button
          onClick={() => refreshFromSupabase()}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all border border-slate-700"
        >
          Check for Assignments
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Mobile Device Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 border border-blue-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-blue-500/20 rounded-2xl text-cyan-400 border border-blue-500/30 shrink-0">
            <Smartphone className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                Mobile Field Operations
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>GPS Active</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold font-display text-white mt-1">
              Field Officer AI Photo Inspection
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated visual progress estimation, delay forecasting & smart remarks generation
            </p>
          </div>
        </div>
      </div>

      {/* Success Toast Banner */}
      {submittedSuccess && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/50 rounded-2xl p-5 shadow-2xl space-y-3 animate-fade-in text-emerald-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/40">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Inspection Successfully Saved to Supabase & Synced Real-Time!
                </h3>
                <p className="text-xs text-emerald-300 mt-0.5">
                  Metadata, AI Visual Progress ({aiResult?.aiVisualProgress}%), Delay Risk ({aiResult?.aiDelayProbability}%), and Remarks synced to City Command Center.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSubmittedSuccess(false)}
              className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-emerald-800/40 text-xs">
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-emerald-900">
              <span className="text-[10px] text-slate-400 block font-semibold">Project Actual Progress</span>
              <span className="text-emerald-400 font-bold font-display text-sm">{aiResult?.aiVisualProgress}%</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-emerald-900">
              <span className="text-[10px] text-slate-400 block font-semibold">AI Delay Risk</span>
              <span className="text-amber-400 font-bold font-display text-sm">{aiResult?.aiDelayProbability}% ({aiResult?.aiRiskLevel})</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-emerald-900">
              <span className="text-[10px] text-slate-400 block font-semibold">Predicted Delay</span>
              <span className="text-rose-400 font-bold font-display text-sm">+{aiResult?.predictedDelayDays} Days</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-emerald-900 flex items-center justify-center">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow flex items-center justify-center space-x-1"
              >
                <span>View Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert Message */}
      {errorMsg && (
        <div className="bg-rose-950/80 border border-rose-500/50 rounded-2xl p-4 flex items-center space-x-3 text-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <p className="text-xs font-semibold">{errorMsg}</p>
        </div>
      )}

      {/* SECTION 1: Project Selection & Baseline Details */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-500/10 rounded-lg text-cyan-400 border border-blue-500/20">
              <Building2 className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold font-display text-white">1. Select Infrastructure Project</h2>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 font-bold">
            ID: {selectedProj.id}
          </span>
        </div>

        {/* Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Government Project *</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id}) — {p.department}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Project Summary Card */}
        <div className="bg-slate-950 rounded-xl border border-slate-800/80 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-cyan-400">{selectedProj.department}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">{selectedProj.projectType}</span>
              </div>
              <h3 className="text-base font-extrabold text-white font-display mt-0.5">{selectedProj.name}</h3>
              <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>{selectedProj.location}, {selectedProj.district}</span>
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${
                selectedProj.riskLevel === 'Critical' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                selectedProj.riskLevel === 'High' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                selectedProj.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' :
                'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}>
                Risk: {selectedProj.riskLevel.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">Expected Progress</span>
              <span className="text-cyan-400 font-bold font-display text-sm">{selectedProj.expectedProgressPercentage}%</span>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">Current Actual Progress</span>
              <span className="text-emerald-400 font-bold font-display text-sm">{selectedProj.actualProgressPercentage}%</span>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">Contractor</span>
              <span className="text-slate-200 font-semibold truncate block" title={selectedProj.contractorName}>{selectedProj.contractorName}</span>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-semibold">Budget Utilization</span>
              <span className="text-amber-400 font-bold font-display text-sm">{budgetSpentPct}% (₹{selectedProj.spentBudgetCr} / {selectedProj.totalBudgetCr} Cr)</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-1">
            <span>Overdue Milestones: <strong className="text-rose-400">{overdueCount}</strong></span>
            <span>Unresolved Issues: <strong className="text-amber-400">{openIssuesCount}</strong></span>
            <span className="font-mono text-slate-500">GPS: Lat {selectedProj.latitude ? selectedProj.latitude.toFixed(4) : '17.4000'}, Lon {selectedProj.longitude ? selectedProj.longitude.toFixed(4) : '78.4500'}</span>
          </div>
        </div>
      </div>

      {/* SECTION 2 & 3: Construction Photo Upload (Current + Optional Before) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-500/10 rounded-lg text-cyan-400 border border-blue-500/20">
              <Camera className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold font-display text-white">2. Construction Photo Capture & Upload</h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            No Storage Upload (Browser File API)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Primary Current Photo Upload Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                <span>Current Construction Photo *</span>
                <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                Primary Image
              </span>
            </div>

            <div className="p-3 border-2 border-dashed border-blue-500/40 rounded-xl bg-slate-950/80 text-center space-y-2 relative group hover:border-blue-400 transition-colors">
              {isUploadingCurrent ? (
                <div className="py-8 space-y-2 flex flex-col items-center justify-center text-cyan-400">
                  <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
                  <p className="text-xs font-bold">Uploading JPG/PNG to Supabase Storage ('inspections' bucket)...</p>
                </div>
              ) : currentPhotoSrc ? (
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-black max-h-48 flex items-center justify-center">
                    <img src={currentPhotoSrc} alt="Current Site Photo" className="max-h-48 w-full object-cover" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-blue-600/90 text-white font-mono text-[9px] font-bold shadow">
                      SUPABASE INSPECTION PHOTO
                    </span>
                    <div className="absolute top-2 right-2 flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoUrl(currentPhotoSrc)}
                        className="p-1.5 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 rounded-lg transition-all shadow border border-slate-700"
                        title="Preview Full Photo"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentPhotoSrc('')}
                        className="p-1.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg transition-all shadow"
                        title="Remove Photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setPreviewPhotoUrl(currentPhotoSrc)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded border border-slate-700 flex items-center space-x-1"
                    >
                      <Eye className="w-3 h-3 text-cyan-400" />
                      <span>Preview</span>
                    </button>
                    <label className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold rounded border border-slate-700 cursor-pointer flex items-center space-x-1">
                      <Upload className="w-3 h-3 text-cyan-400" />
                      <span>Replace Photo</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCurrentPhotoUpload} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={() => setCurrentPhotoSrc('')}
                      className="px-3 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-[10px] font-bold rounded border border-rose-800 flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3 text-rose-400" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 space-y-2">
                  <Upload className="w-8 h-8 text-cyan-400 mx-auto animate-bounce" />
                  <p className="text-xs text-slate-200 font-semibold">Click to Upload JPG/PNG Photo</p>
                  <p className="text-[10px] text-slate-500">Supabase Storage 'inspections' Bucket (Max 15MB)</p>
                  <label className="inline-block px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-md">
                    <span>Browse Image</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCurrentPhotoUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            {/* Demo Quick Sample Buttons for Current Photo */}
            <div className="pt-1">
              <span className="text-[10px] text-slate-400 block font-semibold mb-1">Quick Demo Sample Photos:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={setSampleRoadPhoto}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold rounded border border-slate-700"
                >
                  Road Base Layer
                </button>
                <button
                  type="button"
                  onClick={setSampleExcavationPhoto}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold rounded border border-slate-700"
                >
                  Excavation & Drains
                </button>
                <button
                  type="button"
                  onClick={setSampleFlyoverPhoto}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold rounded border border-slate-700"
                >
                  Flyover Pier
                </button>
              </div>
            </div>
          </div>

          {/* Optional Before Photo Upload Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                <span>Before Construction Photo</span>
                <span className="text-slate-500 font-normal">(Optional Visual Comparison)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-semibold bg-slate-800 px-2 py-0.5 rounded">
                Comparison Mode
              </span>
            </div>

            <div className="p-3 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/80 text-center space-y-2 relative hover:border-slate-700 transition-colors">
              {beforePhotoSrc ? (
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-black max-h-48 flex items-center justify-center">
                    <img src={beforePhotoSrc} alt="Before Site Photo" className="max-h-48 w-full object-cover" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-800/90 text-amber-300 font-mono text-[9px] font-bold border border-slate-700 shadow">
                      BEFORE PHOTO (BASELINE)
                    </span>
                    <button
                      type="button"
                      onClick={() => setBeforePhotoSrc(null)}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg transition-all shadow"
                      title="Remove Before Image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <label className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold rounded border border-slate-700 cursor-pointer">
                      <span>Replace Before Photo</span>
                      <input type="file" accept="image/*" onChange={handleBeforePhotoUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="py-6 space-y-2">
                  <ImageIcon className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">Add "Before" Baseline Photo</p>
                  <p className="text-[10px] text-slate-500">Enables Before-vs-Current visual AI comparison</p>
                  <div className="pt-1 flex flex-col items-center space-y-2">
                    <label className="inline-block px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition-all border border-slate-700">
                      <span>Select Before File</span>
                      <input type="file" accept="image/*" onChange={handleBeforePhotoUpload} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={setSampleBeforePhoto}
                      className="text-[10px] text-cyan-400 hover:underline font-semibold"
                    >
                      + Use Sample Before Baseline Photo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {beforePhotoSrc && currentPhotoSrc && (
              <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-cyan-300 text-[11px] flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Dual photo comparison mode active. AI will perform before-vs-current visual progress analysis.</span>
              </div>
            )}
          </div>

        </div>

        {/* Officer Name & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Field Inspection Officer Name</label>
            <input
              type="text"
              value={officerName}
              onChange={(e) => setOfficerName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Field Observation Notes (Optional)</label>
            <input
              type="text"
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              placeholder="e.g. Weather dry, materials delivered, machinery active..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>
        </div>

        {/* SECTION 4: Analyze With AI Button & Animated Loading */}
        <div className="pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handleAnalyzeWithAI}
            disabled={isAnalyzing || !currentPhotoSrc}
            className={`w-full py-4 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center space-x-2.5 transition-all ${
              isAnalyzing 
                ? 'bg-indigo-900/60 text-slate-400 cursor-not-allowed border border-indigo-500/30'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-600/30 hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                <span>Analyzing Site Photo with Vision AI...</span>
              </>
            ) : (
              <>
                <BrainCircuit className="w-5 h-5 text-cyan-300" />
                <span className="text-base font-extrabold tracking-wide">Analyze Site with AI</span>
              </>
            )}
          </button>

          {/* Animated Loading Steps Bar */}
          {isAnalyzing && (
            <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-indigo-500/30 space-y-3 animate-pulse">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
                <span className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span>CityTrack AI Vision Neural Pipeline Running</span>
                </span>
                <span className="font-mono">{Math.round(((analysisStepIndex + 1) / loadingSteps.length) * 100)}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${((analysisStepIndex + 1) / loadingSteps.length) * 100}%` }}
                ></div>
              </div>

              {/* Active Step Text */}
              <div className="flex items-center space-x-2 text-xs text-slate-200 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">{loadingSteps[analysisStepIndex]}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 6, 7, 8, 9, 10: AI RESULT CARD & EDITABLE REMARKS */}
      {aiResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6 animate-fade-in">
          
          {/* Header Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                    aiResult.isDemoPrediction 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {aiResult.isDemoPrediction ? 'AI Demo Prediction' : 'AI Vision Neural Analysis'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Timestamp: {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <h2 className="text-lg font-extrabold font-display text-white mt-0.5">
                  AI Construction Inspection Results
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-xl text-xs font-black font-mono border ${
                aiResult.aiRiskLevel === 'Critical' ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' :
                aiResult.aiRiskLevel === 'High' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' :
                aiResult.aiRiskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' :
                'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
              }`}>
                RISK LEVEL: {aiResult.aiRiskLevel.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Key Metrics 4-Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AI Visual Progress</span>
              <div className="text-2xl font-black text-cyan-400 font-display">{aiResult.aiVisualProgress}%</div>
              <p className="text-[10px] text-slate-500">Baseline Target: {selectedProj.expectedProgressPercentage}%</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AI Delay Probability</span>
              <div className="text-2xl font-black text-amber-400 font-display">{aiResult.aiDelayProbability}%</div>
              <p className="text-[10px] text-slate-500">Schedule Variance Impact</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Risk Level</span>
              <div className={`text-xl font-black font-display ${
                aiResult.aiRiskLevel === 'High' || aiResult.aiRiskLevel === 'Critical' ? 'text-rose-400' : 'text-emerald-400'
              }`}>{aiResult.aiRiskLevel.toUpperCase()}</div>
              <p className="text-[10px] text-slate-500">Multi-Factor Assessment</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Predicted Delay</span>
              <div className="text-2xl font-black text-rose-400 font-display">+{aiResult.predictedDelayDays} Days</div>
              <p className="text-[10px] text-slate-500">Revised Finish Forecast</p>
            </div>
          </div>

          {/* Before vs Current Photo Visual Comparison Box (If Before Photo Present) */}
          {aiResult.beforeAfterComparison && (
            <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center space-x-1">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Before vs Current Visual AI Comparison</span>
                </span>
                <span className="text-[11px] font-bold font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                  +{aiResult.beforeAfterComparison.progressDelta}% Progress Change
                </span>
              </div>
              <p className="text-xs text-slate-300">{aiResult.beforeAfterComparison.visualSummary}</p>
              <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1 pt-1">
                {aiResult.beforeAfterComparison.keyChanges.map((change, idx) => (
                  <li key={idx}>{change}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Visual Observations Breakdown Grid */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3 text-xs">
            <h3 className="font-bold text-slate-200 font-display flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Detailed Visual Inspection Observations</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Construction Activity</span>
                <p className="text-slate-300 leading-relaxed">{aiResult.constructionActivity}</p>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Site & Earthwork Condition</span>
                <p className="text-slate-300 leading-relaxed">{aiResult.siteCondition}</p>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Safety & Quality Concerns</span>
                <p className="text-slate-300 leading-relaxed">{aiResult.safetyQualityConcerns}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Project Integrated AI Explanation</span>
              <p className="text-slate-300 leading-relaxed italic">"{aiResult.aiExplanation}"</p>
            </div>
          </div>

          {/* SECTION 7: AI-GENERATED REMARKS (EDITABLE) */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <label className="text-xs font-bold text-cyan-400 font-display flex items-center space-x-1.5">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>AI Generated Inspection Remarks (Field Officer Review & Edit)</span>
              </label>

              {/* Action Buttons for Remarks */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRemarksAccepted(true)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all flex items-center space-x-1 ${
                    isRemarksAccepted
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isRemarksAccepted ? 'Remarks Accepted' : 'Accept AI Remarks'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsEditingRemarks(true);
                    setIsRemarksAccepted(false);
                  }}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-lg border border-slate-700 flex items-center space-x-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Remarks</span>
                </button>

                <button
                  type="button"
                  onClick={handleAnalyzeWithAI}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 flex items-center space-x-1"
                  title="Regenerate AI Remarks"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>

            <textarea
              rows={3}
              value={editableRemarks}
              onChange={(e) => {
                setEditableRemarks(e.target.value);
                setIsRemarksAccepted(false);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans leading-relaxed"
            ></textarea>
            <p className="text-[10px] text-slate-500">
              The Field Officer may refine or append specific on-ground observations before submitting the official report.
            </p>
          </div>

          {/* SECTION 8: PRACTICAL AI RECOMMENDATIONS */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-cyan-400 font-display flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Recommended Action Items for Project Management & Contractor</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {aiResult.aiRecommendations.map((rec, idx) => (
                <div key={idx} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800/80 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200 font-medium">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 11: SUBMIT INSPECTION BUTTON */}
          <form onSubmit={handleSubmitInspection} className="pt-2 border-t border-slate-800">
            <button
              type="submit"
              disabled={isSubmittingInspection}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 disabled:opacity-50 text-white font-extrabold text-base rounded-xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2.5 cursor-pointer hover:scale-[1.01]"
            >
              {isSubmittingInspection ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>Submitting to Supabase...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-5 h-5" />
                  <span>Submit Inspection & Update Command Dashboard</span>
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-2">
              Saves inspection metadata and AI results to Supabase. Real-time update triggers alerts if risk is High or Critical.
            </p>
          </form>

        </div>
      )}

      {/* Photo Full-Resolution Preview Modal */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 max-w-4xl w-full space-y-3 relative shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>Supabase Storage Photo Preview</span>
              </h3>
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-center max-h-[75vh] overflow-hidden rounded-xl bg-black border border-slate-800">
              <img src={previewPhotoUrl} alt="Inspection Photo Preview" className="max-h-[75vh] w-auto object-contain" />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
