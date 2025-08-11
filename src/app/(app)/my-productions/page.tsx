
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import { MenuItem, ProductionLog } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ChefHat } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function costFor(itemName: string, variantName: string) {
  const map: Record<string, number> = {
    'Chicken Biryani:Half': 140,
    'Chicken Biryani:Full': 220,
    'Mutton Biryani:Half': 200,
    'Mutton Biryani:Full': 300,
    'Butter Chicken:Regular': 180,
    'Chicken 65:Regular': 150,
    'Masala Soda:Regular': 30,
  };
  const key = `${itemName}:${variantName || 'Regular'}`;
  return map[key] ?? 120;
}

type ProductionFormState = {
  [key: string]: {
    quantity: number | string;
  };
};

export default function MyProductionsPage() {
  const { user, appUser, staffMember } = useAuth();
  const ownerId = (staffMember as any)?.owner_id || (appUser as any)?.id || null;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [assignedItems, setAssignedItems] = useState<MenuItem[]>([]);
  const [productionHistory, setProductionHistory] = useState<ProductionLog[]>([]);
  const [productionState, setProductionState] = useState<ProductionFormState>({});

  const staffId = user?.id || null;

  const fetchData = async () => {
    if (!staffId || !ownerId) return;
    setLoading(true);
    try {
      // Assigned items: for demo, fetch all items of owner; in real app, filter by chef assignment
      const itemsRes = await supabase
        .from('menu_items')
        .select('id, name')
        .eq('owner_id', ownerId)
        .order('name');
      if (itemsRes.error) throw itemsRes.error;
      const items = (itemsRes.data as any[]) || [];

      // Fetch variants per item
      const itemIds = items.map((i) => i.id);
      const variantsRes = await supabase
        .from('menu_item_variants')
        .select('id, menu_item_id, name')
        .in('menu_item_id', itemIds);
      if (variantsRes.error) throw variantsRes.error;

      const variantByItem = new Map<string, any[]>();
      for (const v of (variantsRes.data as any[]) || []) {
        const arr = variantByItem.get(v.menu_item_id) || [];
        arr.push(v);
        variantByItem.set(v.menu_item_id, arr);
      }

      const merged: MenuItem[] = items.map((i) => ({
        id: i.id,
        name: i.name,
        category: '',
        variants: (variantByItem.get(i.id) || []).map((v) => ({ id: v.id, menu_item_id: i.id, name: v.name, cost_price: 0, selling_price: 0, created_at: '' })),
        created_at: '',
        updated_at: '',
      }));
      setAssignedItems(merged.sort((a, b) => a.name.localeCompare(b.name)));

      // Today's production logs
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const logsRes = await supabase
        .from('production_logs')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('chef_id', staffId)
        .gte('production_date', today.toISOString())
        .order('production_date', { ascending: false });
      if (logsRes.error) throw logsRes.error;
      setProductionHistory((logsRes.data as any) || []);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error fetching data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (staffId && ownerId) {
      fetchData();
    }
  }, [staffId, ownerId]);
  
  const handleProductionChange = (menuItemId: string, variantName: string, quantity: string) => {
    const key = `${menuItemId}-${variantName}`;
    setProductionState((prev) => ({
      ...prev,
      [key]: { quantity },
    }));
  };

  const handleLogProduction = async (menuItem: MenuItem, variant: MenuItem['variants'][0]) => {
    if (!staffId || !ownerId) return;

    const key = `${menuItem.id}-${variant.name}`;
    const quantityStr = productionState[key]?.quantity;
    const quantity = parseFloat(quantityStr as string);

    if (isNaN(quantity) || quantity <= 0) {
      toast({ title: 'Invalid Quantity', description: 'Please enter a positive number.', variant: 'destructive' });
      return;
    }

    const newLog: any = {
      owner_id: ownerId,
      chef_id: staffId,
      chef_name: (user as any)?.user_metadata?.full_name || 'Unknown Chef',
      menu_item_id: menuItem.id,
      menu_item_name: menuItem.name,
      variant_name: variant.name,
      quantity_produced: quantity,
      production_date: new Date().toISOString(),
      cost_of_production: quantity * costFor(menuItem.name, variant.name),
    };

    try {
      const { error } = await supabase.from('production_logs').insert(newLog);
      if (error) throw error;
      toast({ title: 'Production Logged!', description: `Logged ${quantity} plates of ${menuItem.name} (${variant.name})` });
      // Clear input after logging
      handleProductionChange(menuItem.id, variant.name, '');
      fetchData();
    } catch (error) {
      console.error('Error logging production:', error);
      toast({ title: 'Failed to log production', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold font-headline flex items-center gap-2">
          <ChefHat className="h-8 w-8 text-primary" />
          My Production Log
        </h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Log Today's Production</CardTitle>
            <CardDescription>
              Enter the number of plates/portions you have prepared for each item assigned to you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading && <Skeleton className="h-40 w-full" />}
            {!loading && assignedItems.length === 0 && (
              <p className="text-center text-muted-foreground py-8">You have not been assigned any menu items yet.</p>
            )}
            {assignedItems.map((item) => (
              <div key={item.id} className="space-y-3 p-4 border rounded-lg">
                <h3 className="font-semibold">{item.name}</h3>
                <div className="space-y-2">
                  {item.variants.map((variant) => {
                    const key = `${item.id}-${variant.name}`;
                    return (
                      <div key={variant.name} className="flex items-center gap-4">
                        <Label htmlFor={key} className="flex-1">
                          {variant.name} <span className="text-xs text-muted-foreground">(Cost: Rs. {costFor(item.name, variant.name).toFixed(2)})</span>
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id={key}
                            type="number"
                            className="w-24 h-9"
                            placeholder="e.g. 50"
                            value={productionState[key]?.quantity || ''}
                            onChange={(e) => handleProductionChange(item.id, variant.name, e.target.value)}
                          />
                          <Button size="sm" onClick={() => handleLogProduction(item, variant)}>
                            Log
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Production History</CardTitle>
            <CardDescription>Items you have logged so far today.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productionHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        No production logged today.
                      </TableCell>
                    </TableRow>
                  ) : (
                    productionHistory.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">{format(new Date(log.production_date), 'hh:mm a')}</TableCell>
                        <TableCell>
                          <div className="font-medium">{log.menu_item_name}</div>
                          <div className="text-xs text-muted-foreground">{log.variant_name}</div>
                        </TableCell>
                        <TableCell className="text-right font-mono">{log.quantity_produced}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
