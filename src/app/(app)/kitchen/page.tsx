
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import { InventoryItem, KitchenRequest } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Combobox } from '@/components/ui/combobox';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useActiveBranch } from '@/hooks/use-active-branch';

type RequestFormItem = {
  inventoryItemId: string;
  itemName: string;
  quantity: number | string;
  unit: string;
};

export default function KitchenPage() {
  const { user } = useAuth();
  const { ownerId, activeBranchId } = useActiveBranch();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [requests, setRequests] = useState<KitchenRequest[]>([]);
  
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [newRequestItems, setNewRequestItems] = useState<RequestFormItem[]>([]);

  const fetchData = async () => {
    if (!ownerId || !activeBranchId) return;
    setLoading(true);
    try {
      const invRes = await supabase
        .from('inventory_items')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('branch_id', activeBranchId)
        .order('name', { ascending: true });
      if (invRes.error) throw invRes.error;
      setInventoryItems((invRes.data as any) || []);

      const reqRes = await supabase
        .from('kitchen_requests')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('branch_id', activeBranchId)
        .order('request_date', { ascending: false });
      if (reqRes.error) throw reqRes.error;
      setRequests((reqRes.data as any) || []);
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
    } else {
      setLoading(false);
    }
  }, [ownerId, activeBranchId]);
  
  const openRequestDialog = () => {
    setNewRequestItems([{ inventoryItemId: '', itemName: '', quantity: '', unit: '' }]);
    setIsRequestDialogOpen(true);
  };

  const addRequestItem = () => {
    setNewRequestItems([...newRequestItems, { inventoryItemId: '', itemName: '', quantity: '', unit: '' }]);
  };

  const updateRequestItem = (index: number, field: keyof RequestFormItem, value: string) => {
    const newItems = [...newRequestItems];
    const item = newItems[index];
    (item as any)[field] = value;
    
    if (field === 'inventoryItemId') {
      const selected = inventoryItems.find((i) => i.id === value);
      if (selected) {
        item.itemName = selected.name;
        item.unit = selected.unit;
      }
    }
    setNewRequestItems(newItems);
  };
  
  const removeRequestItem = (index: number) => {
    setNewRequestItems(newRequestItems.filter((_, i) => i !== index));
  };
  
  const handleSubmitRequest = async () => {
    if (!ownerId || !activeBranchId || newRequestItems.length === 0) {
      toast({ title: 'Request is empty', variant: 'destructive' });
      return;
    }
    
    const finalRequestItems = newRequestItems
      .map((item) => ({
        inventory_item_id: item.inventoryItemId,
        item_name: item.itemName,
        quantity: parseFloat(item.quantity as string),
        unit: item.unit,
      }))
      .filter((item) => item.inventory_item_id && !isNaN(item.quantity) && item.quantity > 0);

    if (finalRequestItems.length === 0) {
      toast({
        title: 'Invalid items',
        description: 'Please add valid items and quantities to your request.',
        variant: 'destructive',
      });
      return;
    }

    const newRequest: any = {
      owner_id: ownerId,
      branch_id: activeBranchId,
      items: finalRequestItems,
      status: 'Pending',
      request_date: new Date().toISOString(),
      requesting_staff_id: user?.id || (user as any)?.user_metadata?.sub || ownerId,
      requesting_staff_name: (user as any)?.user_metadata?.full_name || 'Unknown Staff',
    };
    
    try {
      const { error } = await supabase.from('kitchen_requests').insert(newRequest);
      if (error) throw error;
      toast({ title: 'Request Submitted Successfully!' });
      setIsRequestDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({ title: 'Failed to submit request', variant: 'destructive' });
    }
  };

  const inventoryComboboxItems = useMemo(() => {
    return inventoryItems.map((item) => ({ value: item.id, label: `${item.name} (${item.unit})` }));
  }, [inventoryItems]);

  return (
    <div className="flex flex-col gap-6">
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-headline">Request Materials from Inventory</DialogTitle>
            <DialogDescription>
              Select the items and quantities you need from the central store/inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
            {newRequestItems.map((item, index) => (
              <div key={index} className="flex gap-2 items-end p-2 border rounded-md">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Item</Label>
                    <Combobox
                      items={inventoryComboboxItems}
                      value={item.inventoryItemId}
                      onChange={(value) => updateRequestItem(index, 'inventoryItemId', value)}
                      placeholder="Select Item"
                      searchPlaceholder="Search items..."
                      noItemsMessage="No items found."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Quantity ({item.unit})</Label>
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateRequestItem(index, 'quantity', e.target.value)}
                    />
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeRequestItem(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={addRequestItem}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Another Item
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsRequestDialogOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSubmitRequest}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Kitchen Requests (Indents)</h1>
        <Button onClick={openRequestDialog} className="w-full sm:w-auto" disabled={!activeBranchId}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Request Materials
        </Button>
      </div>
      {!activeBranchId && (
        <div className="p-3 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
          Select an active branch to request materials.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Material Requests</CardTitle>
          <CardDescription>History of requests from the kitchen to the inventory/store.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      No requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>{format(new Date(req.request_date), 'dd/MM/yy, hh:mm a')}</TableCell>
                      <TableCell>{req.requesting_staff_name}</TableCell>
                      <TableCell>
                        <ul className="list-disc list-inside text-xs">
                          {(req.items as any[]).map((item) => (
                            <li key={item.inventory_item_id}>
                              {item.quantity} {item.unit} of {item.item_name}
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            (req.status as any) === 'Fulfilled'
                              ? 'default'
                              : (req.status as any) === 'Pending'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {req.status}
                        </Badge>
                      </TableCell>
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
