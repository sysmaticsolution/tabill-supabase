'use client';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useEffect, useState } from 'react';
import { useActiveBranch } from '@/hooks/use-active-branch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PageHeader() {
  const [mounted, setMounted] = useState(false);
  const { branches, activeBranchId, setActiveBranchId, isReadonly } = useActiveBranch();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
        <div className="ml-auto flex items-center gap-4"></div>
      </header>
    );
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
       <div className="md:hidden">
          <SidebarTrigger />
       </div>
       <div className="flex items-center gap-3">
         <span className="text-sm text-muted-foreground">Branch</span>
         <Select value={activeBranchId || undefined} onValueChange={setActiveBranchId} disabled={isReadonly}>
           <SelectTrigger className="w-[220px]">
             <SelectValue placeholder={isReadonly ? 'Fixed' : 'Select branch'} />
           </SelectTrigger>
           <SelectContent>
             {branches.map(b => (
               <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
             ))}
           </SelectContent>
         </Select>
       </div>
      <div className="ml-auto flex items-center gap-4">
        {/* Theme switcher removed */}
      </div>
    </header>
  );
}
