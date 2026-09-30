import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const PHOTO_BUCKET = 'inspections';
export const MAX_PHOTO_SIZE = 15 * 1024 * 1024; // 15MB
export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface PhotoUploadOptions {
  projectId: string;
  userId?: string;
  photoType?: 'Before' | 'Progress' | 'After' | 'Inspection';
  description?: string;
  latitude?: number;
  longitude?: number;
}

export interface PhotoUploadResult {
  filePath: string;
  signedUrl: string;
  publicUrl?: string;
  error: string | null;
}

/**
 * Validate photo format and size limits (15MB, jpg/png/webp)
 */
export function validatePhoto(file: File): string | null {
  if (!file) return 'No photo file provided.';

  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    return `Invalid image format (${file.type}). Allowed formats: JPEG, PNG, WebP.`;
  }

  if (file.size > MAX_PHOTO_SIZE) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return `Image file size (${sizeMb} MB) exceeds maximum allowed limit of 15 MB.`;
  }

  return null;
}

/**
 * Upload photo to private `inspections` bucket with organized path:
 * inspections/{project_id}/{user_id}/{timestamp}-{filename}
 */
export async function uploadProjectPhoto(
  file: File | Blob,
  options: PhotoUploadOptions,
  customFileName?: string
): Promise<PhotoUploadResult> {
  const pId = options.projectId || 'general';
  const uId = options.userId || 'officer';
  const timestamp = Date.now();
  const rawName = customFileName || (file instanceof File ? file.name : `photo_${timestamp}.jpg`);
  const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${pId}/${uId}/${timestamp}-${safeName}`;

  if (!isSupabaseConfigured) {
    const fallbackUrl = file instanceof File || file instanceof Blob ? URL.createObjectURL(file) : '';
    return {
      filePath: storagePath,
      signedUrl: fallbackUrl,
      error: null
    };
  }

  try {
    // 1. Upload to private Supabase Storage
    const { data, error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(storagePath, file, {
        upsert: true,
        contentType: (file as File).type || 'image/jpeg'
      });

    if (error) {
      console.error('Supabase storage photo upload error:', error.message);
      return {
        filePath: storagePath,
        signedUrl: '',
        error: error.message
      };
    }

    // 2. Generate signed URL for private access (expires in 1 hour / 3600 seconds)
    const { data: signedData, error: signError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrl(data.path, 3600);

    const signedUrl = signedData?.signedUrl || '';

    // 3. Save photo record in project_photos table
    try {
      await supabase.from('project_photos').insert({
        project_id: options.projectId,
        uploaded_by: options.userId || null,
        file_path: data.path,
        photo_type: options.photoType || 'Progress',
        description: options.description || null,
        latitude: options.latitude || null,
        longitude: options.longitude || null,
        captured_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Notice saving project_photos record:', e);
    }

    return {
      filePath: data.path,
      signedUrl: signedUrl || (file instanceof File ? URL.createObjectURL(file) : ''),
      error: signError ? signError.message : null
    };
  } catch (err: any) {
    console.error('Error uploading photo:', err);
    return {
      filePath: storagePath,
      signedUrl: file instanceof File ? URL.createObjectURL(file) : '',
      error: err.message || 'Photo upload failed.'
    };
  }
}

/**
 * Get signed URL for an existing private photo
 */
export async function getPhotoSignedUrl(filePath: string, expiresInSeconds = 3600): Promise<string> {
  if (!isSupabaseConfigured || !filePath || filePath.startsWith('blob:') || filePath.startsWith('http')) {
    return filePath;
  }

  try {
    const { data, error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrl(filePath, expiresInSeconds);

    if (error) {
      console.warn('Notice creating signed URL for photo:', error.message);
      return filePath;
    }

    return data?.signedUrl || filePath;
  } catch (err) {
    return filePath;
  }
}
