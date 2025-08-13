
'use client';
import { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Minus, ArrowLeft, Printer, Search, CreditCard, Receipt } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/auth-provider';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useActiveBranch } from '@/hooks/use-active-branch';

// Local UI types compatible with existing components
interface UIVariant { id: string; name: string; costPrice: number; sellingPrice: number; }
interface UIMenuItem { id: string; name: string; category: string; partNumber?: string; variants: UIVariant[]; }
interface UIOrderItem { menuItem: UIMenuItem; variant: UIVariant; quantity: number; }
interface UITable { id: string; name: string; location: string; }

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

function PrintableKOT({ order, table, restaurantProfile, user }: { order: Omit<typeof initialOrderState, 'tableId'>, table: UITable, restaurantProfile: any, user: any }) {
  if (!restaurantProfile || order.items.length === 0) return null;
  return (
    <div className="font-mono text-black text-xs p-4 bg-white w-[300px] mx-auto">
      <div className="text-center space-y-1 mb-4">
        <h1 className="text-lg font-bold uppercase">KOT</h1>
      </div>
      <div className="border-t border-b border-dashed border-black py-1 mb-2">
        <div className="flex justify-between"><span>Date: {format(new Date(), 'dd/MM/yyyy HH:mm')}</span></div>
        <div className="flex justify-between"><span>Table No: {table.name}</span><span>Waiter: {user?.user_metadata?.full_name || 'N/A'}</span></div>
      </div>
      <table className="w-full"><thead><tr className="border-b border-dashed border-black"><th className="text-left py-1">Item</th><th className="text-right py-1">Qty</th></tr></thead><tbody>
        {order.items.map(item => {
          const orderItemId = `${item.menuItem.id}-${item.variant.name}`;
          return (
            <tr key={orderItemId}><td className="py-1">{item.menuItem.name} {item.variant.name !== 'Regular' ? `(${item.variant.name})` : ''}</td><td className="text-right py-1">{item.quantity}</td></tr>
          );
        })}
      </tbody></table>
    </div>
  );
}

export default function TakeOrderPage() {
  const params = useParams<{ tableId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { user, appUser } = useAuth();
  const { ownerId, activeBranchId } = useActiveBranch();
  
  const [table, setTable] = useState<UITable | null>(null);
  const [restaurantProfile, setRestaurantProfile] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<UIMenuItem[]>([]);
  const [allCategories, setAllCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  const addItemSfxRef = useRef<HTMLAudioElement>(null);

  const [order, setOrder] = useState<typeof initialOrderState>({ ...initialOrderState });
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<UIMenuItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        if (user) setRestaurantProfile(appUser);

        // Table
        const { data: tableRow } = await supabase
          .from('tables')
          .select('id, name, location')
          .eq('id', params.tableId)
          .eq('owner_id', ownerId as any)
          .eq('branch_id', activeBranchId as any)
          .maybeSingle();
        if (tableRow) setTable(tableRow as UITable);

        // Menu and categories
        const { data: menuData } = await supabase
          .from('menu_items')
          .select('id, name, category, part_number')
          .eq('owner_id', ownerId as any)
          .eq('branch_id', activeBranchId as any);

        const menuIds = (menuData || []).map((m) => m.id);
        const { data: variantData } = menuIds.length
          ? await supabase
              .from('menu_item_variants')
              .select('id, menu_item_id, name, cost_price, selling_price')
              .in('menu_item_id', menuIds)
          : { data: [] as any } as any;

        const { data: categoryData } = await supabase
          .from('categories')
          .select('id, name')
          .eq('owner_id', ownerId as any)
          .eq('branch_id', activeBranchId as any);

        const variantsByMenuId = new Map<string, UIVariant[]>();
        (variantData || []).forEach((v: any) => {
          const list = variantsByMenuId.get(v.menu_item_id) || [];
          list.push({ id: v.id, name: v.name, costPrice: Number(v.cost_price || 0), sellingPrice: Number(v.selling_price) });
          variantsByMenuId.set(v.menu_item_id, list);
        });
        const items: UIMenuItem[] = (menuData || []).map(m => ({ id: m.id, name: m.name, category: m.category, partNumber: (m as any).part_number || undefined, variants: variantsByMenuId.get(m.id) || [] }));
        setMenuItems(items);
        setAllCategories((categoryData || []).map(c => ({ id: c.id, name: c.name })));

        // Load pending order for this table
        const { data: po } = await supabase
          .from('pending_orders')
          .select('id, subtotal, sgst_rate, cgst_rate, sgst_amount, cgst_amount, total')
          .eq('table_id', params.tableId)
          .eq('owner_id', ownerId as any)
          .eq('branch_id', activeBranchId as any)
          .maybeSingle();
        if (po) {
          setPendingOrderId(po.id);
          // Load items
          const { data: poItems } = await supabase.from('pending_order_items').select('menu_item_id, variant_id, quantity').eq('pending_order_id', po.id);
          const uiItems: UIOrderItem[] = (poItems || []).map(it => {
            const mi = items.find(m => m.id === it.menu_item_id);
            const vr = mi?.variants.find(v => v.id === it.variant_id);
            if (!mi || !vr) return null as any;
            return { menuItem: mi, variant: vr, quantity: it.quantity };
          }).filter(Boolean);
          setOrder({
            items: uiItems,
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
        console.error('Error fetching data:', error);
        toast({ title: 'Error', description: 'Failed to load page data.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    if (params.tableId && user && ownerId && activeBranchId) fetchInitialData();
    else setLoading(false);
  }, [params.tableId, toast, user, appUser, ownerId, activeBranchId]);

  const recomputeTotals = (items: UIOrderItem[], base: typeof initialOrderState) => {
    const subtotal = items.reduce((acc, item) => acc + item.variant.sellingPrice * item.quantity, 0);
    const taxableAmount = subtotal;
    const sgstAmount = taxableAmount * (base.sgstRate / 100);
    const cgstAmount = taxableAmount * (base.cgstRate / 100);
    const total = taxableAmount + sgstAmount + cgstAmount;
    return { subtotal, sgstAmount, cgstAmount, total };
  };

  const persistPendingOrder = async (updated: typeof initialOrderState) => {
    // Ensure pending_orders row exists
    let poId = pendingOrderId;
    if (!poId) {
      const { data: existing } = await supabase
        .from('pending_orders')
        .select('id')
        .eq('table_id', params.tableId)
        .eq('owner_id', ownerId as any)
        .eq('branch_id', activeBranchId as any)
        .maybeSingle();
      if (existing) poId = existing.id; else {
        const { data: inserted, error } = await supabase
          .from('pending_orders')
          .insert({ table_id: params.tableId, subtotal: updated.subtotal, sgst_rate: updated.sgstRate, cgst_rate: updated.cgstRate, sgst_amount: updated.sgstAmount, cgst_amount: updated.cgstAmount, total: updated.total, owner_id: ownerId, branch_id: activeBranchId } as any)
          .select('id')
          .single();
        if (error) throw error;
        poId = inserted!.id;
      }
      setPendingOrderId(poId);
    } else {
      await supabase
        .from('pending_orders')
        .update({ subtotal: updated.subtotal, sgst_rate: updated.sgstRate, cgst_rate: updated.cgstRate, sgst_amount: updated.sgstAmount, cgst_amount: updated.cgstAmount, total: updated.total })
        .eq('id', poId)
        .eq('owner_id', ownerId as any)
        .eq('branch_id', activeBranchId as any);
    }

    // Replace items
    await supabase.from('pending_order_items').delete().eq('pending_order_id', poId!);
    if (updated.items.length > 0) {
      const payload = updated.items.map(i => ({ pending_order_id: poId!, menu_item_id: i.menuItem.id, variant_id: i.variant.id, quantity: i.quantity }));
      await supabase.from('pending_order_items').insert(payload);
    } else {
      // If empty, delete the order row too
      await supabase
        .from('pending_orders')
        .delete()
        .eq('id', poId!)
        .eq('owner_id', ownerId as any)
        .eq('branch_id', activeBranchId as any);
      setPendingOrderId(null);
    }
  };

  const updatePendingOrder = async (updatedItems: UIOrderItem[]) => {
    const base = { ...order, items: updatedItems };
    const totals = recomputeTotals(updatedItems, base);
    const updatedOrderData = { ...base, ...totals, tableId: params.tableId };
    setOrder(updatedOrderData);
    try {
      await persistPendingOrder(updatedOrderData);
    } catch (e) {
      console.error('Failed to persist pending order:', e);
      toast({ title: 'Save Failed', description: 'Could not save pending order.', variant: 'destructive' });
    }
  };

  const handleMenuItemClick = (menuItem: UIMenuItem) => {
    if (!activeBranchId) {
      toast({ title: 'No active branch', description: 'Select an active branch before taking orders.', variant: 'destructive' });
      return;
    }
    if (menuItem.variants.length > 1) {
      setSelectedMenuItem(menuItem);
      setIsVariantDialogOpen(true);
    } else if (menuItem.variants[0]) {
      addToOrder(menuItem, menuItem.variants[0]);
    }
  };

  const playSound = () => { addItemSfxRef.current?.play().catch(e => console.error('Error playing sound:', e)); };

  const addToOrder = async (menuItem: UIMenuItem, variant: UIVariant) => {
    if (!activeBranchId) {
      toast({ title: 'No active branch', description: 'Select an active branch before taking orders.', variant: 'destructive' });
      return;
    }
    const orderItemId = `${menuItem.id}-${variant.name}`;
    const existingItem = order.items.find(item => `${item.menuItem.id}-${item.variant.name}` === orderItemId);
    let newItems: UIOrderItem[];
    if (existingItem) {
      newItems = order.items.map(item => `${item.menuItem.id}-${item.variant.name}` === orderItemId ? { ...item, quantity: item.quantity + 1 } : item);
    } else {
      newItems = [...order.items, { menuItem, variant, quantity: 1 }];
    }
    await updatePendingOrder(newItems);
    playSound();
  };
  
  const updateQuantity = async (orderItemId: string, change: number) => {
    if (!activeBranchId) {
      toast({ title: 'No active branch', description: 'Select an active branch before updating orders.', variant: 'destructive' });
      return;
    }
    const newItems = order.items.map(item =>
      `${item.menuItem.id}-${item.variant.name}` === orderItemId ? { ...item, quantity: Math.max(0, item.quantity + change) } : item
    ).filter(item => item.quantity > 0);
    await updatePendingOrder(newItems);
  };

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(searchLower) || (item.partNumber && item.partNumber.toLowerCase().includes(searchLower));
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, searchTerm, selectedCategory]);

  const handleSendToBilling = () => {
    if (!activeBranchId) {
      toast({ title: 'No active branch', description: 'Select an active branch before proceeding to billing.', variant: 'destructive' });
      return;
    }
    if (order.items.length === 0) {
      toast({ title: 'Cannot proceed', description: 'The order is empty.', variant: 'destructive' });
      return;
    }
    router.push(`/order/${params.tableId}`);
  };

  if (loading) {
    return <div className="p-4 sm:p-6"><Skeleton className="h-8 w-64 mb-6" /><div className="grid md:grid-cols-2 gap-8"><Skeleton className="h-[70vh] w-full" /><Skeleton className="h-[70vh] w-full" /></div></div>;
  }
  if (!table) return <div>Table not found</div>;

  const handleVariantSelection = async (variantName: string) => {
    if(selectedMenuItem) {
      const variant = selectedMenuItem.variants.find(v => v.name === variantName);
      if (variant) await addToOrder(selectedMenuItem, variant);
    }
    setIsVariantDialogOpen(false);
    setSelectedMenuItem(null);
  };

  return (
    <>
      <audio ref={addItemSfxRef} src="https://cdn.pixabay.com/download/audio/2023/12/09/audio_37d2c0e795.mp3?filename=tap-notification-180637.mp3" preload="auto" />
      <div className="print-only">
         {table && <PrintableKOT order={order} table={table} restaurantProfile={restaurantProfile} user={user} />}
      </div>
      <div className="print-hide flex flex-col h-[calc(100vh_-_theme(spacing.24))] lg:h-[calc(100vh_-_theme(spacing.32))]">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/tables"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
            <h1 className="text-xl sm:text-3xl font-bold font-headline">Order for {table.name}</h1>
          </div>
          {!activeBranchId && (
            <div className="p-3 mb-4 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              Select an active branch to take orders. Go to Branches to select a branch.
            </div>
          )}
        <div className="grid md:grid-cols-2 gap-8 flex-1 min-h-0">
          <Card className="flex flex-col">
            <CardHeader><CardTitle className="font-headline text-xl md:text-2xl">Added Items</CardTitle></CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 p-2 sm:p-6">
              {order.items.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                      <p>No items in the order yet.</p>
                      <p className="text-sm">Click on menu items to add them.</p>
                  </div>
              ) : (
                  <ScrollArea className="h-full pr-2 sm:pr-4">
                      <Table>
                          <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-center">Qty</TableHead><TableHead className="text-right">Price</TableHead></TableRow></TableHeader>
                          <TableBody>
                          {order.items.map((item) => {
                            const orderItemId = `${item.menuItem.id}-${item.variant.name}`;
                            return (
                              <TableRow key={orderItemId}>
                                <TableCell className="font-medium text-xs sm:text-sm">{item.menuItem.name} <span className="text-muted-foreground text-xs">({item.variant.name})</span></TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                                    <Button size="icon" variant="ghost" className="h-6 w-6 sm:h-7 sm:w-7 text-red-500 hover:text-red-500 hover:bg-red-500/10" onClick={() => updateQuantity(orderItemId, -1)}><Minus className="h-3 w-3" /></Button>
                                    <span className="text-sm font-medium">{item.quantity}</span>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 sm:h-7 sm:w-7 text-green-500 hover:text-green-500 hover:bg-green-500/10" onClick={() => updateQuantity(orderItemId, 1)}><Plus className="h-3 w-3" /></Button>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs sm:text-sm">Rs. {item.variant.sellingPrice.toFixed(2)}</TableCell>
                              </TableRow>
                            );
                          })}
                          </TableBody>
                      </Table>
                  </ScrollArea>
              )}
            </CardContent>
            <CardFooter>
                <Button size="lg" className="w-full" disabled={order.items.length === 0 || !activeBranchId} onClick={handleSendToBilling}>
                   <Receipt className="mr-2 h-4 w-4" />
                   Proceed to Bill
                </Button>
            </CardFooter>
          </Card>
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-headline text-xl md:text-2xl">Menu</CardTitle>
              <Button variant="outline" disabled={order.items.length === 0 || !activeBranchId} onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print KOT
              </Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-2 sm:p-6">
               <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by name or part number..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {allCategories.map(cat => (<SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <ScrollArea className="h-full pr-2 sm:pr-4">
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                  {menuItems.filter(item => {
                    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
                    const s = searchTerm.toLowerCase();
                    const matchesSearch = item.name.toLowerCase().includes(s) || (item.partNumber && item.partNumber.toLowerCase().includes(s));
                    return matchesCategory && matchesSearch;
                  }).map((item) => (
                    <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow flex flex-col" onClick={() => handleMenuItemClick(item)}>
                      <CardContent className="p-3 flex-grow flex flex-col justify-center">
                        <h3 className="font-semibold text-sm leading-tight">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </CardContent>
                      <CardFooter className="p-3 border-t bg-muted/30">
                        <p className="text-sm text-primary font-bold">Rs. {item.variants[0]?.sellingPrice.toFixed(2)}{item.variants.length > 1 ? '+' : ''}</p>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-headline text-lg">Select a size for {selectedMenuItem?.name}</DialogTitle>
            </DialogHeader>
            <RadioGroup onValueChange={handleVariantSelection} className="py-4 space-y-2">
              {selectedMenuItem?.variants.map(variant => (
                <Label htmlFor={variant.name} key={variant.name} className="flex items-center justify-between cursor-pointer p-4 border rounded-md transition-all hover:border-primary has-[:checked]:bg-primary/10 has-[:checked]:border-primary has-[:checked]:shadow-inner">
                  <div className="flex items-center gap-4"><RadioGroupItem value={variant.name} id={variant.name} /><span className="font-semibold text-base">{variant.name}</span></div>
                  <span className="font-mono text-primary font-bold text-base">Rs. {variant.sellingPrice.toFixed(2)}</span>
                </Label>
              ))}
            </RadioGroup>
          </DialogContent>
        </Dialog>

      </div>
    </>
  );
}
