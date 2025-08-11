'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { addDays, parseISO } from 'date-fns';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  mobile_number: z.string().min(10, { message: 'Please enter a valid mobile number.' }),
  restaurant_name: z.string().min(3, { message: 'Restaurant name is required.' }),
  restaurant_address: z.string().min(10, { message: 'Full restaurant address is required.' }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, refreshProfileStatus } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      mobile_number: '',
      restaurant_name: '',
      restaurant_address: '',
    },
  });

  useEffect(() => {
    if (user) {
      setLoading(true);
      supabase
        .from('users')
        .select('*')
        .eq('uid', user.id)
        .maybeSingle()
        .then(({ data, error }) => {
        if (data && !error) {
          form.reset({
            name: data.name,
            mobile_number: data.mobile_number,
            restaurant_name: data.restaurant_name,
            restaurant_address: data.restaurant_address,
          });
          setIsNewUser(false);
        } else {
          // If no user data found, create a minimal profile
          const insertProfileData = {
            uid: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || '',
            profile_complete: false,
            subscription_status: 'trial',
            subscription_plan: 'PRO',
            trial_ends_at: addDays(new Date(), 14).toISOString(),
            mobile_number: '',
            restaurant_name: '',
            restaurant_address: ''
          };

          supabase
            .from('users')
            .insert(insertProfileData)
            .then(({ error: insertError }) => {
              if (insertError) {
                toast({
                  title: 'Error',
                  description: 'Failed to create user profile. Please try again.',
                  variant: 'destructive',
                });
                router.push('/login');
                return;
              }

              // Pre-fill with Google account info if available
              form.setValue('name', user.user_metadata?.full_name || '');
              setIsNewUser(true);
            });
        }
      }).finally(() => setLoading(false));
    } else {
      // No user, redirect to login
      router.push('/login');
    }
  }, [user, form, router, toast]);
  
  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to update your profile.',
        variant: 'destructive',
      });
      return;
    }

    try {
      
      const profileData: any = {
        uid: user.id,
        email: user.email,
        profile_complete: true,
        ...data,
      };

      if (isNewUser) {
        profileData.subscription_status = 'trial';
        profileData.trial_ends_at = addDays(new Date(), 14).toISOString();
        profileData.has_completed_onboarding = false; // Set for new users
      }

      const { error } = await supabase
        .from('users')
        .upsert(profileData, { onConflict: 'uid' });
        
      if (error) throw error;

      await refreshProfileStatus();

      toast({
        title: 'Profile Saved!',
        description: "Your information has been updated successfully.",
      });
      
      router.push('/reports');

    } catch (error) {
      console.error("Error updating profile: ", error);
      toast({
        title: 'Save Failed',
        description: 'There was an error saving your profile. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  if (loading) {
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full max-w-sm" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-20 w-full" />
                </div>
                <Skeleton className="h-10 w-32" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-3xl">Complete Your Profile</CardTitle>
        <CardDescription>
          Please provide a few more details to set up your account. This information will be used to customize your experience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Priya Sharma" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="mobile_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. +91 98765 43210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="restaurant_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Restaurant Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Sangeetha Vilas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="restaurant_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Restaurant Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter the full address of your restaurant" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving...' : 'Save and Continue'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}