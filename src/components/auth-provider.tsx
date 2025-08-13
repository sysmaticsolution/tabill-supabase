
'use client';

import React, { createContext, useContext, useEffect, useState, ComponentType, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { AppUser, StaffMember } from '@/lib/data';
import { isPast, addDays, parseISO } from 'date-fns';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  staffMember: StaffMember | null;
  loading: boolean;
  profile_complete: boolean;
  signInWithGoogle: () => Promise<any>;
  signUpWithEmailAndPassword: (email: string, pass: string) => Promise<any>;
  signInWithEmailAndPassword: (email: string, pass: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfileStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile_complete, setProfileComplete] = useState(false);
  const router = useRouter();
  
  const checkProfileCompletion = useCallback(async (user: User | null) => {
    if (user) {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', user.id)
        .maybeSingle();

      if (userData && !error) {
        setAppUser(userData as AppUser);
        setStaffMember(null); // This is the owner
        const isComplete = userData.profile_complete || false;
        setProfileComplete(isComplete);
        return { isComplete, userData };
      }

      // If not an owner, check if they are a staff member (avoid join to reduce RLS issues)
      {
        const { data: staffRow } = await supabase
          .from('staff_members')
          .select('*')
          .eq('auth_uid', user.id)
          .maybeSingle();

        if (staffRow) {
          setStaffMember(staffRow as any);
          // Load the owner's user row separately
          const { data: ownerUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', (staffRow as any).owner_id)
            .maybeSingle();

          if (ownerUser) {
            setAppUser(ownerUser as AppUser);
            setProfileComplete(true); // Staff profiles are implicitly complete
            return { isComplete: true, userData: ownerUser as AppUser };
          }
        }
      }
    }
    
    // If user is null or no profile found
    setAppUser(null);
    setStaffMember(null);
    setProfileComplete(false);
    return { isComplete: false, userData: null };
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        setLoading(true);
        setUser(session?.user || null);
        await checkProfileCompletion(session?.user || null);
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkProfileCompletion]);

  const handleAuthResult = async (result: any) => {
      setUser(result.data?.user || null);
      await checkProfileCompletion(result.data?.user || null);
      return result;
  };

  const doSignInWithGoogle = async () => {
    setLoading(true);
    try {
        const result = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`
          }
        });
        if (result.error) throw result.error;
        // OAuth will redirect to /auth/callback; no further action needed here.
        return result;
    } catch (error) {
        console.error('Google sign-in failed:', error);
        router.push('/login?error=oauth_error');
        return { error };
    } finally {
        setLoading(false);
    }
  };

  const doSignUpWithEmailAndPassword = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const result = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (result.error) throw result.error;
      
      const newUser = result.data.user;
      if (!newUser) return result;
      
      const profileData = {
        uid: newUser.id,
        email: newUser.email!,
        profile_complete: false,
        subscription_status: 'trial' as const,
        subscription_plan: 'PRO' as const, // All new signups start on PRO trial
        trial_ends_at: addDays(new Date(), 14).toISOString(),
        name: '',
        mobile_number: '',
        restaurant_name: '',
        restaurant_address: ''
      };
      await supabase.from('users').insert(profileData);

      await supabase.auth.signOut(); 
      return result;
    } finally {
      setLoading(false);
    }
  };

    const doSignInWithEmailAndPassword = async (email: string, pass: string) => {
    setLoading(true);
    const processedEmail = email.includes('@') ? email : `${email}@tabill.com`;
    const result = await supabase.auth.signInWithPassword({ email: processedEmail, password: pass });
    setLoading(false);
    
    if (result.error) {
      console.error('Sign-in error:', result.error.message);
      // The UI can use the returned error to display a message to the user
    }
    
    // The onAuthStateChange listener will handle success cases and redirects
    return result;
  };

  const doSignOut = () => {
    return supabase.auth.signOut().then(() => {
      setUser(null);
      setAppUser(null);
      setStaffMember(null);
      setProfileComplete(false);
      router.push('/');
    });
  };

  const refreshProfileStatus = useCallback(async () => {
    if (user) {
        await checkProfileCompletion(user);
    }
  }, [user, checkProfileCompletion]);

  return (
    <AuthContext.Provider value={{ 
        user, 
        appUser, 
        staffMember,
        loading, 
        profile_complete, 
        signInWithGoogle: doSignInWithGoogle, 
        signUpWithEmailAndPassword: doSignUpWithEmailAndPassword, 
        signInWithEmailAndPassword: doSignInWithEmailAndPassword, 
        signOut: doSignOut, 
        refreshProfileStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  const WithAuthComponent: React.FC<P> = (props) => {
    const { user, appUser, loading, profile_complete } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      if (loading) return;

      const publicPaths = ['/profile', '/subscription', '/guide'];
      
      if (!user) {
        router.push(`/login?redirect=${pathname}`);
        return;
      }
      
      // The main owner's profile must be complete
      if (user && appUser && !profile_complete && !publicPaths.includes(pathname)) {
        router.push('/profile');
        return;
      }

      // Check subscription status for everyone, based on the owner's plan
      if (user && appUser && profile_complete && !publicPaths.includes(pathname)) {
          if (appUser.subscription_status === 'lifetime') {
            return; // Lifetime user, no more checks needed.
          }

          let isSubscriptionActive = false;
          if (appUser.subscription_status === 'trial' && appUser.trial_ends_at) {
              isSubscriptionActive = !isPast(parseISO(appUser.trial_ends_at));
          } else if (appUser.subscription_status === 'active' && appUser.subscription_ends_at) {
              isSubscriptionActive = !isPast(parseISO(appUser.subscription_ends_at));
          }
          
          if (!isSubscriptionActive) {
              router.push('/subscription');
              return;
          }
      }

    }, [user, appUser, loading, router, pathname, profile_complete]);

    if (loading || !user) {
      return (
        <div className="flex h-screen w-screen items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        </div>
      );
    }
    
    if (!user) return null;

    if (appUser && !appUser.profile_complete && pathname !== '/profile') {
      return (
        <div className="flex h-screen w-screen items-center justify-center">
          <p>Redirecting to complete your profile...</p>
        </div>
      )
    }

    return <WrappedComponent {...props} />;
  };
  WithAuthComponent.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return WithAuthComponent;
}
