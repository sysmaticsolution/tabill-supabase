
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import { InventoryItem, KitchenRequest } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Combobox } from '@/components/ui/combobox';
import { supabase } from '@/lib/supabase';
import { useActiveBranch } from '@/hooks/use-active-branch';

function ItemDialog({
  isOpen,
  setIsOpen,
  item,
  onSave,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  item: InventoryItem | null;
  onSave: (data: Omit<InventoryItem, 'id' | 'owner_id' | 'quantity' | 'last_updated' | 'created_at'>, id?: string) => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('');
  const [reorderLevel, setReorderLevel] = useState<number | string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setName(item.name);
        setCategory(item.category);
        setUnit(item.unit);
        setReorderLevel(item.reorder_level);
      } else {
        setName('');
        setCategory('');
        setUnit('');
        setReorderLevel('');
      }
    }
  }, [item, isOpen]);

  const handleSave = () => {
    const level = parseFloat(reorderLevel as string);
    if (!name.trim() || !unit.trim() || !category.trim() || isNaN(level)) {
      toast({ title: 'Validation Error', description: 'All fields are required.', variant: 'destructive' });
      return;
    }
    onSave({ name, category, unit, reorder_level: level } as any, item?.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">{item ? 'Edit Item' : 'Add New Inventory Item'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="i-name">Item Name</Label>
            <Input id="i-name" placeholder="e.g., Onions" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="i-cat">Category</Label>
            <Input id="i-cat" placeholder="e.g., Vegetables" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="i-unit">Unit</Label>
            <Input id="i-unit" placeholder="e.g., kg, L, pack" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="i-reorder">Reorder Level</Label>
            <Input id="i-reorder" type="number" placeholder="e.g., 5" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function InventoryPage() {
  const { user, appUser, staffMember } = useAuth();
  const { ownerId, activeBranchId, loading: branchLoading } = useActiveBranch();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [requests, setRequests] = useState<KitchenRequest[]>([]);

  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [stockUpdateItems, setStockUpdateItems] = useState<{ [itemId: string]: number | string }>({});

  const fetchData = async () => {
    if (!ownerId || !activeBranchId) return;
    setLoading(true);
    try {
      const [itemsRes, requestsRes] = await Promise.all([
        supabase
          .from('inventory_items')
          .select('*')
          .eq('owner_id', ownerId)
          .eq('branch_id', activeBranchId)
          .order('name', { ascending: true }),
        supabase
          .from('kitchen_requests')
          .select('*')
          .eq('owner_id', ownerId)
          .eq('branch_id', activeBranchId)
          .eq('status', 'Pending')
          .order('request_date', { ascending: false }),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (requestsRes.error) throw requestsRes.error;

      setItems((itemsRes.data as any) || []);
      setRequests((requestsRes.data as any) || []);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error fetching data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ownerId && activeBranchId) {
      fetchData();
    }
  }, [ownerId, activeBranchId]);

  const handleSaveItem = async (
    data: Omit<InventoryItem, 'id' | 'owner_id' | 'quantity' | 'last_updated' | 'created_at'>,
    id?: string
  ) => {
    if (!ownerId || !activeBranchId) return;
    try {
      if (id) {
        const { error } = await supabase
          .from('inventory_items')
          .update(data as any)
          .eq('id', id)
          .eq('owner_id', ownerId)
          .eq('branch_id', activeBranchId);
        if (error) throw error;
      } else {
        const newItem = {
          ...data,
          owner_id: ownerId,
          branch_id: activeBranchId,
          quantity: 0,
          last_updated: new Date().toISOString(),
        } as any;
        const { error } = await supabase.from('inventory_items').insert(newItem);
        if (error) throw error;
      }
      toast({ title: `Item ${id ? 'updated' : 'added'}` });
      setIsItemDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to save item', variant: 'destructive' });
    }
  };

  const handleStockUpdateChange = (itemId: string, quantity: string) => {
    setStockUpdateItems((prev) => ({ ...prev, [itemId]: quantity }));
  };

  const handleApplyStockUpdates = async () => {
    if (!ownerId || !activeBranchId || Object.keys(stockUpdateItems).length === 0) return;

    let hasValidUpdate = false;
    const updates: Promise<any>[] = [];

    for (const [itemId, quantityStr] of Object.entries(stockUpdateItems)) {
      const quantity = parseFloat(quantityStr as string);
      if (!isNaN(quantity) && quantity !== 0) {
        hasValidUpdate = true;
        const currentItem = items.find((i) => i.id === itemId);
        if (currentItem) {
          const newQty = (currentItem.quantity || 0) + quantity;
          updates.push((async () => {
            return await supabase
              .from('inventory_items')
              .update({ quantity: newQty, last_updated: new Date().toISOString() })
              .eq('id', itemId)
              .eq('owner_id', ownerId)
              .eq('branch_id', activeBranchId);
          })());
        }
      }
    }

    if (!hasValidUpdate) {
      toast({ title: 'No changes to apply', description: 'Please enter a non-zero quantity to update.', variant: 'destructive' });
      return;
    }

    try {
      const results = await Promise.all(updates);
      const anyError = results.find((r: any) => r.error);
      if (anyError) throw anyError.error;
      toast({ title: 'Stock Updated Successfully' });
      setStockUpdateItems({});
      fetchData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to update stock', variant: 'destructive' });
    }
  };

  const handleFulfillRequest = async (request: KitchenRequest) => {
    if (!ownerId || !activeBranchId) return;
    try {
      // Deduct inventory as per request items (non-transactional demo)
      for (const requestedItem of request.items as any[]) {
        const { data: inv, error: invErr } = await supabase
          .from('inventory_items')
          .select('id, quantity')
          .eq('id', requestedItem.inventory_item_id)
          .eq('owner_id', ownerId)
          .eq('branch_id', activeBranchId)
          .maybeSingle();
        if (invErr) throw invErr;
        if (!inv) throw new Error(`Item ${requestedItem.item_name} not found in inventory.`);
        if ((inv.quantity || 0) < requestedItem.quantity) {
          throw new Error(
            `Not enough stock for ${requestedItem.item_name}. Available: ${inv.quantity}, Requested: ${requestedItem.quantity}`
          );
        }
        const { error: updErr } = await supabase
          .from('inventory_items')
          .update({ quantity: (inv.quantity || 0) - requestedItem.quantity, last_updated: new Date().toISOString() })
          .eq('id', requestedItem.inventory_item_id)
          .eq('owner_id', ownerId)
          .eq('branch_id', activeBranchId);
        if (updErr) throw updErr;
      }

      const { error: reqErr } = await supabase
        .from('kitchen_requests')
        .update({ status: 'Fulfilled', fulfilled_date: new Date().toISOString() })
        .eq('id', request.id)
        .eq('owner_id', ownerId)
        .eq('branch_id', activeBranchId);
      if (reqErr) throw reqErr;

      toast({ title: 'Request Fulfilled', description: 'Stock has been updated.' });
      fetchData();
    } catch (error: any) {
      console.error('Error fulfilling request:', error);
      toast({ title: 'Fulfillment Failed', description: error.message, variant: 'destructive' });
    }
  };

  const inventoryComboboxItems = useMemo(() => {
    return items.map((item) => ({ value: item.id, label: `${item.name} (${item.unit})` }));
  }, [items]);

  return (
    <div className="flex flex-col gap-6">
      <ItemDialog isOpen={isItemDialogOpen} setIsOpen={setIsItemDialogOpen} item={editingItem} onSave={handleSaveItem} />
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Inventory Management</h1>
        <Button
          onClick={() => {
            setEditingItem(null);
            setIsItemDialogOpen(true);
          }}
          disabled={!activeBranchId}
          className="w-full sm:w-auto"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Item
        </Button>
      </div>

      <Tabs defaultValue="stock">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stock">Current Stock</TabsTrigger>
          <TabsTrigger value="update">Add/Edit Stock</TabsTrigger>
          <TabsTrigger value="requests">
            Kitchen Requests {requests.length > 0 && <Badge className="ml-2">{requests.length}</Badge>}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="stock" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Stock</CardTitle>
              <CardDescription>Overview of all items in your inventory.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Reorder At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                          No inventory items found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => {
                        const isLowStock = (item.quantity || 0) <= (item.reorder_level || 0);
                        return (
                          <TableRow key={item.id} className={isLowStock ? 'bg-destructive/10 hover:bg-destructive/20' : ''}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell className="text-right font-mono">
                              {item.quantity} {item.unit}
                            </TableCell>
                            <TableCell className="text-right font-mono">{item.reorder_level} {item.unit}</TableCell>
                            <TableCell className="text-right">
                              {isLowStock && (
                                <Badge variant="destructive" className="mr-2">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Low Stock
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingItem(item);
                                  setIsItemDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="update" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Add or Remove Stock</CardTitle>
              <CardDescription>
                Use positive numbers to add stock (e.g., after a purchase) and negative numbers to remove stock (e.g., for
                wastage).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-3 items-center gap-4">
                    <Label>
                      {item.name} <span className="text-muted-foreground">({item.unit})</span>
                    </Label>
                    <p className="text-sm font-mono text-muted-foreground">Current: {item.quantity}</p>
                    <Input
                      type="number"
                      placeholder="e.g., 10 or -2"
                      value={stockUpdateItems[item.id] || ''}
                      onChange={(e) => handleStockUpdateChange(item.id, e.target.value)}
                    />
                  </div>
                ))}
                {items.length === 0 && !loading && (
                  <p className="text-center text-muted-foreground py-8">
                    No items in inventory to update. Add items from the "Current Stock" tab first.
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleApplyStockUpdates} disabled={!activeBranchId || Object.keys(stockUpdateItems).length === 0}>
                Apply All Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="requests" className="mt-6">
          <div className="space-y-4">
            {loading && <Skeleton className="h-48 w-full" />}
            {!loading && requests.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">No pending kitchen requests.</CardContent>
              </Card>
            )}
            {requests.map((req) => (
              <Card key={req.id}>
                <CardHeader>
                  <CardTitle className="text-lg">Request from {req.requesting_staff_name}</CardTitle>
                  <CardDescription>{format(new Date(req.request_date), 'dd/MM/yyyy, hh:mm a')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(req.items as any[]).map((item) => (
                      <li key={item.inventory_item_id} className="flex justify-between">
                        <span>{item.item_name}</span>{' '}
                        <span className="font-mono">
                          {item.quantity} {item.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => handleFulfillRequest(req)}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Fulfill Request
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
