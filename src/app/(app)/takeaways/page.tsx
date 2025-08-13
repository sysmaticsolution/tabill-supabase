
'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Minus, Search, CreditCard, Save, ShoppingBag } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { useActiveBranch } from '@/hooks/use-active-branch';

// Local UI types compatible with existing components
interface UIVariant {
  id: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
}
interface UIMenuItem {
  id: string;
  name: string;
  category: string;
  partNumber?: string;
  variants: UIVariant[];
}
interface UIOrderItem {
  menuItem: UIMenuItem;
  variant: UIVariant;
  quantity: number;
}

const initialOrderState = {
  items: [] as UIOrderItem[],
  subtotal: 0,
  sgstRate: 9,
  cgstRate: 9,
  sgstAmount: 0,
  cgstAmount: 0,
  total: 0,
  tableId: 'takeaway',
  orderType: 'takeaway' as const,
  paymentStatus: 'Unpaid' as const,
};

export default function TakeawaysPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { ownerId, activeBranchId } = useActiveBranch();
  
  const [menuItems, setMenuItems] = useState<UIMenuItem[]>([]);
  const [allCategories, setAllCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  const addItemSfxRef = useRef<HTMLAudioElement>(null);

  const [order, setOrder] = useState(initialOrderState);

  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<UIMenuItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [{ data: menuData, error: miErr }, { data: variantData, error: mvErr }, { data: categoryData, error: catErr }] = await Promise.all([
          supabase.from('menu_items').select('id, name, category, part_number').eq('owner_id', ownerId as any).eq('branch_id', activeBranchId as any),
          supabase.from('menu_item_variants').select('id, menu_item_id, name, cost_price, selling_price'),
          supabase.from('categories').select('id, name').eq('owner_id', ownerId as any).eq('branch_id', activeBranchId as any)
        ]);
        if (miErr) throw miErr;
        if (mvErr) throw mvErr;
        if (catErr) throw catErr;

        const variantsByMenuId = new Map<string, UIVariant[]>();
        (variantData || []).forEach((v: any) => {
          const list = variantsByMenuId.get(v.menu_item_id) || [];
          list.push({ id: v.id, name: v.name, costPrice: Number(v.cost_price || 0), sellingPrice: Number(v.selling_price) });
          variantsByMenuId.set(v.menu_item_id, list);
        });

        const items: UIMenuItem[] = (menuData || []).map(m => ({
          id: m.id,
          name: m.name,
          category: m.category,
          partNumber: (m as any).part_number || undefined,
          variants: variantsByMenuId.get(m.id) || [],
        }));

        setMenuItems(items);
        setAllCategories((categoryData || []).map(c => ({ id: c.id, name: c.name })));
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({ title: 'Error', description: 'Failed to load menu data.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    if (user && ownerId && activeBranchId) fetchInitialData(); else setLoading(false);
  }, [toast, user, ownerId, activeBranchId]);
  
  const calculateTotals = (items: UIOrderItem[], sgst: number, cgst: number) => {
    const subtotal = items.reduce((acc, item) => acc + item.variant.sellingPrice * item.quantity, 0);
    const sgstAmount = subtotal * (sgst / 100);
    const cgstAmount = subtotal * (cgst / 100);
    const total = subtotal + sgstAmount + cgstAmount;

    setOrder(prev => ({ ...prev, items, subtotal, sgstRate: sgst, cgstRate: cgst, sgstAmount, cgstAmount, total }));
  };

  useEffect(() => {
    calculateTotals(order.items, order.sgstRate, order.cgstRate);
  }, [order.items, order.sgstRate, order.cgstRate]);

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
  }

  const playSound = () => {
    addItemSfxRef.current?.play().catch(e => console.error('Error playing sound:', e));
  }

  const addToOrder = (menuItem: UIMenuItem, variant: UIVariant) => {
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
    setOrder(prev => ({...prev, items: newItems}));
    playSound();
  };
  
  const updateQuantity = (orderItemId: string, change: number) => {
    const newItems = order.items.map(item =>
      `${item.menuItem.id}-${item.variant.name}` === orderItemId ? { ...item, quantity: Math.max(0, item.quantity + change) } : item
    ).filter(item => item.quantity > 0);
    setOrder(prev => ({...prev, items: newItems}));
  };

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(searchLower) || (item.partNumber && item.partNumber.toLowerCase().includes(searchLower));
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, searchTerm, selectedCategory]);

  const handleVariantSelection = (variantName: string) => {
    if(selectedMenuItem) {
      const variant = selectedMenuItem.variants.find(v => v.name === variantName);
      if (variant) {
        addToOrder(selectedMenuItem, variant);
      }
    }
    setIsVariantDialogOpen(false);
    setSelectedMenuItem(null);
  }

  const saveFinalOrder = async (paymentMethod: 'Cash' | 'Card / UPI') => {
    if (!activeBranchId) {
      toast({ title: 'No active branch', description: 'Select an active branch before saving orders.', variant: 'destructive' });
      return;
    }
    if (order.items.length === 0) {
      toast({ title: 'Cannot save an empty order.', variant: 'destructive' });
      return;
    }

    try {
      // Insert order
      const { data: insertedOrders, error: insertErr } = await supabase
        .from('orders')
        .insert({
          order_number: `TKO-${Date.now()}`,
          table_id: null,
          order_type: 'takeaway',
          subtotal: order.subtotal,
          sgst_rate: order.sgstRate,
          cgst_rate: order.cgstRate,
          sgst_amount: order.sgstAmount,
          cgst_amount: order.cgstAmount,
          total: order.total,
          payment_status: 'Paid',
          payment_method: paymentMethod,
          staff_id: null,
          staff_name: undefined,
          order_date: new Date().toISOString(),
          owner_id: ownerId as any,
          branch_id: activeBranchId as any,
        })
        .select('id')
        .single();
      if (insertErr) throw insertErr;

      const orderId = insertedOrders!.id;

      // Prepare order items
      const orderItemsPayload = order.items.map(oi => ({
        order_id: orderId,
        menu_item_id: oi.menuItem.id,
        variant_id: oi.variant.id,
        quantity: oi.quantity,
        unit_price: oi.variant.sellingPrice,
        total_price: oi.variant.sellingPrice * oi.quantity,
      }));
      const { error: itemsErr } = await supabase.from('order_items').insert(orderItemsPayload);
      if (itemsErr) throw itemsErr;

      toast({ title: 'Order Saved!', description: 'Takeaway order has been saved.' });
      setOrder(initialOrderState); // Reset for next order
    } catch (error) {
      console.error('Error saving order: ', error);
      toast({ title: 'Save Failed', variant: 'destructive' });
    }
  }

  return (
    <>
      <audio ref={addItemSfxRef} src="https://cdn.pixabay.com/download/audio/2023/12/09/audio_37d2c0e795.mp3?filename=tap-notification-180637.mp3" preload="auto" />
      <div className="flex flex-col h-[calc(100vh_-_theme(spacing.24))] lg:h-[calc(100vh_-_theme(spacing.32))]">
          <div className="flex items-center gap-4 mb-6">
            <h1 className="text-xl sm:text-3xl font-bold font-headline flex items-center gap-2">
                <ShoppingBag className="h-7 w-7"/> Takeaway Orders
            </h1>
          </div>
          {!activeBranchId && (
            <div className="p-3 mb-4 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              Select an active branch to proceed with takeaways. Go to Branches to select a branch.
            </div>
          )}
        <div className="grid lg:grid-cols-2 gap-8 flex-1 min-h-0">
          {/* Right side: Menu */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-headline text-xl md:text-2xl">Menu</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-2 sm:p-6">
               <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name or part number..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {allCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ScrollArea className="h-full max-h-[calc(100vh_-_20rem)] pr-2 sm:pr-4">
                {loading ? <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">{Array.from({length: 6}).map((_, i) => <Skeleton key={i} className="h-24" />)}</div> :
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                  {filteredMenuItems.map((item) => (
                    <Card key={item.id} className={`cursor-pointer hover:shadow-md transition-shadow flex flex-col ${!activeBranchId ? 'pointer-events-none opacity-60' : ''}`} onClick={() => handleMenuItemClick(item)}>
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
                }
              </ScrollArea>
            </CardContent>
          </Card>
          {/* Left Side: Order & Bill */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline text-xl md:text-2xl">Current Takeaway Order</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 p-2 sm:p-6">
              {order.items.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                      <p>No items in the order yet.</p>
                      <p className="text-sm">Click on menu items to add them.</p>
                  </div>
              ) : (
                  <ScrollArea className="h-full max-h-[30vh] pr-2 sm:pr-4">
                      <Table>
                          <TableHeader>
                          <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead className="text-center">Qty</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                          </TableHeader>
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
                                <TableCell className="text-right font-mono text-xs sm:text-sm">Rs. {(item.variant.sellingPrice * item.quantity).toFixed(2)}</TableCell>
                              </TableRow>
                            )})}
                          </TableBody>
                      </Table>
                  </ScrollArea>
              )}
            </CardContent>
            {order.items.length > 0 && 
              <CardFooter className="flex-col items-stretch p-4 mt-auto border-t">
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-mono">Rs. {order.subtotal.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <Label>CGST @ {order.cgstRate}%</Label>
                        <span className="font-mono">Rs. {order.cgstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <Label>SGST @ {order.sgstRate}%</Label>
                        <span className="font-mono">Rs. {order.sgstAmount.toFixed(2)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-base md:text-lg">
                        <span>Total</span>
                        <span className="font-mono">Rs. {order.total.toFixed(2)}</span>
                    </div>
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-2 gap-4">
                  <Button size="lg" disabled={order.items.length === 0 || !activeBranchId} onClick={() => saveFinalOrder('Cash')}>
                    <Save className="mr-2 h-4 w-4" />
                    Paid by Cash
                  </Button>
                   <Button size="lg" disabled={order.items.length === 0 || !activeBranchId} onClick={() => saveFinalOrder('Card / UPI')}>
                       <CreditCard className="mr-2 h-4 w-4" />
                       Paid by Card / UPI
                     </Button>
                </div>
              </CardFooter>
            }
          </Card>
        </div>

        <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-headline text-lg">Select a size for {selectedMenuItem?.name}</DialogTitle></DialogHeader>
              <RadioGroup onValueChange={handleVariantSelection} className="py-4 space-y-2">
                {selectedMenuItem?.variants.map(variant => (
                  <Label htmlFor={variant.name} key={variant.id} className="flex items-center justify-between cursor-pointer p-4 border rounded-md transition-all hover:border-primary has-[:checked]:bg-primary/10 has-[:checked]:border-primary has-[:checked]:shadow-inner">
                    <div className="flex items-center gap-4">
                      <RadioGroupItem value={variant.name} id={variant.name} />
                      <span className="font-semibold text-base">{variant.name}</span>
                    </div>
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
