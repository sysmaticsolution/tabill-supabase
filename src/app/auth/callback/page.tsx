'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { addDays } from 'date-fns';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/login?error=auth_callback_failed');
          return;
        }

        const session = data.session;
        if (!session) {
          router.push('/login');
          return;
        }

        const authUser = session.user;

        // Ensure a users row exists (create minimal profile if missing)
        const { data: existingUser, error: fetchErr } = await supabase
          .from('users')
          .select('*')
          .eq('uid', authUser.id)
          .maybeSingle();

        if (fetchErr) {
          console.error('Fetch user row failed:', fetchErr);
        }

        if (!existingUser) {
          const minimalProfile = {
            uid: authUser.id,
            email: authUser.email || '', // Ensure email is a non-null string
            name: authUser.user_metadata?.full_name || '',
            profile_complete: false,
            subscription_status: 'trial' as const,
            subscription_plan: 'PRO' as const,
            trial_ends_at: addDays(new Date(), 14).toISOString(),
            mobile_number: '',
            restaurant_name: '',
            restaurant_address: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Use upsert in case a row was created previously; conflict target is uid
          const { error: upsertErr } = await supabase
            .from('users')
            .upsert(minimalProfile, { onConflict: 'uid' });

          if (upsertErr) {
            console.error('Upsert minimal profile failed:', upsertErr);
            router.push('/login?error=profile_create_failed');
            return;
          }

          // New user -> go to profile completion
          router.push('/profile');
          return;
        }

        // Existing user -> route based on profile completion
        if (existingUser.profile_complete) {
          router.push('/reports');
        } else {
          router.push('/profile');
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        router.push('/login?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}