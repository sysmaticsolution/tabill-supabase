'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Trash2, PlusCircle, ShieldAlert, MapPin, Phone, Mail } from 'lucide-react';
import { Branch, BranchStatus } from '@/lib/data';
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
import { format } from 'date-fns';

const BRANCH_STATUSES: BranchStatus[] = ['Active', 'Inactive', 'Suspended'];

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);
  const { user, staffMember, appUser } = useAuth();
  const { toast } = useToast();

  // Permissions and owner ID
  const hasPermission = !staffMember || (staffMember.modules && (staffMember as any).modules.includes('branches'));
  const ownerId = (staffMember as any)?.owner_id || (appUser as any)?.id;

  // Fetch branches
  const fetchBranches = async (ownerId: string) => {
    setLoading(true);
    try {
      console.log('Fetching branches for owner:', ownerId);

      // 1) Fetch branches only (no computed subqueries in select)
      const { data: baseBranches, error: branchesError } = await supabase
        .from('branches')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (branchesError) {
        console.error('Branches fetch error:', {
          message: branchesError.message,
          details: branchesError.details,
          code: branchesError.code,
          hint: branchesError.hint,
        });
        toast({
          title: 'Error Fetching Branches',
          description: branchesError.message || 'An unexpected error occurred while fetching branches.',
          variant: 'destructive',
        });
        setBranches([]);
        return;
      }

      const list = baseBranches || [];

      // 2) Enrich with details using RPC (runs under RLS)
      const detailed = await Promise.all(
        list.map(async (b: any) => {
          try {
            const { data: d, error: dErr } = await supabase.rpc('get_branch_details', { p_branch_id: b.id });
            if (dErr || !d || d.length === 0) {
              if (dErr) console.warn('get_branch_details error:', dErr);
              return {
                ...b,
                total_staff: 0,
                total_tables: 0,
                total_revenue: 0,
              };
            }
            const row = d[0];
            return {
              ...b,
              total_staff: Number(row.total_staff) || 0,
              total_tables: Number(row.total_tables) || 0,
              total_revenue: Number(row.total_revenue) || 0,
            };
          } catch (e) {
            console.warn('get_branch_details exception:', e);
            return {
              ...b,
              total_staff: 0,
              total_tables: 0,
              total_revenue: 0,
            };
          }
        })
      );

      console.log('Branches fetched successfully:', detailed);
      setBranches(detailed as any);
    } catch (error) {
      console.error('Unexpected error in fetchBranches:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while fetching branches.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch branches when owner changes
  useEffect(() => {
    if (!user || !hasPermission || !ownerId) return;
    fetchBranches(ownerId);
  }, [user, ownerId, hasPermission]);

  // Open new branch dialog
  const openNewDialog = () => {
    setEditingBranch(null);
    setIsFormDialogOpen(true);
  };

  // Open edit branch dialog
  const openEditDialog = (branch: Branch) => {
    setEditingBranch(branch);
    setIsFormDialogOpen(true);
  };

  // Save branch handler
  const handleSaveBranch = async (branchData: Omit<Branch, 'id' | 'owner_id'>, branchId?: string) => {
    if (!ownerId) {
      toast({ 
        title: 'Authentication Error', 
        description: 'Could not determine the owner.', 
        variant: 'destructive'
      });
      return Promise.reject('Authentication Error');
    }

    try {
      if (branchId) {
        // Update existing branch
        const { error } = await supabase
          .from('branches')
          .update({ 
            ...branchData, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', branchId);

        if (error) throw error;
        toast({ title: 'Success', description: 'Branch updated.' });
      } else {
        // Create new branch
        const { error } = await supabase
          .from('branches')
          .insert({ 
            ...branchData, 
            owner_id: ownerId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        toast({ title: 'Success', description: 'Branch added.' });
      }

      setIsFormDialogOpen(false);
      fetchBranches(ownerId);
      return Promise.resolve();
    } catch (e) {
      console.error('Error saving branch:', e);
      toast({ 
        title: 'Error', 
        description: 'Failed to save branch.', 
        variant: 'destructive' 
      });
      return Promise.reject(e);
    }
  };

  // Delete branch handler
  const handleDeleteBranch = async () => {
    if (!branchToDelete) return;
    try {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', (branchToDelete as any).id);

      if (error) throw error;
      
      toast({ 
        title: 'Success', 
        description: `Branch "${(branchToDelete as any).name}" removed.` 
      });
      
      setBranchToDelete(null);
      fetchBranches(ownerId);
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to remove branch.', 
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
          <CardDescription>You do not have permission to view branches.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Branch Management</h1>
        <Button onClick={openNewDialog} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Branch
        </Button>
      </div>

      {/* Branch Form Dialog */}
      <BranchFormDialog
        isOpen={isFormDialogOpen}
        setIsOpen={setIsFormDialogOpen}
        branch={editingBranch}
        onSave={handleSaveBranch}
      />

      {/* Branches List */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Branch Stats</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 inline-block ml-2" />
                      <Skeleton className="h-8 w-8 inline-block ml-2" />
                    </TableCell>
                  </TableRow>
                ))
              ) : branches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No branches found. Add a branch to get started.
                  </TableCell>
                </TableRow>
              ) : (
                branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{branch.name}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {branch.address || 'No address'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {branch.contact_number && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {branch.contact_number}
                          </span>
                        )}
                        {branch.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {branch.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          branch.status === 'Active' ? 'default' : 
                          branch.status === 'Inactive' ? 'secondary' : 
                          'destructive'
                        }
                      >
                        {branch.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span>Staff: {branch.total_staff || 0}</span>
                        <span>Tables: {branch.total_tables || 0}</span>
                        <span>Revenue: Rs. {(branch.total_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => openEditDialog(branch)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive" 
                        onClick={() => setBranchToDelete(branch)}
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

// Branch Form Dialog Component
function BranchFormDialog({ 
  isOpen, 
  setIsOpen, 
  branch, 
  onSave
}: { 
  isOpen: boolean, 
  setIsOpen: (open: boolean) => void, 
  branch: Branch | null, 
  onSave: (data: Omit<Branch, 'id' | 'owner_id'>, branchId?: string) => Promise<void>
}) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<BranchStatus>('Active');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (branch) {
        setName(branch.name);
        setAddress(branch.address || '');
        setContactNumber(branch.contact_number || '');
        setEmail(branch.email || '');
        setStatus(branch.status);
      } else {
        setName('');
        setAddress('');
        setContactNumber('');
        setEmail('');
        setStatus('Active');
      }
    }
  }, [branch, isOpen]);

  const handleSave = () => {
    // Validate inputs
    if (!name.trim()) {
      toast({ 
        title: 'Validation Error', 
        description: 'Branch name is required.', 
        variant: 'destructive' 
      });
      return;
    }

    // Optional email validation
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast({ 
        title: 'Validation Error', 
        description: 'Please enter a valid email address.', 
        variant: 'destructive' 
      });
      return;
    }

    setPending(true);
    onSave({ 
      name: name.trim(), 
      address: address.trim() || undefined, 
      contact_number: contactNumber.trim() || undefined, 
      email: email.trim() || undefined, 
      status 
    } as any, (branch as any)?.id)
      .finally(() => setPending(false));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">
            {branch ? 'Edit Branch' : 'Add Branch'}
          </DialogTitle>
          <DialogDescription>
            {branch ? 'Update the details for this branch.' : 'Enter the details for a new branch.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Branch Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g. Downtown Location" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address (Optional)</Label>
            <Input 
              id="address" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
              placeholder="Full branch address" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number (Optional)</Label>
            <Input 
              id="contactNumber" 
              value={contactNumber} 
              onChange={(e) => setContactNumber(e.target.value)} 
              placeholder="Branch contact number" 
              type="tel"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input 
              id="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Branch contact email" 
              type="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Branch Status</Label>
            <Select value={status} onValueChange={(val: BranchStatus) => setStatus(val)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select branch status" />
              </SelectTrigger>
              <SelectContent>
                {BRANCH_STATUSES.map(stat => (
                  <SelectItem key={stat} value={stat}>{stat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
