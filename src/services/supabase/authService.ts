import { supabase } from './config';
import { UserRole } from '../../types';
import { User } from '@supabase/supabase-js';

export const DEMO_OTP = "123456";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  department?: string;
  designation?: string;
  organization?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  lastLogin: string;
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
export async function getCurrentSupabaseUser(): Promise<User | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  } catch (err) {
    console.warn('Error fetching current Supabase user:', err);
    return null;
  }
}

/**
 * Verify Demo OTP (123456), authenticate user via Supabase Auth,
 * store role securely in User Metadata, and sync user profile to database.
 */
export async function verifyDemoOtpAndAuthenticateSupabase(
  otpCode: string,
  selectedRole: UserRole,
  userEmail: string,
  userPhone: string
): Promise<UserProfile> {
  // Validate Demo OTP
  if (otpCode.trim() !== DEMO_OTP) {
    throw new Error(`Invalid OTP. Please enter ${DEMO_OTP} for this prototype.`);
  }

  const normalizedPhone = normalizePhoneNumber(userPhone);
  const userName = userEmail.split('@')[0]?.toUpperCase() || `${selectedRole} User`;
  let uid = `USER-SUPA-${Date.now()}`;

  // 1. Authenticate session via Supabase Auth (Anonymous or User Metadata update)
  try {
    const { data, error } = await supabase.auth.signInAnonymously({
      options: {
        data: {
          role: selectedRole,
          name: userName,
          email: userEmail,
          phone: normalizedPhone,
        }
      }
    });

    if (data?.user) {
      uid = data.user.id;
      // Also update user metadata securely
      await supabase.auth.updateUser({
        data: {
          role: selectedRole,
          name: userName,
          email: userEmail,
          phone: normalizedPhone,
        }
      }).catch(err => console.warn('Supabase metadata update notice:', err));
    } else if (error) {
      console.warn('Supabase Anonymous Auth notice (using generated UID):', error.message);
    }
  } catch (err) {
    console.warn('Supabase Auth error notice:', err);
  }

  // 2. Retrieve or create profile in both 'profiles' and 'users' table
  const existingProfile = await getSupabaseUserProfile(uid);

  const updatedLoginTime = new Date().toLocaleString('en-IN');

  if (existingProfile) {
    const updatedProfile: UserProfile = {
      ...existingProfile,
      role: selectedRole, // Ensure selected role is persisted
      email: userEmail || existingProfile.email,
      phone: normalizedPhone || existingProfile.phone,
      lastLogin: updatedLoginTime
    };

    // Upsert into profiles table
    try {
      await supabase.from('profiles').upsert({
        id: uid,
        email: updatedProfile.email,
        name: updatedProfile.name,
        phone: updatedProfile.phone,
        role: updatedProfile.role,
        department: updatedProfile.department || 'Municipal Infrastructure',
        designation: updatedProfile.designation || updatedProfile.role,
        organization: updatedProfile.organization || 'Telangana State Urban Infrastructure Board',
        status: updatedProfile.status,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('Notice updating profile in Supabase profiles table:', e);
    }

    // Upsert into users table for backwards compatibility
    try {
      await supabase.from('users').upsert({
        uid,
        name: updatedProfile.name,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        role: updatedProfile.role,
        last_login: updatedProfile.lastLogin,
        updated_at: new Date().toISOString()
      }, { onConflict: 'uid' });
    } catch (e) {
      console.warn('Notice updating profile in Supabase users table:', e);
    }

    return updatedProfile;
  }

  // First-time user profile creation
  const newProfile: UserProfile = {
    uid,
    name: userName,
    email: userEmail || 'user@citytrack.gov.in',
    phone: normalizedPhone,
    role: selectedRole,
    department: 'Municipal Infrastructure',
    designation: selectedRole,
    organization: 'Telangana State Urban Infrastructure Board',
    status: 'Active',
    createdAt: new Date().toISOString(),
    lastLogin: updatedLoginTime
  };

  // Save to profiles table
  try {
    await supabase.from('profiles').upsert({
      id: uid,
      email: newProfile.email,
      name: newProfile.name,
      phone: newProfile.phone,
      role: newProfile.role,
      department: newProfile.department,
      designation: newProfile.designation,
      organization: newProfile.organization,
      status: newProfile.status,
      created_at: newProfile.createdAt,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  } catch (e) {
    console.warn('Notice saving user to profiles table:', e);
  }

  // Save to users table (backwards compatibility)
  try {
    await supabase.from('users').upsert({
      uid: newProfile.uid,
      name: newProfile.name,
      email: newProfile.email,
      phone: newProfile.phone,
      role: newProfile.role,
      department: newProfile.department,
      designation: newProfile.designation,
      organization: newProfile.organization,
      status: newProfile.status,
      created_at: newProfile.createdAt,
      last_login: newProfile.lastLogin,
      updated_at: new Date().toISOString()
    }, { onConflict: 'uid' });
  } catch (e) {
    console.warn('Notice saving user to users table:', e);
  }

  return newProfile;
}

/**
 * Listen to Supabase Auth state changes for session persistence across page refreshes
 */
export function listenToSupabaseAuthState(callback: (user: User | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Retrieve User Profile from Supabase (checks both profiles and users tables)
 */
export async function getSupabaseUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    // 1. Try fetching from public.profiles table
    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (profileData) {
      return {
        uid: profileData.id,
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone || '',
        role: (profileData.role as UserRole) || 'Field Officer',
        department: profileData.department || 'Municipal Infrastructure',
        designation: profileData.designation || profileData.role,
        organization: profileData.organization || 'Telangana State Urban Infrastructure Board',
        status: (profileData.status as 'Active' | 'Inactive') || 'Active',
        createdAt: profileData.created_at || new Date().toISOString(),
        lastLogin: new Date().toLocaleString('en-IN')
      };
    }

    if (profileErr) {
      console.warn('Supabase profiles fetch notice:', profileErr.message);
    }

    // 2. Fallback to public.users table
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('uid', uid)
      .maybeSingle();

    if (userData) {
      return {
        uid: userData.uid,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        role: (userData.role as UserRole) || 'Field Officer',
        department: userData.department || 'Municipal Infrastructure',
        designation: userData.designation || userData.role,
        organization: userData.organization || 'Telangana State Urban Infrastructure Board',
        status: (userData.status as 'Active' | 'Inactive') || 'Active',
        createdAt: userData.created_at || new Date().toISOString(),
        lastLogin: userData.last_login || new Date().toLocaleString('en-IN')
      };
    }
  } catch (err) {
    console.warn('Error fetching user profile from Supabase:', err);
  }
  return null;
}

/**
 * Sign out user from Supabase Auth session
 */
export async function signOutSupabaseUser(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Error signing out from Supabase Auth:', err);
  }
}
