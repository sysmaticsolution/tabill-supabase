
'use client';

import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AppUser } from '@/lib/data';

import { format, differenceInDays, isPast } from 'date-fns';
import { AlertTriangle, CheckCircle, CreditCard, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { supabase } from '@/lib/supabase';

function SubscriptionStatus({ appUser }: { appUser: AppUser }) {
  const { subscription_status, trial_ends_at, subscription_ends_at } = appUser as any;

  if (subscription_status === 'lifetime') {
    return (
      <div className="text-center p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-300 dark:border-green-700">
          <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <p className="font-semibold text-green-800 dark:text-green-200">You have a lifetime subscription.</p>
          </div>
          <p className="text-sm text-green-600 dark:text-green-300 mt-1">Thank you for being a valued partner.</p>
      </div>
    );
  }
  
  if (subscription_status === 'trial') {
    const trialEndDate = trial_ends_at ? new Date(trial_ends_at) : null;
    if (trialEndDate && !isPast(trialEndDate)) {
      const daysLeft = differenceInDays(trialEndDate, new Date());
      return (
        <div className="text-center p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-300 dark:border-blue-700">
          <p className="font-semibold text-blue-800 dark:text-blue-200">You are on a free trial.</p>
          <p className="text-blue-600 dark:text-blue-300">
            You have <span className="font-bold">{daysLeft}</span> {daysLeft === 1 ? 'day' : 'days'} left.
          </p>
          <p className="text-xs mt-1 text-blue-500 dark:text-blue-400">Your trial ends on {format(trialEndDate, 'PPP')}.</p>
        </div>
      );
    }
  }

  const subEndDate = subscription_ends_at ? new Date(subscription_ends_at) : null;
  if (subscription_status === 'active' && subEndDate && !isPast(subEndDate)) {
      return (
          <div className="text-center p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-300 dark:border-green-700">
              <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <p className="font-semibold text-green-800 dark:text-green-200">Your subscription is active.</p>
              </div>
              <p className="text-sm text-green-600 dark:text-green-300 mt-1">Your plan is active until {format(subEndDate, 'PPP')}.</p>
          </div>
      );
  }

  return (
    <div className="text-center p-4 bg-destructive/20 rounded-lg border border-destructive/50">
        <div className="flex items-center justify-center gap-2">
           <AlertTriangle className="h-5 w-5 text-destructive" />
           <p className="font-semibold text-destructive">Your Subscription has Expired!</p>
        </div>
        <p className="text-sm text-destructive/80 mt-1">Please pay to continue using the app.</p>
    </div>
  );
}

export default function SubscriptionPage() {
  const { appUser, user, loading, refreshProfileStatus } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handlePayment = async () => {
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !user || !appUser) {
        toast({ title: "Error", description: "Payment gateway is not configured or user not found.", variant: "destructive" });
        return;
    }

    let res;
    let razorpayOrder;

    try {
      res = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 500 * 100, currency: 'INR', userId: user.id }),
      });

      razorpayOrder = await res.json();
      
      if (!res.ok) {
        throw new Error(razorpayOrder.error || 'Failed to create payment order.');
      }
    } catch(err: any) {
        console.error('Error creating payment order:', err);
        toast({ 
            title: 'Payment Error', 
            description: `Could not create payment order. ${err.message}`, 
            variant: 'destructive'
        });
        return;
    }
    
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: 'Tabill Subscription',
      description: 'Monthly Standard Plan',
      order_id: razorpayOrder.id,
      handler: async function () {
        toast({ title: 'Payment Processing', description: 'Your payment is being processed. This page will update automatically.' });
        const interval = setInterval(async () => {
          await refreshProfileStatus();
          const { data } = await supabase
            .from('users')
            .select('subscription_status')
            .eq('uid', user.id)
            .maybeSingle();
          if (data?.subscription_status === 'active') {
            clearInterval(interval);
            toast({ title: 'Payment Successful!', description: 'Your subscription is now active.' });
            router.push('/reports');
          }
        }, 3000);
        setTimeout(() => clearInterval(interval), 30000);
      },
      prefill: {
        name: user?.user_metadata?.full_name || '',
        email: user?.email || '',
        contact: (appUser as any)?.mobile_number || '',
      },
      notes: {
        userId: user.id,
        orderId: razorpayOrder.id,
        type: 'subscription',
      },
      theme: { color: '#8A9A5B' },
    } as any;
    
    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', function (response: any) {
        toast({ title: 'Payment Failed', description: `Error: ${response.error.description}`, variant: 'destructive' });
    });
    rzp.open();
  }

  if (loading || !appUser) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const canPay = (appUser as any).subscription_status !== 'lifetime';

  return (
    <>
      <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="flex flex-col gap-6">
          <Card className="max-w-2xl mx-auto w-full">
            <CardHeader>
              <CardTitle className="font-headline text-3xl">Subscription</CardTitle>
              <CardDescription>
                Manage your plan and billing details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <SubscriptionStatus appUser={appUser as any} />

              <div>
                <h3 className="text-lg font-semibold mb-2">Current Plan</h3>
                 <Card className="bg-muted/50">
                     <CardContent className="p-4 flex items-center justify-between">
                          <div>
                             <p className="font-bold text-lg">Standard Plan</p>
                             <p className="text-muted-foreground text-sm capitalize">{(appUser as any).subscription_status}</p>
                          </div>
                          <div className="text-right">
                             <p className="font-bold text-lg">Rs. 500 / month</p>
                             <p className="text-muted-foreground text-sm">Billed monthly</p>
                          </div>
                     </CardContent>
                 </Card>
              </div>
              {canPay && (
                <>
                <Button size="lg" className="w-full" onClick={handlePayment}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay Now & Subscribe
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  By upgrading, you agree to our <Link href="/terms-and-conditions" className="underline">Terms of Service</Link>.
                </p>
                </>
              )}
            </CardContent>
          </Card>
      </div>
    </>
  );
}
