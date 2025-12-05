"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { MedplumClient } from '@medplum/core';
import type { Resource } from '@medplum/fhirtypes';

const MEDPLUM_BASE_URL = process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL || 'http://localhost:8103';

interface MedplumAuthContextType {
  medplum: MedplumClient;
  profile: Resource | null;
  loading: boolean;
  isAuthenticated: boolean;
  clinicId: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => string | undefined;
  setClinicId: (clinicId: string | null) => Promise<void>;
}

const MedplumAuthContext = createContext<MedplumAuthContextType | null>(null);

export function MedplumAuthProvider({ children }: { children: React.ReactNode }) {
  const [medplum] = useState(() => new MedplumClient({
    baseUrl: MEDPLUM_BASE_URL,
    onUnauthenticated: () => {
      setProfile(null);
      // Clear stored token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('medplum-access-token');
        sessionStorage.removeItem('medplum-access-token');
      }
    },
  }));

  const [profile, setProfile] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [clinicId, setClinicIdState] = useState<string | null>(null);

  const persistClinicId = async (nextClinicId: string | null) => {
    setClinicIdState(nextClinicId);
    if (typeof window !== 'undefined') {
      if (nextClinicId) {
        localStorage.setItem('clinic-id', nextClinicId);
      } else {
        localStorage.removeItem('clinic-id');
      }
    }

    try {
      const accessToken = medplum.getAccessToken();
      await fetch('/api/auth/medplum-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, clinicId: nextClinicId }),
      });
    } catch (error) {
      console.warn('⚠️ [EMR] Failed to persist clinicId to session cookie:', error);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to restore session from localStorage
        const storedToken = localStorage.getItem('medplum-access-token');
        const storedClinic = localStorage.getItem('clinic-id');
        if (storedClinic) {
          setClinicIdState(storedClinic);
        }
        if (storedToken) {
          medplum.setAccessToken(storedToken);
          const profile = await medplum.getProfile();
          setProfile(profile as Resource | null);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem('medplum-access-token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [medplum]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 [EMR] Starting login...');
      console.log('📧 [EMR] Email:', email);
      console.log('🌐 [EMR] Medplum URL:', MEDPLUM_BASE_URL);
      // Sign in with Medplum - if this succeeds, we consider the user logged in.
      console.log('🔐 [EMR] Calling medplum.startLogin...');
      const loginResponse = await medplum.startLogin({ email, password });
      console.log('✅ [EMR] Login response received');

      // We no longer hard‑require a profile here. Some Medplum setups allow
      // a user to exist without a linked Practitioner/Patient, and that's OK
      // for basic EMR access as long as we have a valid access token.
      try {
        const maybeProfile = await medplum.getProfile();
        if (maybeProfile) {
          console.log('✅ [EMR] Profile loaded:', maybeProfile.resourceType, maybeProfile.id);
          setProfile(maybeProfile as Resource | null);
        } else {
          console.warn('⚠️ [EMR] getProfile() returned null/undefined – proceeding with token‑only auth');
          setProfile(null);
        }
      } catch (profileError) {
        console.warn('⚠️ [EMR] Failed to load profile – proceeding with token‑only auth:', profileError);
        setProfile(null);
      }

      // Store access token
      const accessToken = medplum.getAccessToken();
      console.log('🔐 [EMR] Access token:', accessToken ? 'EXISTS' : 'MISSING');

      if (accessToken) {
        localStorage.setItem('medplum-access-token', accessToken);
        console.log('✅ [EMR] Token stored in localStorage');

        // Also create session cookie for server-side auth
        try {
          const sessionResponse = await fetch('/api/auth/medplum-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken }),
          });
          console.log('✅ [EMR] Session cookie created:', sessionResponse.ok);
        } catch (sessionError) {
          console.warn('⚠️  [EMR] Failed to create session cookie:', sessionError);
          // Not critical, continue anyway
        }
      }

      console.log('🎉 [EMR] Login successful!');
    } catch (error: any) {
      console.error('❌ [EMR] Login failed:', error);
      console.error('❌ [EMR] Error message:', error.message);
      console.error('❌ [EMR] Error details:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  const signOut = async () => {
    try {
      // Clear Medplum session
      medplum.signOut();
      setProfile(null);
      setClinicIdState(null);

      // Clear stored tokens
      localStorage.removeItem('medplum-access-token');
      sessionStorage.removeItem('medplum-access-token');
      localStorage.removeItem('clinic-id');

      // Clear server session cookie
      await fetch('/api/auth/medplum-session', {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getAccessToken = () => {
    return medplum.getAccessToken();
  };

  const value: MedplumAuthContextType = {
    medplum,
    profile,
    loading,
    isAuthenticated: profile !== null,
    clinicId,
    signIn,
    signOut,
    getAccessToken,
    setClinicId: persistClinicId,
  };

  return (
    <MedplumAuthContext.Provider value={value}>
      {children}
    </MedplumAuthContext.Provider>
  );
}

export function useMedplumAuth() {
  const context = useContext(MedplumAuthContext);
  if (!context) {
    throw new Error('useMedplumAuth must be used within MedplumAuthProvider');
  }
  return context;
}

// Helper to get user role from profile
export function getUserRole(profile: Resource | null): string | null {
  if (!profile) return null;

  // Profile can be Practitioner, Patient, RelatedPerson, etc.
  const resourceType = profile.resourceType;

  // For practitioners, check their role
  if (resourceType === 'Practitioner') {
    // Role would come from PractitionerRole or custom extension
    // For now, return a default or check extensions
    return 'practitioner';
  }

  if (resourceType === 'Patient') {
    return 'patient';
  }

  // Check for admin role (typically in extensions or project membership)
  return 'user';
}

// Check if user has specific role
export function hasRole(profile: Resource | null, roles: string[]): boolean {
  const userRole = getUserRole(profile);
  return userRole ? roles.includes(userRole) : false;
}

// Shortcut hook to access clinic context without exposing full auth details
export function useClinic() {
  const { clinicId, setClinicId } = useMedplumAuth();
  return { clinicId, setClinicId };
}
