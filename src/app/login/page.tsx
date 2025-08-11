
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/logo';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Home, BarChart2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { User } from '@supabase/supabase-js';
import { Skeleton } from '@/components/ui/skeleton';

const loginSchema = z.object({
  email: z.string().refine(
    (value) => {
      // Allow standard email format or staff@tabill.com format
      const standardEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const staffEmailRegex = /^[^\s@]+@tabill\.com$/;
      return standardEmailRegex.test(value) || staffEmailRegex.test(value);
    }, 
    { message: 'Please enter a valid email address or staff@tabill.com' }
  ),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginView() {
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithGoogle, signInWithEmailAndPassword, user, loading, signOut, appUser, profile_complete } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (user) {
      if (!user.email_confirmed_at) {
        setError('Please verify your email address before logging in. Check your inbox for a verification link.');
        // Don't redirect, just show the error.
      } else if (appUser && !appUser.profile_complete) {
        router.push('/profile');
      } else if (profile_complete) {
        const redirectUrl = searchParams.get('redirect') || '/reports';
        router.push(redirectUrl);
      }
    }
  }, [user, appUser, profile_complete, router, searchParams]);

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithGoogle();
      // The useEffect will handle the redirect
    } catch (err: any) {
      setError('Failed to sign in with Google. Please try again.');
      console.error(err);
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    setError('');
    try {
      await signInWithEmailAndPassword(data.email, data.password);
      // The useEffect will now handle logic based on user state change.
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
        console.error(err);
      }
    }
  };


  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
          <p className="text-muted-foreground">Checking your session…</p>
        </div>
      </div>
    );
  }

  // Do not show login page if a verified user is already logged in and profile is complete
  if (user && user.email_confirmed_at && profile_complete) {
      return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
       <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
           <Link href="/" className="flex items-center gap-2">
            <Logo />
           </Link>
           <Button asChild variant="ghost">
              <Link href="/signup">
                Sign Up
              </Link>
            </Button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="mx-auto max-w-sm w-full">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
            <CardDescription>Sign in to access your restaurant dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Login Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="priya@example.com or priya@tabill.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </Form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button onClick={handleGoogleSignIn} variant="outline" className="w-full font-bold">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C41.38,36.218,44,30.668,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
                Sign in with Google
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-screen items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                </div>
            </div>
        }>
            <LoginView />
        </Suspense>
    )
}
