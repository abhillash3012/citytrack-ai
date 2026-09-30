import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DocumentItem } from '../types';

export const DOCUMENT_BUCKET = 'documents';
export const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024; // 25MB

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png'
];

export interface DocumentUploadOptions {
  projectId: string;
  userId?: string;
  title: string;
  category: DocumentItem['category'];
  fileType: DocumentItem['fileType'];
  version?: string;
}

export interface DocumentUploadResult {
  document: DocumentItem;
  signedUrl: string;
  error: string | null;
}

/**
 * Validate document file type and size
 */
export function validateDocument(file: File): string | null {
  if (!file) return 'No document selected.';

  const isAllowed = ALLOWED_DOCUMENT_TYPES.includes(file.type) ||
    file.name.endsWith('.pdf') ||
    file.name.endsWith('.docx') ||
    file.name.endsWith('.doc') ||
    file.name.endsWith('.xlsx') ||
    file.name.endsWith('.xls') ||
    file.name.endsWith('.png') ||
    file.name.endsWith('.jpg');

  if (!isAllowed) {
    return `Unsupported document format (${file.type || 'unknown'}). Allowed: PDF, DOCX, XLSX, JPG, PNG.`;
  }

  if (file.size > MAX_DOCUMENT_SIZE) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return `File size (${sizeMb} MB) exceeds maximum limit of 25 MB.`;
  }

  return null;
}

/**
 * Upload document to private `documents` bucket:
 * documents/{project_id}/{user_id}/{timestamp}-{filename}
 */
export async function uploadProjectDocument(
  file: File,
  options: DocumentUploadOptions
): Promise<DocumentUploadResult> {
  const validationError = validateDocument(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const pId = options.projectId || 'general';
  const uId = options.userId || 'officer';
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${pId}/${uId}/${timestamp}-${safeName}`;

  const docId = `DOC-${timestamp}`;
  const fileSizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

  if (!isSupabaseConfigured) {
    const mockDoc: DocumentItem = {
      id: docId,
      projectId: options.projectId,
      title: options.title || file.name,
      category: options.category || 'Government Approval',
      fileType: options.fileType || 'PDF',
      fileSize: fileSizeStr,
      uploadedBy: options.userId || 'Officer',
      uploadedAt: new Date().toISOString().split('T')[0],
      version: options.version || 'v1.0',
      fileUrl: URL.createObjectURL(file)
    };
    return {
      document: mockDoc,
      signedUrl: mockDoc.fileUrl,
      error: null
    };
  }

  try {
    // 1. Upload to private Supabase storage
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .upload(storagePath, file, {
        upsert: true,
        contentType: file.type || 'application/pdf'
      });

    if (uploadErr) {
      console.warn('Supabase document upload notice:', uploadErr.message);
      const fallbackUrl = URL.createObjectURL(file);
      const fallbackDoc: DocumentItem = {
        id: docId,
        projectId: options.projectId,
        title: options.title || file.name,
        category: options.category,
        fileType: options.fileType,
        fileSize: fileSizeStr,
        uploadedBy: options.userId || 'Officer',
        uploadedAt: new Date().toISOString().split('T')[0],
        version: options.version || 'v1.0',
        fileUrl: fallbackUrl
      };
      return { document: fallbackDoc, signedUrl: fallbackUrl, error: uploadErr.message };
    }

    // 2. Generate signed URL for private document download (valid for 1 hour)
    const { data: signedData } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .createSignedUrl(uploadData.path, 3600);

    const signedUrl = signedData?.signedUrl || URL.createObjectURL(file);

    // 3. Record document in `documents` table
    try {
      await supabase.from('documents').insert({
        project_id: options.projectId,
        uploaded_by: options.userId || null,
        name: options.title || file.name,
        document_type: options.category,
        file_path: uploadData.path,
        file_size: file.size,
        mime_type: file.type,
        version: 1
      });
    } catch (e) {
      console.warn('Notice inserting into documents table:', e);
    }

    const finalDoc: DocumentItem = {
      id: docId,
      projectId: options.projectId,
      title: options.title || file.name,
      category: options.category,
      fileType: options.fileType,
      fileSize: fileSizeStr,
      uploadedBy: options.userId || 'Officer',
      uploadedAt: new Date().toISOString().split('T')[0],
      version: options.version || 'v1.0',
      fileUrl: signedUrl
    };

    return {
      document: finalDoc,
      signedUrl,
      error: null
    };
  } catch (err: any) {
    console.error('Error uploading document:', err);
    throw new Error(err.message || 'Failed to upload document.');
  }
}

/**
 * Get signed download URL for private document
 */
export async function getDocumentSignedUrl(filePath: string, expiresInSeconds = 3600): Promise<string> {
  if (!isSupabaseConfigured || !filePath || filePath.startsWith('blob:') || filePath.startsWith('http')) {
    return filePath;
  }

  try {
    const { data, error } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .createSignedUrl(filePath, expiresInSeconds);

    if (error) {
      console.warn('Error creating signed URL for document:', error.message);
      return filePath;
    }

    return data?.signedUrl || filePath;
  } catch (err) {
    return filePath;
  }
}
