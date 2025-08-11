
'use client';

import AppSidebar from '@/components/app/app-sidebar';
import PageHeader from '@/components/app/page-header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { withAuth } from '@/components/auth-provider';
import { useAuth } from '@/components/auth-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, appUser, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && appUser) {
        if (window.location.pathname === '/') {
            router.replace('/reports');
        }
    }
  }, [appUser, loading, router]);
  
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
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <PageHeader />
        <main className="p-4 sm:p-6 bg-background flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default withAuth(AppLayout);
