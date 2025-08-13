'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Trash2, PlusCircle, ShieldAlert } from 'lucide-react';
import { Expense, ExpenseCategory } from '@/lib/data';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useActiveBranch } from '@/hooks/use-active-branch';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Rent', 
  'Utilities', 
  'Salaries', 
  'Supplies', 
  'Equipment', 
  'Marketing', 
  'Maintenance', 
  'Other'
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const { user, staffMember, appUser } = useAuth();
  const { toast } = useToast();
  const { ownerId, activeBranchId } = useActiveBranch();

  // Date range state
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  // Permissions and owner ID
  const hasPermission = !staffMember || (staffMember.modules && (staffMember as any).modules.includes('expenses'));

  // Fetch expenses
  const fetchExpenses = async (ownerId: string, branchId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('branch_id', branchId)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (error) {
        console.error('Expenses fetch error:', error);
        toast({ 
          title: 'Error', 
          description: 'Failed to fetch expenses.', 
          variant: 'destructive' 
        });
        return;
      }

      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({ 
        title: 'Error', 
        description: 'An unexpected error occurred.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Total expenses calculation
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  // Expenses by category
  const expensesByCategory = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<ExpenseCategory, number>);
  }, [expenses]);

  // Fetch expenses when owner changes or date range updates
  useEffect(() => {
    if (!user || !hasPermission) return;
    if (ownerId && activeBranchId) {
      fetchExpenses(ownerId, activeBranchId);
    } else {
      setLoading(false);
    }
  }, [user, ownerId, activeBranchId, hasPermission, startDate, endDate]);

  // Open new expense dialog
  const openNewDialog = () => {
    if (!activeBranchId) {
      toast({ title: 'No active branch', description: 'Select an active branch before adding expenses.', variant: 'destructive' });
      return;
    }
    setEditingExpense(null);
    setIsFormDialogOpen(true);
  };

  // Open edit expense dialog
  const openEditDialog = (expense: Expense) => {
    if (!activeBranchId) {
      toast({ title: 'No active branch', description: 'Select an active branch before editing expenses.', variant: 'destructive' });
      return;
    }
    setEditingExpense(expense);
    setIsFormDialogOpen(true);
  };

  // Save expense handler
  const handleSaveExpense = async (expenseData: Omit<Expense, 'id' | 'owner_id'>, expenseId?: string) => {
    if (!ownerId || !activeBranchId) {
      toast({ 
        title: 'No active branch', 
        description: 'Select an active branch before saving expenses.', 
        variant: 'destructive'
      });
      return Promise.reject('Authentication Error');
    }

    try {
      if (expenseId) {
        // Update existing expense
        const { error } = await supabase
          .from('expenses')
          .update({ 
            ...expenseData, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', expenseId)
          .eq('owner_id', ownerId)
          .eq('branch_id', activeBranchId);

        if (error) throw error;
        toast({ title: 'Success', description: 'Expense updated.' });
      } else {
        // Create new expense
        const { error } = await supabase
          .from('expenses')
          .insert({ 
            ...expenseData, 
            owner_id: ownerId,
            branch_id: activeBranchId as any,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        toast({ title: 'Success', description: 'Expense added.' });
      }

      setIsFormDialogOpen(false);
      fetchExpenses(ownerId, activeBranchId);
      return Promise.resolve();
    } catch (e) {
      console.error('Error saving expense:', e);
      toast({ 
        title: 'Error', 
        description: 'Failed to save expense.', 
        variant: 'destructive' 
      });
      return Promise.reject(e);
    }
  };

  // Delete expense handler
  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', (expenseToDelete as any).id)
        .eq('owner_id', ownerId as any)
        .eq('branch_id', activeBranchId as any);

      if (error) throw error;
      
      toast({ 
        title: 'Success', 
        description: `Expense "${(expenseToDelete as any).description || 'Unnamed'}" removed.` 
      });
      
      setExpenseToDelete(null);
      if (ownerId && activeBranchId) fetchExpenses(ownerId, activeBranchId);
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to remove expense.', 
        variant: 'destructive' 
      });
    }
  };

  // No permission view
  if (!hasPermission) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto bg-destructive/10 text-destructive p-3 rounded-full w-fit">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <CardTitle className="font-headline text-2xl">Access Denied</CardTitle>
          <CardDescription>You do not have permission to view expenses.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Date Range Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                {startDate ? format(startDate, 'PPP') : <span>Pick start date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => date && setStartDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <span>to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                {endDate ? format(endDate, 'PPP') : <span>Pick end date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => date && setEndDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button onClick={openNewDialog} className="w-full sm:w-auto" disabled={!activeBranchId}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>
      {!activeBranchId && (
        <div className="p-3 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
          Select an active branch to view and manage expenses.
        </div>
      )}

      {/* Expense Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Summary</CardTitle>
          <CardDescription>
            Total Expenses: {formatCurrency(totalExpenses)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {EXPENSE_CATEGORIES.map(category => (
              <div key={category} className="flex flex-col">
                <Badge variant="secondary" className="mb-2 capitalize">{category}</Badge>
                <span className="font-bold">
                  {formatCurrency(expensesByCategory[category] || 0)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expense Form Dialog */}
      <ExpenseFormDialog
        isOpen={isFormDialogOpen}
        setIsOpen={setIsFormDialogOpen}
        expense={editingExpense}
        onSave={handleSaveExpense}
      />

      {/* Expense List */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 inline-block ml-2" />
                      <Skeleton className="h-8 w-8 inline-block ml-2" />
                    </TableCell>
                  </TableRow>
                ))
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No expenses found. Add an expense to get started.
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(new Date(expense.date), 'PP')}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{expense.category}</Badge>
                    </TableCell>
                    <TableCell>{expense.description || 'No description'}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => openEditDialog(expense)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive" 
                        onClick={() => setExpenseToDelete(expense)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Expense Form Dialog Component
function ExpenseFormDialog({ 
  isOpen, 
  setIsOpen, 
  expense, 
  onSave
}: { 
  isOpen: boolean, 
  setIsOpen: (open: boolean) => void, 
  expense: Expense | null, 
  onSave: (data: Omit<Expense, 'id' | 'owner_id'>, expenseId?: string) => Promise<void>
}) {
  const { toast } = useToast();
  const [category, setCategory] = useState<ExpenseCategory>('Other');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [pending, setPending] = useState(false);

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        setCategory(expense.category);
        setAmount(expense.amount.toString());
        setDescription(expense.description || '');
        setDate(new Date(expense.date));
      } else {
        setCategory('Other');
        setAmount('');
        setDescription('');
        setDate(new Date());
      }
    }
  }, [expense, isOpen]);

  const handleSave = () => {
    // Validate inputs
    const parsedAmount = parseFloat(amount);
    
    if (!category) {
      toast({ 
        title: 'Validation Error', 
        description: 'Please select a category.', 
        variant: 'destructive' 
      });
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ 
        title: 'Validation Error', 
        description: `Please enter a valid amount. Current input: ${formatCurrency(parsedAmount)}`, 
        variant: 'destructive' 
      });
      return;
    }

    setPending(true);
    onSave({ 
      category, 
      amount: parsedAmount, 
      description: description.trim() || undefined, 
      date: date.toISOString() 
    } as any, (expense as any)?.id)
      .finally(() => setPending(false));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">
            {expense ? 'Edit Expense' : 'Add Expense'}
          </DialogTitle>
          <DialogDescription>
            {expense ? 'Update the details for this expense.' : 'Enter the details for a new expense.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(val: ExpenseCategory) => setCategory(val)}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input 
              id="amount" 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="Enter expense amount" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Expense description" 
            />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(selectedDate) => selectedDate && setDate(selectedDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)} variant="outline">Cancel</Button>
          <Button onClick={handleSave} disabled={pending}>
            {pending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
