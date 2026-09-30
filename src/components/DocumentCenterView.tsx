import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileText, Search, Download, Eye, Upload, X, CheckCircle2, RefreshCw } from 'lucide-react';
import { DocumentItem } from '../types';
import { uploadProjectDocument } from '../services/supabase/storageService';


export const DocumentCenterView: React.FC = () => {
  const { projects, addDocumentToProject, userRole, userEmail } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState<string>(projects[0]?.id || 'PRJ-GHMC-2026-001');
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<DocumentItem['category']>('Project Proposal');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  // Flatten documents across projects
  const allDocs: DocumentItem[] = projects.flatMap(p => p.documents);

  const filteredDocs = allDocs.filter(d => {
    const matchesSearch = !searchTerm.trim() || d.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || d.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !targetProjectId) return;

    setIsUploading(true);
    setUploadNotice(null);

    try {
      let fileUrl = 'https://citytrack.gov.in/docs/sample_sanction.pdf';
      let fileSize = '1.8 MB';
      let fileType: DocumentItem['fileType'] = 'PDF';

      if (selectedFile) {
        // Upload to Supabase Storage ('documents' bucket)
        fileUrl = await uploadProjectDocument(selectedFile, targetProjectId);
        fileSize = `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`;
        const ext = selectedFile.name.split('.').pop()?.toUpperCase();
        if (ext === 'DOCX' || ext === 'DOC') fileType = 'DOCX';
        else if (ext === 'XLSX' || ext === 'XLS') fileType = 'XLSX';
        else if (ext === 'JPG' || ext === 'PNG') fileType = 'JPG';
        else fileType = 'PDF';
      }

      await addDocumentToProject(targetProjectId, {
        projectId: targetProjectId,
        title: docTitle,
        category: docCategory,
        fileType,
        fileSize,
        uploadedBy: `${userRole} (${userEmail.split('@')[0]})`,
        version: 'v1.0',
        fileUrl
      });

      setIsUploading(false);
      setUploadNotice(`Document "${docTitle}" uploaded successfully to Supabase Storage.`);
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadNotice(null);
        setDocTitle('');
        setSelectedFile(null);
      }, 1500);
    } catch (err) {
      console.error('Error uploading document:', err);
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold font-display text-white">Central Project Document Repository</h1>
          <p className="text-xs text-slate-400">Sanction orders, DPRs, contracts, inspection reports & work orders stored on Supabase Storage</p>
        </div>

        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center space-x-2 shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document to Storage</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search document title or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="py-1.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shrink-0"
        >
          <option value="ALL">All Categories</option>
          <option value="Government Approval">Government Approval</option>
          <option value="Project Proposal">Project Proposal</option>
          <option value="Contract">Contract</option>
          <option value="Inspection Report">Inspection Report</option>
          <option value="Completion Certificate">Completion Certificate</option>
        </select>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((docItem) => (
          <div key={docItem.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3 hover:border-slate-700 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-500/10 rounded-xl text-cyan-400 border border-blue-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">{docItem.fileType} • {docItem.fileSize}</span>
                  <h3 className="text-xs font-bold text-white line-clamp-1">{docItem.title}</h3>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400">Category: {docItem.category} • Ver {docItem.version}</p>
            <p className="text-[10px] text-slate-500">Uploaded by {docItem.uploadedBy} on {docItem.uploadedAt}</p>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-end space-x-2">
              <button
                onClick={() => setPreviewDoc(docItem)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg transition-colors flex items-center space-x-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
              <a
                href={docItem.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Upload Document to Supabase Storage</span>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadNotice && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{uploadNotice}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Infrastructure Project</label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DPR Sanction Order v2"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Project Proposal">Project Proposal</option>
                  <option value="Government Approval">Government Approval</option>
                  <option value="Contract">Contract</option>
                  <option value="Tender Document">Tender Document</option>
                  <option value="Inspection Report">Inspection Report</option>
                  <option value="Bills & Invoices">Bills & Invoices</option>
                  <option value="Completion Certificate">Completion Certificate</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select File (PDF, DOCX, XLSX)</label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                      if (!docTitle) setDocTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Uploading to Supabase Storage...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload & Attach Document</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-white">{previewDoc.title}</span>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-2">
              <FileText className="w-12 h-12 text-cyan-400 mx-auto" />
              <p className="text-xs font-bold text-white">{previewDoc.title}</p>
              <p className="text-[10px] text-slate-400">{previewDoc.category} • {previewDoc.fileSize}</p>
              <p className="text-[10px] text-emerald-400 font-mono">Supabase Storage URL: {previewDoc.fileUrl.slice(0, 40)}...</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
