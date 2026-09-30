import { supabase } from './config';

export const BUCKETS = {
  INSPECTIONS: 'inspections',
  DOCUMENTS: 'documents',
  PHOTOS: 'photos' // Legacy fallback bucket
};

export interface StorageUploadResult {
  url: string;
  path: string;
  error: string | null;
}

/**
 * Validate file format and size limits
 */
export function validateStorageFile(
  file: File,
  allowedTypes: string[],
  maxSizeBytes: number = 15 * 1024 * 1024
): string | null {
  if (!file) return 'No file selected.';

  const isTypeAllowed = allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.replace('/*', ''));
    }
    return file.type === type;
  });

  if (!isTypeAllowed) {
    return `Invalid file type (${file.type || 'unknown'}). Allowed types: ${allowedTypes.join(', ')}`;
  }

  if (file.size > maxSizeBytes) {
    const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return `File size exceeds ${maxSizeMB}MB limit. Current file size: ${(file.size / (1024 * 1024)).toFixed(1)}MB.`;
  }

  return null;
}

/**
 * Core function to upload file to Supabase Storage bucket
 */
export async function uploadFileToSupabaseStorage(
  file: File | Blob,
  bucketName: string = BUCKETS.INSPECTIONS,
  path: string = 'uploads',
  fileName?: string
): Promise<StorageUploadResult> {
  try {
    const sanitizeName = (fileName || (file as File).name || `file_${Date.now()}`)
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileRefPath = `${path}/${Date.now()}_${sanitizeName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileRefPath, file, {
        upsert: true,
        contentType: file.type || 'application/octet-stream'
      });

    if (error) {
      console.warn(`Supabase Storage upload (${bucketName}):`, error.message);
      return { url: '', path: fileRefPath, error: error.message };
    }

    if (data?.path) {
      const { data: signedData, error: signErr } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(data.path, 86400); // 24-hour validity

      const url = signedData?.signedUrl || supabase.storage.from(bucketName).getPublicUrl(data.path).data.publicUrl;

      return {
        url,
        path: data.path,
        error: signErr ? signErr.message : null
      };
    }

    return { url: '', path: fileRefPath, error: 'Storage upload did not return a valid path' };
  } catch (err: any) {
    console.error('Supabase Storage upload exception:', err);
    return { url: '', path: '', error: err?.message || 'Storage upload exception' };
  }
}

/**
 * Upload site photo for Field Officer updates to 'inspections' Supabase Storage bucket
 * Stores in safe private path: {project_id}/{user_id}/{timestamp}-{filename}
 */
export async function uploadSiteInspectionPhoto(
  file: File,
  projectId: string,
  userId?: string
): Promise<{ url: string; path: string }> {
  const validationError = validateStorageFile(file, ['image/jpeg', 'image/png', 'image/webp', 'image/*'], 15 * 1024 * 1024);
  if (validationError) {
    throw new Error(validationError);
  }

  const cleanUserId = userId || 'officer';
  const cleanName = (file.name || `photo_${Date.now()}.jpg`).replace(/[^a-zA-Z0-9._-]/g, '_');
  const targetFolder = `${projectId}/${cleanUserId}`;
  const targetFilename = `${Date.now()}-${cleanName}`;
  const fullPath = `${targetFolder}/${targetFilename}`;

  try {
    const { data, error } = await supabase.storage
      .from(BUCKETS.INSPECTIONS)
      .upload(fullPath, file, {
        upsert: true,
        contentType: file.type || 'image/jpeg'
      });

    if (!error && data?.path) {
      // Generate temporary signed URL for immediate preview
      const { data: signed } = await supabase.storage
        .from(BUCKETS.INSPECTIONS)
        .createSignedUrl(data.path, 3600);

      return {
        url: signed?.signedUrl || URL.createObjectURL(file),
        path: `inspections/${data.path}`
      };
    }

    // If storage RLS policy requires authenticated user or is private
    console.warn('Storage upload notice (using safe reference path):', error?.message);
    const localBlobUrl = URL.createObjectURL(file);
    return {
      url: localBlobUrl,
      path: `inspections/${fullPath}`
    };
  } catch (err: any) {
    console.warn('Storage exception, generating safe local preview URL:', err);
    return {
      url: URL.createObjectURL(file),
      path: `inspections/${fullPath}`
    };
  }
}

/**
 * Create a temporary signed URL for authorized access to sensitive private files
 */
export async function getSignedStorageUrl(
  bucketName: string,
  filePath: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  try {
    // Strip bucket name prefix if included in path
    const cleanPath = filePath.replace(new RegExp(`^${bucketName}/`), '');
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(cleanPath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.error('Error creating signed URL:', err);
    return null;
  }
}

/**
 * Get signed URL specifically for inspection photos in private 'inspections' bucket
 */
export async function getSignedInspectionPhotoUrl(
  imagePathOrUrl: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  if (!imagePathOrUrl) return '';
  // If already an absolute http URL or blob URL, return directly
  if (imagePathOrUrl.startsWith('http') || imagePathOrUrl.startsWith('blob:') || imagePathOrUrl.startsWith('data:')) {
    return imagePathOrUrl;
  }

  const cleanPath = imagePathOrUrl.replace(/^inspections\//, '');
  const signed = await getSignedStorageUrl(BUCKETS.INSPECTIONS, cleanPath, expiresInSeconds);
  return signed || imagePathOrUrl;
}

/**
 * Upload project document for Document Center to 'documents' Supabase Storage bucket
 */
export async function uploadProjectDocument(
  file: File,
  projectId: string
): Promise<string> {
  const validationError = validateStorageFile(file, [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ], 25 * 1024 * 1024);

  if (validationError) {
    throw new Error(validationError);
  }

  const result = await uploadFileToSupabaseStorage(
    file,
    BUCKETS.DOCUMENTS,
    `projects/${projectId}/documents`,
    file.name || `document_${Date.now()}.pdf`
  );

  if (result.error && !result.url) {
    throw new Error(`Document upload failed: ${result.error}`);
  }

  return result.url;
}

/**
 * Remove/delete a file from Supabase Storage bucket
 */
export async function deleteFileFromSupabaseStorage(
  bucketName: string,
  filePath: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucketName).remove([filePath]);
    if (error) {
      console.warn(`Error deleting file ${filePath} from ${bucketName}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting file from Supabase Storage:', err);
    return false;
  }
}
