
'use client';
import { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Minus, ArrowLeft, Printer, Percent, X, Save, CreditCard, Utensils } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/auth-provider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useActiveBranch } from '@/hooks/use-active-branch';

// Local UI types
interface UITable { id: string; name: string; }
interface UIVariant { id: string; name: string; sellingPrice: number }
interface UIMenuItem { id: string; name: string; category: string; }
interface UIOrderItem { menuItem: UIMenuItem; variant: UIVariant; quantity: number }

const initialOrderState = {
  items: [] as UIOrderItem[],
  subtotal: 0,
  sgstRate: 9,
  cgstRate: 9,
  sgstAmount: 0,
  cgstAmount: 0,
  total: 0,
  tableId: '',
  orderType: 'dine-in' as const,
  paymentStatus: 'Unpaid' as const,
};

function PrintableBill({ order, table, restaurantProfile, user }: { order: any | null; table: UITable | null, restaurantProfile: any; user: any }) {
  if (!order || !table || !restaurantProfile) return null;
  const paymentMethodDisplay = order.paymentMethod;
  return (
    <div className="font-mono text-black text-xs p-4 bg-white w-[300px] mx-auto" id="bill-to-print">
      <div className="text-center space-y-1 mb-4">
        <h1 className="text-lg font-bold uppercase">{restaurantProfile.restaurantName || 'Tabill'}</h1>
        <p>{restaurantProfile.restaurantAddress}</p>
        {restaurantProfile.mobileNumber && <p>PH: {restaurantProfile.mobileNumber}</p>}
        <p className="font-bold">CASH/BILL ({paymentMethodDisplay})</p>
      </div>
      <div className="border-t border-b border-dashed border-black py-1 mb-2">
        <div className="flex justify-between"><span>Bill No: {String(order.id).slice(-6)}</span><span>Date: {format(new Date(order.date), 'dd/MM/yyyy HH:mm')}</span></div>
        <div className="flex justify-between"><span>Table No: {table.name}</span><span>Waiter: {order.staffName || user?.user_metadata?.full_name || 'N/A'}</span></div>
      </div>
      <table className="w-full"><thead><tr className="border-b border-dashed border-black"><th className="text-left py-1">Item</th><th className="text-right py-1">Price</th><th className="text-right py-1">Qty</th><th className="text-right py-1">Total</th></tr></thead><tbody>
        {order.items.map((item: UIOrderItem) => {
          const orderItemId = `${item.menuItem.id}-${item.variant.name}`;
          return (
            <tr key={orderItemId}><td className="py-1">{item.menuItem.name} {item.variant.name !== 'Regular' ? `(${item.variant.name})` : ''}</td><td className="text-right py-1">{item.variant.sellingPrice.toFixed(2)}</td><td className="text-right py-1">{item.quantity}</td><td className="text-right py-1">{(item.variant.sellingPrice * item.quantity).toFixed(2)}</td></tr>
          );
        })}
      </tbody></table>
      <div className="border-t border-dashed border-black mt-2 pt-2">
        <div className="flex justify-between"><span>Subtotal</span><span>{order.subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>CGST @{order.cgstRate}%</span><span>{order.cgstAmount.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>SGST @{order.sgstRate}%</span><span>{order.sgstAmount.toFixed(2)}</span></div>
        <div className="border-t border-black my-1"></div>
        <div className="flex justify-between font-bold text-sm"><span>Net Amount</span><span>{order.total.toFixed(2)}</span></div>
      </div>
      <div className="text-center mt-4"><p>Thank you! Visit Again!</p></div>
    </div>
  );
}

export default function BillingPage() {
  const params = useParams<{ tableId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { user, appUser } = useAuth();
  const { ownerId, activeBranchId } = useActiveBranch();
  
  const [table, setTable] = useState<UITable | null>(null);
  const [restaurantProfile, setRestaurantProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [order, setOrder] = useState<typeof initialOrderState>({ ...initialOrderState });
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [finalizedOrder, setFinalizedOrder] = useState<any | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        if (user) setRestaurantProfile(appUser);

        const { data: tableRow } = await supabase
          .from('tables')
          .select('id, name')
          .eq('id', params.tableId)
          .eq('owner_id', ownerId as any)
          .eq('branch_id', activeBranchId as any)
          .maybeSingle();
        if (tableRow) setTable(tableRow as UITable); else { toast({ title: 'Error', description: 'Table not found.', variant: 'destructive' }); router.push('/billing'); }

        // Load pending order and items
        const { data: po } = await supabase
          .from('pending_orders')
          .select('*')
          .eq('table_id', params.tableId)
          .eq('owner_id', ownerId as any)
          .eq('branch_id', activeBranchId as any)
          .maybeSingle();
        if (po) {
          setPendingOrderId(po.id);
          const { data: poItems } = await supabase.from('pending_order_items').select('menu_item_id, variant_id, quantity').eq('pending_order_id', po.id);
          // Fetch required menu items and variants
          const menuIds = Array.from(new Set((poItems || []).map(i => i.menu_item_id)));
          const variantIds = Array.from(new Set((poItems || []).map(i => i.variant_id)));
          const [{ data: menuData }, { data: variantData }] = await Promise.all([
            supabase.from('menu_items').select('id, name, category').in('id', menuIds),
            supabase.from('menu_item_variants').select('id, name, selling_price').in('id', variantIds),
          ]);
          const menuById = new Map((menuData || []).map(m => [m.id, m]));
          const varById = new Map((variantData || []).map(v => [v.id, v]));
          const items: UIOrderItem[] = (poItems || []).map(i => ({
            menuItem: { id: i.menu_item_id, name: menuById.get(i.menu_item_id)?.name || 'Item', category: menuById.get(i.menu_item_id)?.category || '' },
            variant: { id: i.variant_id, name: varById.get(i.variant_id)?.name || 'Regular', sellingPrice: Number(varById.get(i.variant_id)?.selling_price || 0) },
            quantity: i.quantity,
          }));
          setOrder({
            items,
            subtotal: Number(po.subtotal || 0),
            sgstRate: Number(po.sgst_rate || 9),
            cgstRate: Number(po.cgst_rate || 9),
            sgstAmount: Number(po.sgst_amount || 0),
            cgstAmount: Number(po.cgst_amount || 0),
            total: Number(po.total || 0),
            tableId: params.tableId,
            orderType: 'dine-in',
            paymentStatus: 'Unpaid',
          });
        } else {
          setOrder({ ...initialOrderState, tableId: params.tableId });
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast({ title: 'Error', description: 'Failed to load page data.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    if (params.tableId && user && ownerId && activeBranchId) fetchInitialData();
  }, [params.tableId, toast, user, appUser, router, ownerId, activeBranchId]);

  const calculateTotals = (items: UIOrderItem[], sgst: number, cgst: number) => {
    const subtotal = items.reduce((acc, item) => acc + item.variant.sellingPrice * item.quantity, 0);
    const taxableAmount = subtotal;
    const sgstAmount = taxableAmount * (sgst / 100);
    const cgstAmount = taxableAmount * (cgst / 100);
    const total = taxableAmount + sgstAmount + cgstAmount;

    setOrder(prev => ({ 
      ...prev, 
      items, 
      subtotal, 
      sgstRate: sgst,
      cgstRate: cgst,
      sgstAmount,
      cgstAmount,
      total 
    }));
  };

  useEffect(() => { calculateTotals(order.items, order.sgstRate, order.cgstRate); }, [order.items, order.sgstRate, order.cgstRate]);

  if (loading) {
    return <div className="p-4 sm:p-6"><Skeleton className="h-8 w-64 mb-6" /><Skeleton className="h-[70vh] w-full max-w-lg mx-auto" /></div>;
  }
  if (!table) return <div>Table not found</div>;
  
  const persistRates = async (next: typeof initialOrderState) => {
    if (!pendingOrderId) return;
    await supabase
      .from('pending_orders')
      .update({ sgst_rate: next.sgstRate, cgst_rate: next.cgstRate, sgst_amount: next.sgstAmount, cgst_amount: next.cgstAmount, subtotal: next.subtotal, total: next.total })
      .eq('id', pendingOrderId)
      .eq('owner_id', ownerId as any)
      .eq('branch_id', activeBranchId as any);
  };

  const handleRateChange = async (rateType: 'sgst' | 'cgst', value: string) => {
    const numericValue = parseFloat(value) || 0;
    const next = { ...order, [rateType === 'sgst' ? 'sgstRate' : 'cgstRate']: numericValue } as typeof initialOrderState;
    const subtotal = next.subtotal;
    next.sgstAmount = subtotal * (next.sgstRate / 100);
    next.cgstAmount = subtotal * (next.cgstRate / 100);
    next.total = subtotal + next.sgstAmount + next.cgstAmount;
    setOrder(next);
    await persistRates(next);
  };

  const clearRate = async (rateType: 'sgst' | 'cgst') => {
    const next = { ...order, [rateType === 'sgst' ? 'sgstRate' : 'cgstRate']: 0 } as typeof initialOrderState;
    next.sgstAmount = next.subtotal * (next.sgstRate / 100);
    next.cgstAmount = next.subtotal * (next.cgstRate / 100);
    next.total = next.subtotal + next.sgstAmount + next.cgstAmount;
    setOrder(next);
    await persistRates(next);
  };
  
  const saveFinalOrder = async (paymentMethod: 'Cash' | 'Card / UPI') => {
    if (!activeBranchId) {
      toast({ title: 'No active branch', description: 'Select an active branch before saving orders.', variant: 'destructive' });
      return;
    }
    if (order.items.length === 0) {
      toast({ title: 'Cannot save an empty order.', variant: 'destructive' });
      return;
    }
    const finalOrderData = { 
      id: `ORD-${params.tableId}-${Date.now()}`,
      date: new Date().toISOString(),
      paymentStatus: 'Paid',
      paymentMethod: paymentMethod,
      staffId: user?.id,
      staffName: user?.user_metadata?.full_name,
      orderType: 'dine-in',
    } as any;
    
    try {
      // Insert order
      const { data: inserted, error: insertErr } = await supabase
        .from('orders')
        .insert({
          order_number: finalOrderData.id,
          table_id: params.tableId,
          order_type: 'dine-in',
          subtotal: order.subtotal,
          sgst_rate: order.sgstRate,
          cgst_rate: order.cgstRate,
          sgst_amount: order.sgstAmount,
          cgst_amount: order.cgstAmount,
          total: order.total,
          payment_status: 'Paid',
          payment_method: paymentMethod,
          staff_id: null,
          staff_name: finalOrderData.staffName,
          order_date: finalOrderData.date,
          owner_id: ownerId as any,
          branch_id: activeBranchId as any,
        })
        .select('id')
        .single();
      if (insertErr) throw insertErr;
      const orderId = inserted!.id;

      // Insert items
      const payload = order.items.map(i => ({
        order_id: orderId,
        menu_item_id: i.menuItem.id,
        variant_id: i.variant.id,
        quantity: i.quantity,
        unit_price: i.variant.sellingPrice,
        total_price: i.variant.sellingPrice * i.quantity,
      }));
      const { error: itemsErr } = await supabase.from('order_items').insert(payload);
      if (itemsErr) throw itemsErr;

      // Clear pending order for this table
      if (pendingOrderId) {
        await supabase.from('pending_order_items').delete().eq('pending_order_id', pendingOrderId);
        await supabase
          .from('pending_orders')
          .delete()
          .eq('id', pendingOrderId)
          .eq('owner_id', ownerId as any)
          .eq('branch_id', activeBranchId as any);
      }

      toast({ title: 'Order Saved!', description: `Order ${finalOrderData.id} for ${table.name} has been saved.` });
      setFinalizedOrder({ ...finalOrderData, items: order.items, subtotal: order.subtotal, sgstAmount: order.sgstAmount, cgstAmount: order.cgstAmount, total: order.total, sgstRate: order.sgstRate, cgstRate: order.cgstRate });
      setIsPrintDialogOpen(true);

    } catch (error) {
      console.error('Error saving order: ', error);
      toast({ title: 'Save Failed', description: 'There was an error saving the order. Please try again.', variant: 'destructive' });
    }
  };

  const handlePrint = () => {
    const printContents = document.getElementById('bill-to-print')?.innerHTML;
    const originalContents = document.body.innerHTML;
    if (printContents) {
      document.body.innerHTML = `<div class="print-only">${printContents}</div>`;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };
  
  const handleDialogClose = () => {
    setIsPrintDialogOpen(false);
    router.push('/billing');
  };

  return (
    <>
      <div className="flex flex-col h-[calc(100vh_-_theme(spacing.24))] lg:h-[calc(100vh_-_theme(spacing.32))]">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/billing"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
            <h1 className="text-xl sm:text-3xl font-bold font-headline">Billing for {table?.name}</h1>
          </div>
          {!activeBranchId && (
            <div className="p-3 mb-4 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              Select an active branch to proceed with billing. Go to Branches to select a branch.
            </div>
          )}
        
          <Card className="flex flex-col max-w-xl mx-auto w-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="font-headline text-xl md:text-2xl">Current Bill</CardTitle>
                <Button asChild variant="outline"><Link href={`/order/${params.tableId}/take-order`}><Utensils className="mr-2 h-4 w-4" />Back to Order</Link></Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 p-2 sm:p-6">
              {order.items.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                      <p>No items in the bill.</p>
                      <p className="text-sm">Click 'Back to Order' to add items.</p>
                  </div>
              ) : (
                  <ScrollArea className="h-full max-h-[40vh] pr-2 sm:pr-4">
                      <Table>
                          <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-center">Qty</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                          <TableBody>
                          {order.items.map((item) => {
                            const orderItemId = `${item.menuItem.id}-${item.variant.name}`;
                            return (
                              <TableRow key={orderItemId}>
                                <TableCell className="font-medium text-xs sm:text-sm">{item.menuItem.name} <span className="text-muted-foreground text-xs">({item.variant.name})</span></TableCell>
                                <TableCell className="text-center"><span className="text-sm font-medium">{item.quantity}</span></TableCell>
                                <TableCell className="text-right font-mono text-xs sm:text-sm">Rs. {(item.variant.sellingPrice * item.quantity).toFixed(2)}</TableCell>
                              </TableRow>
                            );
                          })}
                          </TableBody>
                      </Table>
                  </ScrollArea>
              )}
            </CardContent>
            {order.items.length > 0 && 
              <CardFooter className="flex-col items-stretch p-4 mt-auto border-t">
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">Rs. {order.subtotal.toFixed(2)}</span></div>

                    <div className="flex justify-between items-center">
                      <Label htmlFor="cgst">CGST</Label>
                      <div className="flex items-center gap-1 w-32">
                        <Input id="cgst" type="number" value={order.cgstRate} onChange={(e) => handleRateChange('cgst', e.target.value)} className="h-8 text-right font-mono"/>
                        <Percent className="h-4 w-4 text-muted-foreground"/>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => clearRate('cgst')}><X className="h-4 w-4" /></Button>
                      </div>
                      <span className="font-mono">Rs. {order.cgstAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <Label htmlFor="sgst">SGST</Label>
                      <div className="flex items-center gap-1 w-32">
                        <Input id="sgst" type="number" value={order.sgstRate} onChange={(e) => handleRateChange('sgst', e.target.value)} className="h-8 text-right font-mono"/>
                        <Percent className="h-4 w-4 text-muted-foreground"/>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => clearRate('sgst')}><X className="h-4 w-4" /></Button>
                      </div>
                      <span className="font-mono">Rs. {order.sgstAmount.toFixed(2)}</span>
                    </div>

                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-base md:text-lg"><span>Total</span><span className="font-mono">Rs. {order.total.toFixed(2)}</span></div>
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-2 gap-4">
                  <Button size="lg" disabled={order.items.length === 0 || !activeBranchId} onClick={() => saveFinalOrder('Cash')}><Save className="mr-2 h-4 w-4" />Paid by Cash</Button>
                  <Button size="lg" disabled={order.items.length === 0 || !activeBranchId} onClick={() => saveFinalOrder('Card / UPI')}><CreditCard className="mr-2 h-4 w-4" />Paid by Card / UPI</Button>
                </div>
              </CardFooter>
            }
          </Card>
      </div>

       <Dialog open={isPrintDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-xs p-0 bg-transparent border-0">
            <DialogHeader><DialogTitle className="sr-only">Print Bill</DialogTitle></DialogHeader>
          <div className="bg-white rounded-md shadow-lg">
            <PrintableBill order={finalizedOrder} table={table} restaurantProfile={appUser} user={user} />
            <DialogFooter className="p-4 bg-gray-100 rounded-b-md"><Button onClick={handlePrint} className="w-full"><Printer className="mr-2 h-4 w-4" />Print Bill</Button></DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
