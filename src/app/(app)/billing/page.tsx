
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

type TableRowType = { id: string; name: string; location: string };

type PendingOrderInfo = {
  [tableId: string]: {
    itemCount: number;
    totalAmount: number;
  };
};

type HistoryOrder = { id: string; date: string; tableId: string | null; total: number };

type GroupedTables = { [location: string]: TableRowType[] };

export default function BillingPage() {
  const [tables, setTables] = useState<TableRowType[]>([]);
  const [history, setHistory] = useState<HistoryOrder[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrderInfo>({});
  const [loading, setLoading] = useState(true);

  const fetchTables = async () => {
    const { data, error } = await supabase.from('tables').select('id, name, location');
    if (error) throw error;
    setTables((data || []) as TableRowType[]);
  };

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('order_number, order_date, table_id, total')
      .order('order_date', { ascending: false })
      .limit(20);
    if (error) throw error;
    const mapped: HistoryOrder[] = (data || []).map(o => ({
      id: o.order_number as unknown as string,
      date: o.order_date as unknown as string,
      tableId: o.table_id as unknown as string | null,
      total: Number(o.total || 0),
    }));
    setHistory(mapped);
  };

  const fetchPendingSummary = async () => {
    const { data: pos, error } = await supabase.from('pending_orders').select('id, table_id, total');
    if (error) throw error;
    const map: PendingOrderInfo = {};
    const poIds = (pos || []).map(p => p.id);
    if (poIds.length === 0) {
      setPendingOrders({});
      return;
    }
    const { data: items } = await supabase
      .from('pending_order_items')
      .select('pending_order_id, quantity')
      .in('pending_order_id', poIds);
    const itemsByPo: Record<string, number> = {};
    (items || []).forEach(it => {
      itemsByPo[it.pending_order_id] = (itemsByPo[it.pending_order_id] || 0) + (it.quantity || 0);
    });
    (pos || []).forEach(p => {
      map[p.table_id as string] = {
        itemCount: itemsByPo[p.id] || 0,
        totalAmount: Number(p.total || 0),
      };
    });
    setPendingOrders(map);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchTables(), fetchHistory(), fetchPendingSummary()]);
      } catch (e) {
        console.error('Billing load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();

    const channel = supabase
      .channel('billing-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pending_orders' }, fetchPendingSummary)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pending_order_items' }, fetchPendingSummary)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);
  
  const tableMap = useMemo(() => {
    return tables.reduce((acc, table) => { acc[table.id] = table.name; return acc; }, {} as {[key: string]: string});
  }, [tables]);

  const groupedTables = tables.reduce((acc, table) => {
    const location = table.location || 'Uncategorized';
    if (!acc[location]) acc[location] = [];
    acc[location].push(table);
    return acc;
  }, {} as GroupedTables);

  const sortedLocations = Object.keys(groupedTables).sort();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Billing Dashboard</h1>
      </div>

       <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="live">Live Tables</TabsTrigger>
          <TabsTrigger value="history">Billing History</TabsTrigger>
        </TabsList>
        <TabsContent value="live" className="mt-6">
            {loading ? (
                <div className="space-y-8">
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="p-4 space-y-2">
                               <Skeleton className="h-6 w-3/4" />
                               <Skeleton className="h-4 w-1/2" />
                            </CardHeader>
                            <CardContent className="flex items-center justify-between p-4 border-t">
                               <Skeleton className="h-5 w-16" />
                               <Skeleton className="h-5 w-20" />
                            </CardContent>
                        </Card>
                      ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {sortedLocations.map(location => (
                      <div key={location}>
                        <h2 className="text-xl font-semibold font-headline mb-4 pb-2 border-b-2 border-primary/20">{location}</h2>
                        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                          {groupedTables[location].map((table) => {
                            const pending = pendingOrders[table.id];
                            const status = pending ? 'billing' : 'available';

                            return (
                              <Link href={`/order/${table.id}`} key={table.id}>
                                <Card className={cn('hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1', status === 'billing' ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-800' : 'bg-background')}>
                                  <CardHeader className="p-4">
                                    <CardTitle className="font-headline text-center text-lg">{table.name}</CardTitle>
                                    <p className={cn('text-center text-xs font-semibold', status === 'billing' ? 'text-blue-600 dark:text-blue-300' : 'text-muted-foreground')}>
                                      {status === 'billing' ? 'Order Pending' : 'No Pending Bill'}
                                    </p>
                                  </CardHeader>
                                  <CardFooter className="p-2 text-xs border-t bg-muted/30">
                                    {status === 'billing' ? (
                                      <div className="flex justify-between w-full font-mono">
                                          <span>{pending.itemCount} items</span>
                                          <span>Rs.{pending.totalAmount.toFixed(2)}</span>
                                      </div>
                                    ) : (
                                      <p className="text-center w-full text-muted-foreground">-</p>
                                    )}
                                  </CardFooter>
                                </Card>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
            )}
        </TabsContent>
        <TabsContent value="history" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Recent Bills</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                        {Array.from({length: 5}).map((_, i) => (
                           <div key={i} className="flex justify-between p-2">
                               <Skeleton className="h-5 w-1/4" />
                               <Skeleton className="h-5 w-1/4" />
                               <Skeleton className="h-5 w-1/4" />
                           </div>
                        ))}
                    </div>
                  ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bill No.</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Table</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        No recent bills found.
                                    </TableCell>
                                </TableRow>
                            ) : history.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono text-xs">#{order.id.slice(-6)}</TableCell>
                                    <TableCell>{format(new Date(order.date), 'dd/MM/yy, hh:mm a')}</TableCell>
                                    <TableCell>{tableMap[order.tableId || ''] || 'N/A'}</TableCell>
                                    <TableCell className="text-right font-mono">Rs. {order.total.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                  )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
