
'use client';

import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Edit, Search } from 'lucide-react';
import { MenuItem, MenuItemVariant, Category, StaffMember } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const getPriceRange = (variants: MenuItemVariant[]) => {
  if (!variants || variants.length === 0) return 'Rs. 0.00';
  if (variants.length === 1) return `Rs. ${variants[0].sellingPrice.toFixed(2)}` as any;

  const prices = variants.map(v => (v as any).sellingPrice ?? (v as any).selling_price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return `Rs. ${min.toFixed(2)} - ${max.toFixed(2)}`;
}

const getCost = (variants: MenuItemVariant[]) => {
  if (!variants || variants.length === 0) return 'N/A';
  const cost = (variants[0] as any).costPrice ?? (variants[0] as any).cost_price ?? 0;
  return `Rs. ${Number(cost).toFixed(2)}`;
}

export default function MenuPage() {
  const { user, appUser } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([] as any);
  const [allCategories, setAllCategories] = useState<Category[]>([] as any);
  const [staff, setStaff] = useState<StaffMember[]>([] as any);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null as any);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null as any);

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null as any);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null as any);
  
  const [searchTerm, setSearchTerm] = useState('');

  const isProTier = (appUser as any)?.subscription_plan === 'PRO';

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [miRes, mvRes, catRes, stRes] = await Promise.all([
        supabase.from('menu_items').select('id, name, category, part_number, chef_id'),
        supabase.from('menu_item_variants').select('id, menu_item_id, name, cost_price, selling_price'),
        supabase.from('categories').select('id, name'),
        supabase.from('staff_members').select('id, name, email, role, modules, owner_id').eq('owner_id', (appUser as any)?.id ?? ''),
      ]);

      const mi = miRes.data || []; if (miRes.error) console.error('menu_items error:', miRes.error);
      const mv = mvRes.data || []; if (mvRes.error) console.error('menu_item_variants error:', mvRes.error);
      const cats = catRes.data || []; if (catRes.error) console.error('categories error:', catRes.error);
      const staffRows = stRes.data || []; if (stRes.error) console.warn('staff_members error (non-blocking):', stRes.error);

      const variantsByMenuId = new Map<string, any[]>();
      (mv || []).forEach((v: any) => {
        const list = variantsByMenuId.get(v.menu_item_id) || [];
        list.push({ name: v.name, costPrice: Number(v.cost_price || 0), sellingPrice: Number(v.selling_price), id: v.id });
        variantsByMenuId.set(v.menu_item_id, list);
      });

      const items = (mi || []).map((m: any) => ({ id: m.id, name: m.name, category: m.category, partNumber: m.part_number || '', chefId: m.chef_id || '', variants: variantsByMenuId.get(m.id) || [] })) as any;
      setMenuItems(items);
      setAllCategories((cats || []) as any);
      setStaff((staffRows || []) as any);
    } catch (error) {
      console.error('Error fetching data: ', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) { fetchData(); } }, [toast, user]);

  // Menu Item Handlers
  const openEditItemDialog = (item: MenuItem) => { setEditingItem(item); setIsItemDialogOpen(true); };
  const openNewItemDialog = () => { setEditingItem(null); setIsItemDialogOpen(true); };

  const handleSaveMenuItem = async (itemData: Omit<MenuItem, 'id'>) => {
    try {
      if (editingItem) {
        // Update item
        const { error: upErr } = await supabase
          .from('menu_items')
          .update({ name: (itemData as any).name, category: (itemData as any).category, part_number: (itemData as any).partNumber || '', chef_id: (itemData as any).chefId || null })
          .eq('id', (editingItem as any).id);
        if (upErr) throw upErr;
        // Replace variants
        await supabase.from('menu_item_variants').delete().eq('menu_item_id', (editingItem as any).id);
        const variantsPayload = (itemData as any).variants.map((v: any) => ({ menu_item_id: (editingItem as any).id, name: v.name, cost_price: Number(v.costPrice || 0), selling_price: Number(v.sellingPrice) }));
        if (variantsPayload.length > 0) {
          const { error: vErr } = await supabase.from('menu_item_variants').insert(variantsPayload);
          if (vErr) throw vErr;
        }
        toast({ title: 'Success', description: 'Menu item updated successfully.' });
      } else {
        // Create item
        const { data: inserted, error: insErr } = await supabase
          .from('menu_items')
          .insert({ name: (itemData as any).name, category: (itemData as any).category, part_number: (itemData as any).partNumber || '', chef_id: (itemData as any).chefId || null })
          .select('id')
          .single();
        if (insErr) throw insErr;
        const itemId = inserted!.id;
        const variantsPayload = (itemData as any).variants.map((v: any) => ({ menu_item_id: itemId, name: v.name, cost_price: Number(v.costPrice || 0), selling_price: Number(v.sellingPrice) }));
        if (variantsPayload.length > 0) {
          const { error: vErr } = await supabase.from('menu_item_variants').insert(variantsPayload);
          if (vErr) throw vErr;
        }
        toast({ title: 'Success', description: 'Menu item added successfully.' });
      }
      setIsItemDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving menu item: ', error);
      toast({ title: 'Error', description: 'Failed to save menu item.', variant: 'destructive' });
    }
  };

  const handleDeleteMenuItem = async () => {
    if (!deletingItem) return;
    try {
      await supabase.from('menu_item_variants').delete().eq('menu_item_id', (deletingItem as any).id);
      const { error } = await supabase.from('menu_items').delete().eq('id', (deletingItem as any).id);
      if (error) throw error;
      toast({ title: 'Success', description: `Item "${(deletingItem as any).name}" deleted.` });
      setDeletingItem(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting item: ', error);
      toast({ title: 'Error', description: 'Failed to delete item.', variant: 'destructive' });
    }
  };
  
  // Category Handlers
  const openNewCategoryDialog = () => { setEditingCategory(null); setIsCategoryDialogOpen(true); };
  const openEditCategoryDialog = (category: Category) => { setEditingCategory(category); setIsCategoryDialogOpen(true); };

  const handleSaveCategory = async (categoryName: string, originalCategory: Category | null) => {
    if (categoryName.trim() === '') { toast({ title: 'Validation Error', description: 'Category name cannot be empty.', variant: 'destructive' }); return; }
    try {
      if (originalCategory) {
        // Update name
        const { error: catErr } = await supabase.from('categories').update({ name: categoryName.trim() }).eq('id', (originalCategory as any).id);
        if (catErr) throw catErr;
        // Update items referencing old name
        const { error: miErr } = await supabase.from('menu_items').update({ category: categoryName.trim() }).eq('category', (originalCategory as any).name);
        if (miErr) throw miErr;
        toast({ title: 'Success', description: 'Category updated successfully.' });
      } else {
        const { error: insErr } = await supabase.from('categories').insert({ name: categoryName.trim() });
        if (insErr) throw insErr;
        toast({ title: 'Success', description: 'Category added successfully.' });
      }
      setIsCategoryDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving category: ', error);
      toast({ title: 'Error', description: 'Failed to save category.', variant: 'destructive' });
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    const itemsInCategory = menuItems.filter((item: any) => item.category === (deletingCategory as any).name).length;
    if(itemsInCategory > 0) {
      toast({ title: 'Action Blocked', description: `Cannot delete category "${(deletingCategory as any).name}" because it contains ${itemsInCategory} menu item(s). Please move or delete them first.`, variant: 'destructive' });
      setDeletingCategory(null);
      return;
    }
    try {
      const { error } = await supabase.from('categories').delete().eq('id', (deletingCategory as any).id);
      if (error) throw error;
      toast({ title: 'Success', description: `Category "${(deletingCategory as any).name}" deleted.` });
      setDeletingCategory(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting category: ', error);
      toast({ title: 'Error', description: 'Failed to delete category.', variant: 'destructive' });
    }
  };


  const filteredCategories = useMemo(() => {
      if (!searchTerm) { return allCategories; }
      const searchLower = searchTerm.toLowerCase();
      const categoriesWithMatchingItems = new Set<string>();
      (menuItems as any[]).forEach((item: any) => {
          if (item.name.toLowerCase().includes(searchLower) || (item.partNumber && item.partNumber.toLowerCase().includes(searchLower))) {
              categoriesWithMatchingItems.add(item.category);
          }
      });
      return (allCategories as any[]).filter((cat: any) => cat.name.toLowerCase().includes(searchLower) || categoriesWithMatchingItems.has(cat.name));
  }, [allCategories, menuItems, searchTerm]);
  
  const getItemsForCategory = (categoryName: string) => { return (menuItems as any[]).filter((item: any) => item.category === categoryName) as any; };
  
  const kitchenStaff = useMemo(() => (staff as any[]).filter((s: any) => (s.role || '').toLowerCase() === 'kitchen staff'.toLowerCase()), [staff]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Menu & Categories</h1>
        <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={openNewCategoryDialog} className="flex-1 sm:flex-initial" variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Category
            </Button>
            <Button onClick={openNewItemDialog} className="flex-1 sm:flex-initial">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
            </Button>
        </div>
      </div>
      
      <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search categories or menu items..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>

      <ItemDialog 
        isOpen={isItemDialogOpen} 
        setIsOpen={setIsItemDialogOpen}
        item={editingItem as any}
        categories={allCategories as any}
        kitchenStaff={kitchenStaff as any}
        onSave={handleSaveMenuItem}
        isProTier={isProTier}
      />

      <CategoryDialog
        isOpen={isCategoryDialogOpen}
        setIsOpen={setIsCategoryDialogOpen}
        category={editingCategory as any}
        onSave={handleSaveCategory}
      />
      
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete Menu Item?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete "{(deletingItem as any)?.name}". This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteMenuItem}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the category "{(deletingCategory as any)?.name}". This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteCategory}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {loading ? (
        <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader></Card>
            ))}
        </div>
      ) : filteredCategories.length > 0 ? (
        <Accordion type="multiple" className="w-full space-y-4" defaultValue={(filteredCategories as any).map((c: any) => c.id)}>
            {(filteredCategories as any).map((category: any) => {
                const itemsInCategory = getItemsForCategory(category.name);
                return (
                    <AccordionItem value={category.id} key={category.id} className="border-b-0">
                        <Card className="overflow-hidden">
                            <div className="flex items-center justify-between p-4 bg-muted/50">
                                <AccordionTrigger className="p-0 flex-1 hover:no-underline">
                                    <div className="flex items-center gap-4">
                                        <h2 className="font-headline text-xl">{category.name}</h2>
                                        <span className="text-sm text-muted-foreground font-normal">
                                            ({itemsInCategory.length} items)
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <div className="flex gap-2 ml-4">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCategoryDialog(category)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingCategory(category)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <AccordionContent className="p-4 md:p-6">
                                {itemsInCategory.length > 0 ? (
                                    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {itemsInCategory.map((item: any) => (
                                            <Card key={item.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
                                                <CardHeader>
                                                    <CardTitle className="flex items-start justify-between">
                                                    <span className="font-headline text-primary text-2xl leading-snug">{item.name}</span>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="flex-grow">
                                                    <div className="text-sm text-muted-foreground">
                                                    Cost: <span className="font-semibold text-foreground">{getCost(item.variants as any)}</span>
                                                    </div>
                                                </CardContent>
                                                <CardFooter className="flex justify-between items-center bg-muted/50 p-4">
                                                    <div className="text-xl font-bold text-primary">
                                                    {getPriceRange(item.variants as any)}
                                                    </div>
                                                    <div className="flex gap-2">
                                                    <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => openEditItemDialog(item)}>
                                                        <Edit className="h-5 w-5" />
                                                    </Button>
                                                    <Button variant="destructive" size="icon" className="h-10 w-10" onClick={() => setDeletingItem(item)}>
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                    </div>
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground p-8 flex flex-col items-center gap-4">
                                        <p>No menu items in this category yet.</p>
                                        <Button variant="outline" onClick={openNewItemDialog}>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Add New Item
                                        </Button>
                                    </div>
                                )}
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                )
            })}
        </Accordion>
      ) : (
         <div className="p-6 text-center text-muted-foreground border rounded-lg">
             {searchTerm ? 'No categories or items match your search.' : 'No categories found. Add one to get started!'}
         </div>
      )}
    </div>
  );
}

// Local type for managing form state with potentially empty strings for numbers
type EditableMenuItemVariant = {
  name: string;
  costPrice: number | string;
  sellingPrice: number | string;
};


function ItemDialog({ isOpen, setIsOpen, item, categories, kitchenStaff, onSave, isProTier }: { 
  isOpen: boolean, 
  setIsOpen: (open: boolean) => void, 
  item: any, 
  categories: any[],
  kitchenStaff: any[],
  onSave: (data: Omit<MenuItem, 'id'>) => void,
  isProTier: boolean,
}) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [chefId, setChefId] = useState('');
  const [variants, setVariants] = useState<EditableMenuItemVariant[]>([]);

  React.useEffect(() => {
    if (isOpen) {
        if (item) {
          setName(item.name);
          setCategory(item.category);
          setPartNumber(item.partNumber || '');
          setChefId(item.chefId || '');
          setVariants(item.variants);
        } else {
          setName('');
          setCategory('');
          setPartNumber('');
          setChefId('');
          setVariants([{ name: 'Regular', costPrice: '', sellingPrice: '' }]);
        }
    }
  }, [item, isOpen]);

  const handleVariantChange = (index: number, field: keyof EditableMenuItemVariant, value: string) => {
    const newVariants = [...variants];
    (newVariants[index] as any)[field] = value;
    setVariants(newVariants);
  };

  const addVariant = () => { setVariants([...variants, { name: '', costPrice: '', sellingPrice: '' }]); }
  const removeVariant = (index: number) => { setVariants(variants.filter((_, i) => i !== index)); }

  const handleSave = () => {
    if (!name.trim()) { toast({ title: 'Validation Error', description: 'Item name is required.', variant: 'destructive' }); return; }
    if (!category) { toast({ title: 'Validation Error', description: 'Please select a category.', variant: 'destructive' }); return; }
    const finalVariants: any[] = [];
    for (const v of variants) {
        const costPrice = parseFloat(v.costPrice as string);
        const sellingPrice = parseFloat(v.sellingPrice as string);
        if (!v.name.trim() || isNaN(sellingPrice) || sellingPrice <= 0) {
            toast({ title: 'Validation Error', description: 'All variants must have a name and a price greater than zero.', variant: 'destructive' });
            return;
        }
        finalVariants.push({ name: v.name.trim(), costPrice: isNaN(costPrice) ? 0 : costPrice, sellingPrice });
    }
    const finalChefId = chefId === 'unassigned' ? '' : chefId;
    onSave({ name, category, partNumber, chefId: finalChefId, variants: finalVariants } as any);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">{item ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
          <DialogDescription>
            {item ? 'Update the details for this item.' : "Enter the details for the new item."} Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chicken Biryani" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category"><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                      {categories.map(cat => (<SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>))}
                  </SelectContent>
              </Select>
            </div>
            {isProTier && (
            <div className="space-y-2">
              <Label htmlFor="chefId">Assigned Chef (Optional)</Label>
              <Select value={chefId} onValueChange={setChefId}>
                  <SelectTrigger id="chefId"><SelectValue placeholder="Assign a chef" /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="unassigned">None</SelectItem>
                      {kitchenStaff.map(staff => (<SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>))}
                  </SelectContent>
              </Select>
            </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="partNumber">Part Number (Optional)</Label>
            <Input id="partNumber" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} placeholder="e.g. NVC001" />
          </div>
          <div className="space-y-4">
            <Label>Variants</Label>
            {variants.map((variant, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 border rounded-md">
                <div className="col-span-11 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                     <div>
                       <Label htmlFor={`v-name-${index}`} className="text-xs">Size</Label>
                       <Input id={`v-name-${index}`} value={variant.name} onChange={(e) => handleVariantChange(index, 'name', e.target.value)} placeholder="e.g. Half"/>
                     </div>
                     <div>
                       <Label htmlFor={`v-cost-${index}`} className="text-xs">Cost</Label>
                       <Input id={`v-cost-${index}`} type="number" value={variant.costPrice} onChange={(e) => handleVariantChange(index, 'costPrice', e.target.value)} placeholder="e.g. 80"/>
                     </div>
                     <div>
                       <Label htmlFor={`v-price-${index}`} className="text-xs">Price</Label>
                       <Input id={`v-price-${index}`} type="number" value={variant.sellingPrice} onChange={(e) => handleVariantChange(index, 'sellingPrice', e.target.value)} placeholder="e.g. 150"/>
                     </div>
                  </div>
                </div>
                 <div className="col-span-1">
                   <Button variant="ghost" size="icon" onClick={() => removeVariant(index)} disabled={variants.length <= 1}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                 </div>
              </div>
            ))}
             <Button variant="outline" size="sm" onClick={addVariant}><PlusCircle className="mr-2 h-4 w-4" /> Add Variant</Button>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CategoryDialog({ isOpen, setIsOpen, category, onSave }: {
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    category: Category | null,
    onSave: (name: string, originalCategory: Category | null) => void
}) {
    const [name, setName] = useState('');

    useEffect(() => { if(isOpen) { setName((category as any)?.name || ''); } }, [category, isOpen]);
    
    const handleSave = () => { onSave(name, category as any); }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="font-headline">{category ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                    <DialogDescription>
                        {category ? 'Update the name for this category.' : 'Enter the name for the new category.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cat-name" className="text-right">Name</Label>
                        <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="e.g. Appetizers" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>Save Category</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
