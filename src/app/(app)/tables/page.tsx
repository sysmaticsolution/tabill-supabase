
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Table } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useActiveBranch } from '@/hooks/use-active-branch';

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [pendingOrders, setPendingOrders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const { activeBranchId, ownerId } = useActiveBranch();

  const fetchTables = async () => {
    if (!ownerId || !activeBranchId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('id, name, status')
        .eq('owner_id', ownerId)
        .eq('branch_id', activeBranchId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setTables((data || []) as unknown as Table[]);
    } catch (error) {
      console.error('Error fetching tables: ', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingOrders = async () => {
    if (!ownerId || !activeBranchId) return;
    const { data, error } = await supabase
      .from('pending_orders')
      .select('table_id')
      .eq('owner_id', ownerId)
      .eq('branch_id', activeBranchId);
    if (error) {
      console.error('Error fetching pending orders:', error);
      return;
    }
    setPendingOrders((data || []).map((r: any) => r.table_id));
  };

  useEffect(() => {
    fetchTables();
    fetchPendingOrders();

    if (!ownerId || !activeBranchId) return;

    const channel = supabase
      .channel('pending-orders-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pending_orders', filter: `branch_id=eq.${activeBranchId}` },
        () => fetchPendingOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ownerId, activeBranchId]);
  
  const handleAddTable = async () => {
    if (!newTableName.trim() || !ownerId || !activeBranchId) return;

    try {
      const { error } = await supabase
        .from('tables')
        .insert({ name: newTableName, status: 'Available', owner_id: ownerId, branch_id: activeBranchId });
      if (error) throw error;
      setNewTableName('');
      setIsDialogOpen(false);
      fetchTables();
    } catch (error) {
      console.error('Error adding table: ', error);
    }
  };

  return (
    <div className="flex flex-col gap-6">
       <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Tables</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <span className="mr-2 h-4 w-4">+</span>
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-headline">Add New Table</DialogTitle>
              <DialogDescription>
                Enter a name for the new table.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Table 1"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddTable}>Save Table</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i}>
                <CardHeader className="p-4">
                   <Skeleton className="h-8 w-full" />
                </CardHeader>
                <CardContent className="flex items-center justify-center p-4 sm:p-6">
                   <Skeleton className="w-20 h-20 rounded-full" />
                </CardContent>
                <CardFooter className="p-2 justify-center">
                   <Skeleton className="h-4 w-24" />
                </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {tables.map((table: any) => {
            const hasPendingOrder = pendingOrders.includes(table.id);
            const status = hasPendingOrder ? 'occupied' : 'available';

            return (
            <Link href={`/order/${table.id}/take-order`} key={table.id}>
              <Card
                className={cn(
                  'hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1',
                  status === 'occupied' ? 'bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-800' : 
                  'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-800'
                )}
              >
                <CardHeader className="p-4">
                  <CardTitle className="font-headline text-center text-lg sm:text-2xl">{table.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center p-4 sm:p-6">
                  <div
                    className={cn(
                      'w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg',
                      status === 'occupied' ? 'bg-orange-500' : 'bg-green-500'
                    )}
                  >
                    {status === 'occupied' ? 'Taken' : 'Open'}
                  </div>
                </CardContent>
                <CardFooter className={cn("p-2 text-xs font-semibold text-center justify-center", status === 'occupied' ? 'text-orange-700 dark:text-orange-300' : 'text-green-700 dark:text-green-300')}>
                  <p>{status === 'occupied' ? 'Currently serving' : 'Ready for guests'}</p>
                </CardFooter>
              </Card>
            </Link>
          )})}
        </div>
      )}
    </div>
  );
}
