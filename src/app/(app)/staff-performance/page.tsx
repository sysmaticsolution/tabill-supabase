
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Activity } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Order, StaffMember } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';

type StaffPerformanceData = {
  staffId: string;
  staffName: string;
  totalOrders: number;
  totalSales: number;
};

const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function StaffPerformancePage() {
  const { user, appUser } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([] as any);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [date, setDate] = useState<DateRange | undefined>({ from: subDays(new Date(), 6), to: new Date() });

  // We intentionally skip fetching staff_members to avoid RLS issues during setup.
  useEffect(() => { setStaff([] as any); }, []);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!date?.from) return;
      setLoading(true);
      try {
        const fromIso = startOfDay(date.from).toISOString();
        const toIso = (date.to ? endOfDay(date.to) : endOfDay(date.from)).toISOString();
        const { data, error } = await supabase
          .from('orders')
          .select('staff_id, staff_name, total, order_date')
          .gte('order_date', fromIso)
          .lte('order_date', toIso);
        if (error) console.error('orders error:', error);
        setOrders((data || []) as any);
      } catch (error) {
        console.error('Error fetching report data: ', error);
        toast({ title: 'Error', description: 'Failed to fetch report data.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [date, toast]);

  const performanceReport = useMemo(() => {
    const staffMap = new Map<string, StaffPerformanceData>();
    (orders as any[]).forEach((o: any) => {
      const sid = (o.staff_id as string) || 'unknown';
      const sname = o.staff_name || 'Unknown';
      let entry = staffMap.get(sid);
      if (!entry) entry = { staffId: sid, staffName: sname, totalOrders: 0, totalSales: 0 };
      entry.totalOrders += 1;
      entry.totalSales += Number(o.total || 0);
      staffMap.set(sid, entry);
    });
    return Array.from(staffMap.values()).sort((a, b) => b.totalSales - a.totalSales);
  }, [orders]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Staff Performance</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button id="date" variant={'outline'} className={cn('w-full sm:w-[300px] justify-start text-left font-normal', !date && 'text-muted-foreground')}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (date.to ? (<>{format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}</>) : (format(date.from, 'LLL dd, y'))) : (<span>Pick a date</span>)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
          </PopoverContent>
        </Popover>
      </div>
      
      <Card>
          <CardHeader>
              <CardTitle className="font-headline text-xl md:text-2xl">Performance Summary</CardTitle>
              <CardDescription>Sales and order data for each staff member in the selected period.</CardDescription>
          </CardHeader>
          <CardContent>
              {loading ? <Skeleton className="w-full h-48" /> : (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Staff Member</TableHead>
                        <TableHead className="text-right">Total Orders</TableHead>
                        <TableHead className="text-right">Total Sales</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {performanceReport.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">No performance data available for this period.</TableCell>
                        </TableRow>
                    ) : (
                        performanceReport.map((item) => (
                            <TableRow key={item.staffId}>
                            <TableCell>
                                <div className="flex items-center gap-4">
                                    <Avatar><AvatarFallback>{getInitials(item.staffName)}</AvatarFallback></Avatar>
                                    <span className="font-medium">{item.staffName}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-mono">{item.totalOrders}</TableCell>
                            <TableCell className="text-right font-mono">Rs. {item.totalSales.toFixed(2)}</TableCell>
                            </TableRow>
                        ))
                    )}
                    </TableBody>
                </Table>
              )}
          </CardContent>
      </Card>

    </div>
  );
}
