/**
 * CityTrack AI — Centralized Supabase Error Formatter
 * Formats database, auth, and storage errors for clear logging and user feedback
 * without exposing sensitive credentials.
 */

export interface FormattedSupabaseError {
  operation: string;
  table?: string;
  bucket?: string;
  path?: string;
  status?: number;
  code?: string;
  message: string;
  details?: string | null;
  hint?: string | null;
  userFacingMessage: string;
}

export function formatSupabaseError(
  operation: string,
  errorOrTable: any,
  contextOrError?: any
): FormattedSupabaseError {
  let error: any;
  let context: { table?: string; bucket?: string; path?: string } = {};

  if (typeof errorOrTable === 'string') {
    context = { table: errorOrTable };
    error = contextOrError;
  } else {
    error = errorOrTable;
    context = contextOrError || {};
  }

  const code = error?.code || error?.status || 'UNKNOWN';
  const rawMessage = error?.message || (typeof error === 'string' ? error : 'An unexpected database error occurred');
  const details = error?.details || null;
  const hint = error?.hint || null;
  const status = error?.status || (typeof error?.code === 'number' ? error.code : undefined);

  // Structured console log for debugging
  console.group(`[Supabase] ${operation} failed`);
  if (context?.table) console.error(`table: ${context.table}`);
  if (context?.bucket) console.error(`bucket: ${context.bucket}`);
  if (context?.path) console.error(`path: ${context.path}`);
  if (status) console.error(`status: ${status}`);
  if (code) console.error(`code: ${code}`);
  console.error(`message: ${rawMessage}`);
  if (details) console.error(`details: ${details}`);
  if (hint) console.error(`hint: ${hint}`);
  console.groupEnd();

  // Create clean user-facing error message
  let userFacingMessage = rawMessage;
  if (code === '42501' || rawMessage?.includes('row-level security')) {
    userFacingMessage = `Permission Denied [42501]: You do not have permissions for this action. Please verify your administrative role and session.`;
  } else if (code === '23505') {
    userFacingMessage = `Duplicate Entry [23505]: A record with this identifier already exists.`;
  } else if (code === '23503') {
    userFacingMessage = `Reference Error [23503]: The referenced project or user ID does not exist in the database.`;
  } else if (code === '23514') {
    userFacingMessage = `Validation Error [23514]: One or more fields violate database constraints (e.g. invalid status or severity value).`;
  } else if (code === '22P02') {
    userFacingMessage = `Data Format Error [22P02]: Invalid UUID or numeric input format.`;
  } else if (rawMessage?.toLowerCase().includes('failed to fetch')) {
    userFacingMessage = `Network Error: Unable to reach Supabase server. Please check your internet connection.`;
  }

  return {
    operation,
    table: context?.table,
    bucket: context?.bucket,
    path: context?.path,
    status,
    code: String(code),
    message: rawMessage,
    details,
    hint,
    userFacingMessage
  };
}
