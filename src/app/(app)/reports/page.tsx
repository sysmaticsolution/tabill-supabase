
'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar as CalendarIcon, TrendingUp, Wallet, Utensils, Award, DollarSign, ReceiptText, CreditCard, Coins, Check, Rocket, Clock, ShoppingBag, Building2, Users } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, getHours } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/lib/supabase';
import { Order } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GuidedTour, TourStep } from '@/components/app/guided-tour';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActiveBranch } from '@/hooks/use-active-branch';

// Local type to hold denormalized order data for reporting
type ReportOrderItem = {
  menu_item_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  menu_item_name?: string;
  menu_item_category?: string;
  variant_name?: string;
  variant_cost_price?: number;
  variant_selling_price?: number;
};

type ReportOrder = {
  id: string;
  order_type: 'dine-in' | 'takeaway';
  subtotal: number;
  sgst_amount: number;
  cgst_amount: number;
  total: number;
  payment_method?: 'Cash' | 'Card / UPI' | 'Razorpay' | null;
  order_date: string; // ISO
  items: ReportOrderItem[];
};

type ItemReportData = {
  name: string;
  cost: number;
  sales: number;
  profit: number;
  quantity: number;
};

type CategoryReportData = {
  name: string;
  sales: number;
  profit: number;
  quantity: number;
}

type PaymentMethodData = {
    name: string;
    value: number;
}

type PeakTimeData = {
    hour: string;
    sales: number;
};

type OrderTypeData = {
    name: 'Dine-In' | 'Takeaway';
    value: number;
}

// Branch comparison type
type BranchComparison = {
  id: string;
  name: string;
  staffCount: number;
  tableCount: number;
  ordersCount: number;
  revenue: number;
  avgOrderValue: number;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943'];
const PAYMENT_COLORS = { 'Cash': '#00C49F', 'Card / UPI': '#0088FE' } as const;
const ORDER_TYPE_COLORS = { 'Dine-In': '#FFBB28', 'Takeaway': '#AF19FF' } as const;

export default function ReportsPage() {
  const { appUser, user, refreshProfileStatus } = useAuth();
  const { ownerId, activeBranchId } = useActiveBranch();
  const router = useRouter();
  const [orders, setOrders] = useState<ReportOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchComparisons, setBranchComparisons] = useState<BranchComparison[]>([]);
  const { toast } = useToast();
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Guided Tour State
  const [isTourActive, setIsTourActive] = useState(false);
  const datePickerRef = useRef<HTMLButtonElement>(null);
  const statsCardRef = useRef<HTMLDivElement>(null);

  const tourSteps: TourStep[] = [
    {
      target: () => datePickerRef.current,
      title: 'Filter by Date',
      content: 'You can select a date range here to filter all the reports on this page. Try looking at today, this week, or this month!',
      placement: 'bottom-start',
    },
    {
      target: () => statsCardRef.current,
      title: 'Key Metrics',
      content: 'These cards give you a quick, at-a-glance overview of your restaurant\'s performance for the selected period.',
      placement: 'bottom',
    },
    {
      title: "Let's See The Action!",
      content: "Great! Reports are useful, but the real action happens on the Tables page. Let's go there now to see how you can take orders.",
      placement: 'center',
      onNext: () => router.push('/tables'),
    },
  ];

  useEffect(() => {
    if (appUser && user && !appUser.has_completed_onboarding) {
        if (appUser.profile_complete) {
           setShowOnboarding(true);
        }
    }
  }, [appUser, user]);

  // Single-branch detailed reports
  useEffect(() => {
    const fetchReportData = async () => {
      if (!date?.from || !ownerId || !activeBranchId) return;

      setLoading(true);
      try {
        const dateRange = {
          from: startOfDay(date.from).toISOString(),
          to: (date.to ? endOfDay(date.to) : endOfDay(date.from)).toISOString(),
        };

        // 1) Fetch orders in range for active branch
        const { data: ordersData, error: ordersErr } = await supabase
          .from('orders')
          .select('id, order_type, subtotal, sgst_amount, cgst_amount, total, payment_method, order_date')
          .eq('owner_id', ownerId)
          .eq('branch_id', activeBranchId)
          .gte('order_date', dateRange.from)
          .lte('order_date', dateRange.to)
          .order('order_date', { ascending: true });
        if (ordersErr) throw ordersErr;

        if (!ordersData || ordersData.length === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }

        const orderIds = ordersData.map(o => o.id);

        // 2) Fetch order items for these orders
        const { data: itemsData, error: itemsErr } = await supabase
          .from('order_items')
          .select('id, order_id, menu_item_id, variant_id, quantity, unit_price, total_price')
          .in('order_id', orderIds);
        if (itemsErr) throw itemsErr;

        const menuItemIds = Array.from(new Set((itemsData || []).map(i => i.menu_item_id).filter(Boolean)));
        const variantIds = Array.from(new Set((itemsData || []).map(i => i.variant_id).filter(Boolean)));

        // 3) Fetch menu items and variants referenced
        const [{ data: menuItemsData, error: miErr }, { data: variantsData, error: vErr }] = await Promise.all([
          supabase.from('menu_items').select('id, name, category').in('id', menuItemIds),
          supabase.from('menu_item_variants').select('id, name, cost_price, selling_price').in('id', variantIds),
        ]);
        if (miErr) throw miErr;
        if (vErr) throw vErr;

        const menuItemById = new Map(menuItemsData?.map(m => [m.id, m]) || []);
        const variantById = new Map(variantsData?.map(v => [v.id, v]) || []);

        // 4) Build denormalized report orders
        const orderIdToItems: Record<string, ReportOrderItem[]> = {};
        (itemsData || []).forEach(i => {
          const mi = menuItemById.get(i.menu_item_id);
          const vr = variantById.get(i.variant_id);
          const item: ReportOrderItem = {
            menu_item_id: i.menu_item_id,
            variant_id: i.variant_id,
            quantity: i.quantity,
            unit_price: i.unit_price,
            total_price: i.total_price,
            menu_item_name: mi?.name,
            menu_item_category: mi?.category,
            variant_name: vr?.name,
            variant_cost_price: vr?.cost_price,
            variant_selling_price: vr?.selling_price,
          };
          if (!orderIdToItems[i.order_id]) orderIdToItems[i.order_id] = [];
          orderIdToItems[i.order_id].push(item);
        });

        const reportOrders: ReportOrder[] = (ordersData || []).map(o => ({
          id: o.id,
          order_type: o.order_type,
          subtotal: o.subtotal || 0,
          sgst_amount: o.sgst_amount || 0,
          cgst_amount: o.cgst_amount || 0,
          total: o.total || 0,
          payment_method: o.payment_method,
          order_date: o.order_date,
          items: orderIdToItems[o.id] || [],
        }));

        setOrders(reportOrders);
      } catch (error) {
        console.error('Error fetching report data: ', error);
        toast({ title: 'Error', description: 'Failed to fetch report data.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [date, toast, ownerId, activeBranchId]);

  // All-branches comparison
  useEffect(() => {
    const fetchBranchComparisons = async () => {
      if (!ownerId || !date?.from) return;
      setBranchesLoading(true);
      try {
        const { data: branches, error: bErr } = await supabase
          .from('branches')
          .select('id, name')
          .eq('owner_id', ownerId)
          .order('created_at', { ascending: false });
        if (bErr) throw bErr;

        const fromISO = startOfDay(date.from).toISOString();
        const toISO = (date.to ? endOfDay(date.to) : endOfDay(date.from)).toISOString();

        const results: BranchComparison[] = [];
        for (const b of branches || []) {
          // Orders for period
          const { data: ords, error: oErr } = await supabase
            .from('orders')
            .select('id, total')
            .eq('owner_id', ownerId)
            .eq('branch_id', b.id)
            .gte('order_date', fromISO)
            .lte('order_date', toISO);
          if (oErr) throw oErr;
          const ordersCount = ords?.length || 0;
          const revenue = (ords || []).reduce((sum: number, r: any) => sum + (Number(r.total) || 0), 0);

          // Staff count in branch
          const { count: staffCount } = await supabase
            .from('staff_members')
            .select('id', { count: 'exact', head: true })
            .eq('owner_id', ownerId)
            .eq('branch_id', b.id);

          // Tables count in branch
          const { count: tableCount } = await supabase
            .from('tables')
            .select('id', { count: 'exact', head: true })
            .eq('owner_id', ownerId)
            .eq('branch_id', b.id);

          results.push({
            id: b.id,
            name: b.name,
            staffCount: staffCount || 0,
            tableCount: tableCount || 0,
            ordersCount,
            revenue,
            avgOrderValue: ordersCount > 0 ? revenue / ordersCount : 0,
          });
        }

        setBranchComparisons(results);
      } catch (e) {
        console.error('Error building branch comparisons:', e);
        setBranchComparisons([]);
      } finally {
        setBranchesLoading(false);
      }
    };

    fetchBranchComparisons();
  }, [ownerId, date]);
  
  const finishOnboarding = async () => {
    if (user && appUser && !appUser.has_completed_onboarding) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ has_completed_onboarding: true })
          .eq('uid', user.id);
        if (error) throw error;
        await refreshProfileStatus();
      } catch (error) {
        toast({ title: 'Error', description: 'Could not save your preference.', variant: 'destructive' });
      }
    }
    setShowOnboarding(false);
    setIsTourActive(false);
  }

  const handleOnboardingAction = async (startTour: boolean) => {
    setShowOnboarding(false);
    if (startTour) {
      setIsTourActive(true);
    } else {
      await finishOnboarding();
    }
  };

  const {
    totalRevenue,
    totalProfit,
    totalGst,
    averageOrderValue,
    totalTakeawayRevenue,
    itemReport,
    categoryReport,
    topSellingItems,
    topProfitableItems,
    paymentMethodBreakdown,
    orderTypeBreakdown,
    totalCash,
    totalOnline,
    peakTimeReport,
  } = useMemo(() => {
    const defaultReturn = {
      totalRevenue: 0,
      totalProfit: 0,
      totalGst: 0,
      averageOrderValue: 0,
      totalTakeawayRevenue: 0,
      itemReport: [] as ItemReportData[],
      categoryReport: [] as CategoryReportData[],
      topSellingItems: [] as ItemReportData[],
      topProfitableItems: [] as ItemReportData[],
      paymentMethodBreakdown: [] as PaymentMethodData[],
      orderTypeBreakdown: [] as OrderTypeData[],
      totalCash: 0,
      totalOnline: 0,
      peakTimeReport: [] as PeakTimeData[],
    };

    if (orders.length === 0) {
      return defaultReturn;
    }

    let totalRevenue = 0;
    let totalCost = 0;
    let totalGst = 0;
    let totalCash = 0;
    let totalOnline = 0;
    let dineInSales = 0;
    let takeawaySales = 0;

    const itemMap = new Map<string, { name: string; cost: number; sales: number; quantity: number; category: string }>();
    const categoryMap = new Map<string, { sales: number; cost: number; quantity: number }>();
    const hourlySales = new Array(24).fill(0).map(() => ({ sales: 0 }));

    orders.forEach(order => {
      totalRevenue += order.total;
      totalGst += (order.sgst_amount || 0) + (order.cgst_amount || 0);

      const orderHour = getHours(new Date(order.order_date));
      hourlySales[orderHour].sales += order.subtotal;

      if (order.payment_method === 'Cash') {
          totalCash += order.total;
      } else if (order.payment_method === 'Razorpay' || order.payment_method === 'Card / UPI') {
          totalOnline += order.total;
      }
      
      if (order.order_type === 'takeaway') {
        takeawaySales += order.total;
      } else {
        dineInSales += order.total;
      }

      order.items.forEach(item => {
        const itemCost = item.quantity * (item.variant_cost_price ?? 0);
        const itemSales = item.total_price ?? (item.quantity * (item.variant_selling_price ?? item.unit_price));
        totalCost += itemCost;
        
        const key = `${item.menu_item_id}-${item.variant_name ?? ''}`;
        const existingItem = itemMap.get(key);
        const itemName = `${item.menu_item_name ?? 'Item'}${item.variant_name ? ` (${item.variant_name})` : ''}`;
        const category = item.menu_item_category ?? 'Unknown';

        if (existingItem) {
          existingItem.cost += itemCost;
          existingItem.sales += itemSales;
          existingItem.quantity += item.quantity;
        } else {
          itemMap.set(key, {
            name: itemName,
            cost: itemCost,
            sales: itemSales,
            quantity: item.quantity,
            category,
          });
        }
        
        const existingCategory = categoryMap.get(category);
        if(existingCategory) {
            existingCategory.sales += itemSales;
            existingCategory.cost += itemCost;
            existingCategory.quantity += item.quantity;
        } else {
            categoryMap.set(category, { sales: itemSales, cost: itemCost, quantity: item.quantity });
        }
      });
    });
    
    const totalSalesFromItems = Array.from(itemMap.values()).reduce((acc, item) => acc + item.sales, 0);

    const itemReportData: ItemReportData[] = Array.from(itemMap.values()).map(item => ({
      name: item.name,
      cost: item.cost,
      sales: item.sales,
      profit: item.sales - item.cost,
      quantity: item.quantity,
    })).sort((a, b) => b.sales - a.sales);
    
    const categoryReportData: CategoryReportData[] = Array.from(categoryMap.entries()).map(([name, data]) => ({
        name,
        sales: data.sales,
        profit: data.sales - data.cost,
        quantity: data.quantity
    })).sort((a, b) => b.sales - a.sales);

    const topSelling = [...itemReportData].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    const topProfitable = [...itemReportData].sort((a, b) => b.profit - a.profit).slice(0, 5);

    const paymentMethodBreakdown: PaymentMethodData[] = [];
    if (totalCash > 0) paymentMethodBreakdown.push({ name: 'Cash', value: totalCash });
    if (totalOnline > 0) paymentMethodBreakdown.push({ name: 'Card / UPI', value: totalOnline });
    
    const orderTypeBreakdown: OrderTypeData[] = [];
    if (dineInSales > 0) orderTypeBreakdown.push({ name: 'Dine-In', value: dineInSales });
    if (takeawaySales > 0) orderTypeBreakdown.push({ name: 'Takeaway', value: takeawaySales });

    const peakTimeReportData: PeakTimeData[] = hourlySales.map((data, hour) => ({
        hour: format(new Date(0, 0, 0, hour), 'ha'),
        sales: data.sales,
    }));

    return {
      totalRevenue,
      totalProfit: totalSalesFromItems - totalCost,
      totalGst,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      totalTakeawayRevenue: takeawaySales,
      itemReport: itemReportData,
      categoryReport: categoryReportData,
      topSellingItems: topSelling,
      topProfitableItems: topProfitable,
      paymentMethodBreakdown,
      orderTypeBreakdown,
      totalCash,
      totalOnline,
      peakTimeReport: peakTimeReportData,
    };
  }, [orders]);


  return (
    <>
      <GuidedTour
        steps={tourSteps}
        isActive={isTourActive}
        onClose={finishOnboarding}
      />
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Rocket className="h-8 w-8 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-center font-headline text-2xl pt-2">Welcome to Tabill!</DialogTitle>
            <DialogDescription className="text-center pb-4">
              You're all set up. Would you like a quick tour to see how everything works?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => handleOnboardingAction(false)}>Skip for now</Button>
            <Button onClick={() => handleOnboardingAction(true)}>
              <Check className="mr-2 h-4 w-4" />
              Yes, show me how
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold font-headline">Sales Reports</h1>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                ref={datePickerRef}
                id="date"
                variant={'outline'}
                className={cn('w-full sm:w-[300px] justify-start text-left font-normal', !date && 'text-muted-foreground')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(date.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">This Branch</TabsTrigger>
                <TabsTrigger value="item-analysis">Item & Category</TabsTrigger>
                <TabsTrigger value="peak-time">Peak Time</TabsTrigger>
                <TabsTrigger value="branches">Branches</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
                <div ref={statsCardRef} className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                        {loading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">Rs. {totalRevenue.toFixed(2)}</div>}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                        {loading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">Rs. {totalProfit.toFixed(2)}</div>}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">GST Collected</CardTitle>
                            <ReceiptText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {loading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">Rs. {totalGst.toFixed(2)}</div>}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                        <Utensils className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                        {loading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">Rs. {averageOrderValue.toFixed(2)}</div>}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Takeaway Revenue</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                        {loading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">Rs. {totalTakeawayRevenue.toFixed(2)}</div>}
                        </CardContent>
                    </Card>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-xl md:text-2xl">Sales by Order Type</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {loading ? <Skeleton className="w-full h-full" /> : orderTypeBreakdown.length === 0 ? <div className="flex items-center justify-center h-full text-muted-foreground">No data available.</div> :
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={orderTypeBreakdown} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                                        {orderTypeBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={ORDER_TYPE_COLORS[entry.name]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `Rs. ${value.toFixed(2)}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                            }
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-xl md:text-2xl">Payment Method Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {loading ? <Skeleton className="w-full h-full" /> : paymentMethodBreakdown.length === 0 ? <div className="flex items-center justify-center h-full text-muted-foreground">No data available.</div> :
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={paymentMethodBreakdown} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                                        {paymentMethodBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[entry.name as keyof typeof PAYMENT_COLORS]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `Rs. ${value.toFixed(2)}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                            }
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="item-analysis" className="mt-6 space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-xl md:text-2xl">Top 5 Best-Selling Items</CardTitle>
                            <CardDescription>By quantity sold</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? <Skeleton className="w-full h-48" /> : topSellingItems.length === 0 ? <div className="flex items-center justify-center h-24 text-muted-foreground">No sales data for this period.</div> :
                            <ul className="space-y-4">
                                {topSellingItems.map((item, index) => (
                                    <li key={item.name} className="flex items-center">
                                        <Award className="h-5 w-5 text-primary mr-4"/>
                                        <div className="flex-1">
                                            <p className="font-medium">{item.name}</p>
                                        </div>
                                        <p className="font-semibold">{item.quantity} sold</p>
                                    </li>
                                ))}
                            </ul>
                            }
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-xl md:text-2xl">Top 5 Most Profitable Items</CardTitle>
                            <CardDescription>By total profit generated</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? <Skeleton className="w-full h-48" /> : topProfitableItems.length === 0 ? <div className="flex items-center justify-center h-24 text-muted-foreground">No sales data for this period.</div> :
                            <ul className="space-y-4">
                                {topProfitableItems.map((item, index) => (
                                    <li key={item.name} className="flex items-center">
                                        <DollarSign className="h-5 w-5 text-green-500 mr-4"/>
                                        <div className="flex-1">
                                            <p className="font-medium">{item.name}</p>
                                        </div>
                                        <p className="font-semibold text-green-500">Rs. {item.profit.toFixed(2)}</p>
                                    </li>
                                ))}
                            </ul>
                            }
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-xl md:text-2xl">Sales by Category</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {loading ? <Skeleton className="w-full h-full" /> : categoryReport.length === 0 ? <div className="flex items-center justify-center h-full text-muted-foreground">No data available.</div> :
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryReport}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="sales"
                                >
                                    {categoryReport.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `Rs. ${value.toFixed(2)}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                        }
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-xl md:text-2xl">Detailed Item Report</CardTitle>
                        <CardDescription>Profitability breakdown for every item sold in the period.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="w-full h-48" /> : itemReport.length === 0 ? <div className="flex items-center justify-center h-24 text-muted-foreground">No sales data for this period.</div> :
                        <UITable>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Item Name</TableHead>
                                <TableHead className="text-right">Quantity Sold</TableHead>
                                <TableHead className="text-right">Total Cost</TableHead>
                                <TableHead className="text-right">Total Sales</TableHead>
                                <TableHead className="text-right">Total Profit</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {itemReport.map((item) => (
                                <TableRow key={item.name} className="text-xs sm:text-sm">
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                                <TableCell className="text-right font-mono">Rs. {item.cost.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono">Rs. {item.sales.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono text-green-600 dark:text-green-400">Rs. {item.profit.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </UITable>
                        }
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="peak-time" className="mt-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-xl md:text-2xl">Peak Time Analysis</CardTitle>
                        <CardDescription>Sales distribution by hour of the day.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px]">
                        {loading ? <Skeleton className="w-full h-full" /> : peakTimeReport.length === 0 || peakTimeReport.every(d => d.sales === 0) ? <div className="flex items-center justify-center h-full text-muted-foreground">No sales data for this period.</div> :
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={peakTimeReport} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                                    <XAxis dataKey="hour" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rs.${value}`} />
                                    <Tooltip
                                    formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, "Sales"]}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        borderColor: 'hsl(var(--border))',
                                    }}
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    />
                                    <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        }
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="branches" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl md:text-2xl flex items-center gap-2"><Building2 className="h-5 w-5" /> Branch Comparison</CardTitle>
                  <CardDescription>Performance per branch for the selected period, including staff and tables.</CardDescription>
                </CardHeader>
                <CardContent>
                  {branchesLoading ? (
                    <Skeleton className="h-48 w-full" />
                  ) : branchComparisons.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">No branches or no data in this period.</div>
                  ) : (
                    <UITable>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Branch</TableHead>
                          <TableHead className="text-right">Staff</TableHead>
                          <TableHead className="text-right">Tables</TableHead>
                          <TableHead className="text-right">Orders</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">Avg Order Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {branchComparisons.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell className="font-medium">{b.name}</TableCell>
                            <TableCell className="text-right">{b.staffCount}</TableCell>
                            <TableCell className="text-right">{b.tableCount}</TableCell>
                            <TableCell className="text-right">{b.ordersCount}</TableCell>
                            <TableCell className="text-right">Rs. {b.revenue.toFixed(2)}</TableCell>
                            <TableCell className="text-right">Rs. {b.avgOrderValue.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </UITable>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
