
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import { Supplier, ProcurementItem, ProcurementOrder } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Combobox } from '@/components/ui/combobox';
import { supabase } from '@/lib/supabase';

type PurchaseOrderItem = {
  itemId: string;
  itemName: string;
  quantity: number | string;
  unit: string;
  pricePerUnit: number | string;
};

// --- Sub-components for Modals and Forms ---

function SupplierDialog({
  isOpen,
  setIsOpen,
  supplier,
  onSave,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  supplier: Supplier | null;
  onSave: (data: Omit<Supplier, 'id' | 'owner_id' | 'created_at'>, id?: string) => void;
}) {
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        setName(supplier.name);
        setContactPerson(supplier.contact_person || '');
        setPhone(supplier.phone);
        setAddress(supplier.address || '');
      } else {
        setName('');
        setContactPerson('');
        setPhone('');
        setAddress('');
      }
    }
  }, [supplier, isOpen]);

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) {
      toast({ title: 'Validation Error', description: 'Supplier Name and Phone are required.', variant: 'destructive' });
      return;
    }
    onSave({ name, contact_person: contactPerson, phone, address } as any, supplier?.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">{supplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
          <DialogDescription>Enter the details for the supplier. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="s-name">Supplier Name</Label>
            <Input id="s-name" placeholder="e.g. Fresh Veggies Co." value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-phone">Phone Number</Label>
            <Input id="s-phone" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-contact">Contact Person (Optional)</Label>
            <Input id="s-contact" placeholder="e.g. Mr. Kumar" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-address">Address (Optional)</Label>
            <Input id="s-address" placeholder="123 Market Street, City" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save Supplier</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ItemDialog({
  isOpen,
  setIsOpen,
  item,
  onSave,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  item: ProcurementItem | null;
  onSave: (data: Omit<ProcurementItem, 'id' | 'owner_id' | 'created_at'>, id?: string) => void;
}) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setName(item.name);
        setUnit(item.unit);
      } else {
        setName('');
        setUnit('');
      }
    }
  }, [item, isOpen]);

  const handleSave = () => {
    if (!name.trim() || !unit.trim()) {
      toast({ title: 'Validation Error', description: 'Item Name and Unit are required.', variant: 'destructive' });
      return;
    }
    onSave({ name, unit } as any, item?.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">{item ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          <DialogDescription>Enter the details for the procurement item. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="i-name">Item Name</Label>
            <Input id="i-name" placeholder="e.g., Basmati Rice" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="i-unit">Unit</Label>
            <Input id="i-unit" placeholder="e.g., kg, L, pack" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


// --- Main Page Component ---

export default function ProcurementPage() {
  const { user, appUser, staffMember } = useAuth();
  const ownerId = (staffMember as any)?.owner_id || (appUser as any)?.id || null;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<ProcurementItem[]>([]);
  const [orders, setOrders] = useState<ProcurementOrder[]>([]);

  // State for forms and dialogs
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProcurementItem | null>(null);

  // State for new Purchase Order
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);

  const fetchData = async () => {
    if (!ownerId) return;
    setLoading(true);
    try {
      const [suppliersRes, itemsRes, ordersRes] = await Promise.all([
        supabase.from('suppliers').select('*').eq('owner_id', ownerId),
        supabase.from('procurement_items').select('*').eq('owner_id', ownerId),
        supabase.from('procurement_orders').select('*').eq('owner_id', ownerId),
      ]);
      if (suppliersRes.error) throw suppliersRes.error;
      if (itemsRes.error) throw itemsRes.error;
      if (ordersRes.error) throw ordersRes.error;
      setSuppliers((suppliersRes.data as any) || []);
      setItems((itemsRes.data as any) || []);
      setOrders((ordersRes.data as any) || []);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error fetching data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ownerId) {
      fetchData();
    }
  }, [ownerId]);

  const handleSaveSupplier = async (data: Omit<Supplier, 'id' | 'owner_id' | 'created_at'>, id?: string) => {
    if (!ownerId) return;
    try {
      if (id) {
        const { error } = await supabase.from('suppliers').update(data as any).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('suppliers').insert({ ...data, owner_id: ownerId } as any);
        if (error) throw error;
      }
      toast({ title: `Supplier ${id ? 'updated' : 'added'}` });
      setIsSupplierDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to save supplier', variant: 'destructive' });
    }
  };
  
  const handleSaveItem = async (data: Omit<ProcurementItem, 'id' | 'owner_id' | 'created_at'>, id?: string) => {
    if (!ownerId) return;
    try {
      if (id) {
        const { error } = await supabase.from('procurement_items').update(data as any).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('procurement_items').insert({ ...data, owner_id: ownerId } as any);
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

  const addPoItem = () => {
    setPoItems([...poItems, { itemId: '', itemName: '', quantity: '', unit: '', pricePerUnit: '' }]);
  };

  const updatePoItem = (index: number, field: keyof PurchaseOrderItem, value: string) => {
    const newItems = [...poItems];
    const item = newItems[index];
    (item as any)[field] = value;
    
    if (field === 'itemId') {
        const selected = items.find(i => i.id === value);
        if (selected) {
            item.itemName = selected.name;
            item.unit = selected.unit;
        }
    }

    setPoItems(newItems);
  };
  
  const removePoItem = (index: number) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const poTotalAmount = useMemo(() => {
    return poItems.reduce((total, item) => {
      const quantity = parseFloat(item.quantity as string);
      const price = parseFloat(item.pricePerUnit as string);
      return total + (isNaN(quantity) || isNaN(price) ? 0 : quantity * price);
    }, 0);
  }, [poItems]);
  
  const handleCreatePO = async () => {
    if (!ownerId || !selectedSupplier || poItems.length === 0) {
      toast({ title: 'Please select a supplier and add at least one item.', variant: 'destructive'});
      return;
    }

    const finalPoItems = poItems.map(item => ({
        item_id: item.itemId,
        item_name: item.itemName,
        quantity: parseFloat(item.quantity as string),
        unit: item.unit,
        price_per_unit: parseFloat(item.pricePerUnit as string)
    }));

    if (finalPoItems.some(item => isNaN(item.quantity) || isNaN(item.price_per_unit))) {
        toast({ title: 'Please enter valid numbers for quantity and price.', variant: 'destructive'});
        return;
    }

    const newOrder: any = {
        owner_id: ownerId,
        supplier_id: selectedSupplier,
        supplier_name: suppliers.find(s => s.id === selectedSupplier)?.name || '',
        items: finalPoItems,
        total_amount: poTotalAmount,
        status: 'Pending',
        order_date: new Date().toISOString(),
    };

    try {
        const { error } = await supabase.from('procurement_orders').insert(newOrder);
        if (error) throw error;
        toast({ title: 'Purchase Order Created!' });
        setSelectedSupplier('');
        setPoItems([]);
        fetchData(); // Refresh history
    } catch(error) {
        console.error(error);
        toast({ title: 'Failed to create PO', variant: 'destructive' });
    }
  };

  const comboboxItems = useMemo(() => {
    return items.map(item => ({ value: item.id, label: item.name }));
  }, [items]);

  return (
    <div className="flex flex-col gap-6">
      <SupplierDialog
        isOpen={isSupplierDialogOpen}
        setIsOpen={setIsSupplierDialogOpen}
        supplier={editingSupplier}
        onSave={handleSaveSupplier}
      />
      <ItemDialog
        isOpen={isItemDialogOpen}
        setIsOpen={setIsItemDialogOpen}
        item={editingItem}
        onSave={handleSaveItem}
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Procurement</h1>
      </div>

      <Tabs defaultValue="create-po">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create-po">Create Purchase Order</TabsTrigger>
          <TabsTrigger value="history">Purchase History</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </TabsList>
        <TabsContent value="create-po" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>New Purchase Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger id="supplier">
                      <SelectValue placeholder="Select a supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <Label>Items</Label>
                {poItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-end p-2 border rounded-md">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Item</Label>
                        <Combobox
                          items={items.map(i => ({ value: i.id, label: i.name }))}
                          value={item.itemId}
                          onChange={(value) => updatePoItem(index, 'itemId', value)}
                          placeholder="Select Item"
                          searchPlaceholder="Search items..."
                          noItemsMessage="No items found."
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Quantity</Label>
                        <Input type="number" placeholder="Qty" value={item.quantity} onChange={e => updatePoItem(index, 'quantity', e.target.value)}/>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Unit</Label>
                        <Input disabled value={item.unit} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Price per Unit</Label>
                        <Input type="number" placeholder="Price" value={item.pricePerUnit} onChange={e => updatePoItem(index, 'pricePerUnit', e.target.value)}/>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removePoItem(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addPoItem}><PlusCircle className="mr-2 h-4 w-4" /> Add Item</Button>
              </div>

            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <div className="text-xl font-bold">Total: Rs. {poTotalAmount.toFixed(2)}</div>
              <Button size="lg" onClick={handleCreatePO}>Create Purchase Order</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Purchase History</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-48 w-full" /> : 
                <Table>
                  <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Supplier</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {orders.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center h-24">No orders found.</TableCell></TableRow> :
                    orders.map(order => (
                      <TableRow key={order.id}>
                        <TableCell>{format(new Date(order.order_date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{order.supplier_name}</TableCell>
                        <TableCell>{order.status}</TableCell>
                        <TableCell className="text-right font-mono">Rs. {order.total_amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="manage" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Suppliers</CardTitle>
                <Button size="sm" onClick={() => { setEditingSupplier(null); setIsSupplierDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4"/>Add</Button>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-32 w-full" /> :
                  <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {suppliers.map(s => (
                        <TableRow key={s.id}>
                          <TableCell>{s.name}</TableCell><TableCell>{s.phone}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => { setEditingSupplier(s); setIsSupplierDialogOpen(true); }}><Edit className="h-4 w-4"/></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                }
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Items</CardTitle>
                <Button size="sm" onClick={() => { setEditingItem(null); setIsItemDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4"/>Add</Button>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-32 w-full" /> :
                  <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Unit</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {items.map(i => (
                        <TableRow key={i.id}>
                          <TableCell>{i.name}</TableCell><TableCell>{i.unit}</TableCell>
                          <TableCell className="text-right">
                             <Button variant="ghost" size="icon" onClick={() => { setEditingItem(i); setIsItemDialogOpen(true); }}><Edit className="h-4 w-4"/></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                }
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
