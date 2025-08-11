
'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Logo from '@/components/logo';
import { useAuth } from '@/components/auth-provider';
import { toast } from '@/hooks/use-toast';

function SignupInner() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signUpWithEmailAndPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({ title: 'Error', description: 'Please enter both email and password', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    const result = await signUpWithEmailAndPassword(email, password);
    if ((result as any)?.error) {
      toast({ title: 'Signup Error', description: (result as any).error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Please check your email to verify your account' });
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <Button asChild variant="ghost">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="mx-auto max-w-sm w-full">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-headline">Create your account</CardTitle>
            <CardDescription>Sign up to start using your restaurant dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSignup}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="priya@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <Button type="submit" className="w-full">Sign up</Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="underline">Log in</Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function SignupPage() {
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
      <SignupInner />
    </Suspense>
  );
}
