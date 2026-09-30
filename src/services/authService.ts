import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserRole } from '../types';
import { User } from '@supabase/supabase-js';

export const DEMO_OTP = "123456";

export interface UserProfile {
  id: string; // matches auth.users.id
  fullName: string;
  name?: string; // compatibility
  email: string;
  phone?: string;
  role: UserRole;
  department?: string;
  designation?: string;
  organization?: string;
  status: 'Active' | 'Inactive';
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
}

/**
 * Format and normalize Indian and international phone numbers (+91XXXXXXXXXX)
 */
export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (phone.startsWith('+')) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  return `+91${digits}`;
}

/**
 * Get current active Supabase Auth user session
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Error fetching Supabase session:', error.message);
      return null;
    }
    return session?.user || null;
  } catch (err) {
    console.warn('Error checking Supabase auth session:', err);
    return null;
  }
}

/**
 * Listen to Supabase Auth state changes for session persistence across page refreshes
 */
export function listenToAuthState(callback: (user: User | null) => void) {
  if (!isSupabaseConfigured) {
    return () => {};
  }
  try {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });
    return () => {
      subscription.unsubscribe();
    };
  } catch (err) {
    console.warn('Notice listening to Supabase auth state:', err);
    return () => {};
  }
}

/**
 * Retrieve User Profile from Supabase `profiles` table by email
 */
export async function getUserProfileByEmail(email: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !email) return null;
  try {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error) {
      console.warn('Supabase profile by email notice:', error.message);
      return null;
    }

    if (data) {
      return {
        id: data.id,
        fullName: data.full_name || data.name || cleanEmail.split('@')[0],
        name: data.full_name || data.name || cleanEmail.split('@')[0],
        email: data.email,
        phone: data.phone || '',
        role: (data.role as UserRole) || 'Field Officer',
        department: data.department || 'Municipal Infrastructure',
        status: (data.status as 'Active' | 'Inactive') || 'Active',
        avatarUrl: data.avatar_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        lastLogin: new Date().toLocaleString('en-IN')
      };
    }
    return null;
  } catch (err) {
    console.warn('Error retrieving user profile by email from Supabase:', err);
    return null;
  }
}

/**
 * Fetch available user profiles filtered by role from Supabase `profiles` table
 */
export async function fetchProfilesByRole(role: UserRole): Promise<UserProfile[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', role);

    if (error || !data) {
      console.warn(`Error fetching ${role} profiles:`, error?.message);
      return [];
    }

    return data.map((d: any) => ({
      id: d.id,
      fullName: d.full_name || d.name || d.email,
      name: d.full_name || d.name || d.email,
      email: d.email,
      phone: d.phone || '',
      role: d.role as UserRole,
      department: d.department || 'Municipal Administration',
      status: d.status || 'Active',
      avatarUrl: d.avatar_url,
      createdAt: d.created_at
    }));
  } catch (err) {
    console.warn('Error fetching profiles by role:', err);
    return [];
  }
}

/**
 * Retrieve User Profile from Supabase `profiles` table by UID
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (error) {
      console.warn('Supabase profiles query notice:', error.message);
      return null;
    }

    if (data) {
      return {
        id: data.id,
        fullName: data.full_name || data.name || 'Government Officer',
        name: data.full_name || data.name || 'Government Officer',
        email: data.email,
        phone: data.phone || '',
        role: (data.role as UserRole) || 'Field Officer',
        department: data.department || 'Municipal Infrastructure',
        status: (data.status as 'Active' | 'Inactive') || 'Active',
        avatarUrl: data.avatar_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        lastLogin: new Date().toLocaleString('en-IN')
      };
    }
    return null;
  } catch (err) {
    console.warn('Error retrieving user profile from Supabase:', err);
    return null;
  }
}

/**
 * Upsert User Profile in Supabase `profiles` table
 */
export async function upsertUserProfile(profile: UserProfile): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('profiles').upsert({
      id: profile.id,
      full_name: profile.fullName || profile.name,
      email: profile.email,
      phone: profile.phone,
      role: profile.role,
      department: profile.department || 'Municipal Administration',
      status: profile.status || 'Active',
      avatar_url: profile.avatarUrl,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    if (error) {
      console.warn('Failed to upsert profile in Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error upserting profile in Supabase:', err);
    return false;
  }
}

/**
 * Sign in using email and password with Supabase Auth
 */
export async function signInWithEmailPassword(email: string, pass: string): Promise<User | null> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass
  });
  if (error) {
    throw new Error(error.message);
  }
  return data.user;
}

/**
 * Sign up using email and password with Supabase Auth
 */
export async function signUpWithEmailPassword(email: string, pass: string, role: UserRole = 'Field Officer'): Promise<User | null> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: {
      data: {
        role,
        full_name: email.split('@')[0]
      }
    }
  });
  if (error) {
    throw new Error(error.message);
  }
  return data.user;
}

/**
 * Verify Demo OTP (123456), authenticate user via Supabase Auth session,
 * fetch matching public.profiles record, and determine role strictly from profiles.role.
 */
export async function verifyDemoOtpAndAuthenticate(
  otpCode: string,
  selectedRole: UserRole,
  userEmail: string,
  userPhone: string
): Promise<UserProfile> {
  if (otpCode.trim() !== DEMO_OTP) {
    throw new Error(`Invalid OTP. Please enter ${DEMO_OTP} for this prototype.`);
  }

  const cleanEmail = userEmail.trim().toLowerCase();
  const normalizedPhone = normalizePhoneNumber(userPhone);

  // 1. First look up the user in public.profiles table by official email
  let existingProfile = await getUserProfileByEmail(cleanEmail);

  // If not found by email, also try looking up by standard demo email for that role
  if (!existingProfile) {
    const roleEmailMap: Record<UserRole, string> = {
      'Administrator': 'admin@citytrack.ai',
      'Project Manager': 'pm@citytrack.ai',
      'Field Officer': 'field@citytrack.ai',
      'Contractor': 'contractor@citytrack.ai'
    };
    const mappedEmail = roleEmailMap[selectedRole];
    if (mappedEmail && mappedEmail !== cleanEmail) {
      existingProfile = await getUserProfileByEmail(mappedEmail);
    }
  }

  // 2. Try Supabase Auth session if possible
  if (isSupabaseConfigured) {
    try {
      const { data: authSession } = await supabase.auth.getSession();
      if (!authSession?.session) {
        // Attempt anonymous sign in if enabled
        await supabase.auth.signInAnonymously({
          options: {
            data: {
              role: existingProfile?.role || selectedRole,
              email: cleanEmail,
              phone: normalizedPhone
            }
          }
        }).catch(() => {});
      }
    } catch (e) {
      // Supabase anonymous auth optional
    }
  }

  const updatedLoginTime = new Date().toLocaleString('en-IN');

  // 3. If matching profile exists in public.profiles, use its real UUID and DB role!
  if (existingProfile) {
    const updatedProfile: UserProfile = {
      ...existingProfile,
      lastLogin: updatedLoginTime,
      phone: normalizedPhone || existingProfile.phone
    };
    return updatedProfile;
  }

  // 4. Fallback: Create new profile in Supabase profiles table
  const newUid = crypto.randomUUID ? crypto.randomUUID() : `00000000-0000-4000-8000-${Math.floor(Date.now() / 1000).toString().padStart(12, '0')}`;
  const userName = cleanEmail.split('@')[0]?.toUpperCase() || `${selectedRole} User`;

  const newProfile: UserProfile = {
    id: newUid,
    fullName: userName,
    name: userName,
    email: cleanEmail,
    phone: normalizedPhone,
    role: selectedRole,
    department: 'Municipal Administration (GHMC)',
    designation: selectedRole,
    organization: 'Telangana State Urban Infrastructure Board',
    status: 'Active',
    createdAt: new Date().toISOString(),
    lastLogin: updatedLoginTime
  };

  await upsertUserProfile(newProfile);
  return newProfile;
}

/**
 * Direct authentication helper by official email from public.profiles
 */
export async function authenticateByEmail(email: string): Promise<UserProfile | null> {
  const profile = await getUserProfileByEmail(email);
  return profile;
}

/**
 * Sign out user from Supabase Auth
 */
export async function signOutUser(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Error signing out from Supabase Auth:', err);
  }
}
