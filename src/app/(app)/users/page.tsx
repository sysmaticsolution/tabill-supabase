
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Trash2, UserPlus, ShieldAlert } from 'lucide-react';
import { StaffMember } from '@/lib/data';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth-provider';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';

const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

const ROLES = ['Manager', 'Waitstaff', 'Kitchen Staff', 'Procurement', 'Inventory'];
const MODULES = [
    { id: 'tables', label: 'Tables' },
    { id: 'takeaways', label: 'Takeaways' },
    { id: 'billing', label: 'Billing' },
    { id: 'menu', label: 'Menu & Categories' },
    { id: 'my-productions', label: 'My Productions' },
    { id: 'kitchen', label: 'Kitchen Requests' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'procurement', label: 'Procurement' },
    { id: 'reports', label: 'Reports' },
    { id: 'staff-performance', label: 'Staff Performance' },
    { id: 'users', label: 'Staff Management' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'branches', label: 'Branches' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'profile', label: 'Profile' },
];

export default function UsersPage() {
  const [staff, setStaff] = useState<StaffMember[]>([] as any);
  const [loading, setLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [pending, setPending] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const { user, staffMember, appUser } = useAuth();
  
  const { toast } = useToast();

  const hasPermission = !staffMember || (staffMember.modules && (staffMember as any).modules.includes('users'));

  const fetchStaff = async (ownerId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff_members')
        .select('id, owner_id, name, email, role, modules, created_at, updated_at')
        .eq('owner_id', ownerId)
        .order('name', { ascending: true });
      if (error) {
        console.error('staff_members error:', error);
        toast({ title: 'Error', description: 'Failed to fetch staff members.', variant: 'destructive' });
        setStaff([] as any);
        return;
      }
      setStaff((data || []) as any);
    } catch (error) {
      console.error('Error fetching staff: ', error);
      toast({ title: 'Error', description: 'Failed to fetch staff members.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !hasPermission) {
      if (!hasPermission) setLoading(false);
      return;
    }
    const ownerId = (staffMember as any)?.owner_id || (appUser as any)?.id;
    if (!ownerId) return; // wait until profile loads
    fetchStaff(ownerId);
  }, [user, appUser, staffMember, hasPermission]);

  const openNewDialog = () => {
    setEditingStaff(null);
    setIsFormDialogOpen(true);
  }

  const openEditDialog = (staffMember: StaffMember) => {
    setEditingStaff(staffMember);
    setIsFormDialogOpen(true);
  };
  
  const handleSaveStaff = async (staffData: Omit<StaffMember, 'id' | 'ownerId'> & { password?: string }, staffId?: string) => {
     const ownerId = (staffMember as any)?.owner_id || (appUser as any)?.id;
     if(!ownerId) {
       toast({ title: 'Authentication Error', description: 'Could not determine the owner.', variant: 'destructive'});
       return Promise.reject('Authentication Error');
     }
     
     try {
         if(staffId) {
             const { error } = await supabase
               .from('staff_members')
               .update({ name: (staffData as any).name, email: (staffData as any).email, role: (staffData as any).role, modules: (staffData as any).modules })
               .eq('id', staffId);
             if (error) throw error;
             toast({ title: 'Success', description: 'Staff member updated.' });
         } else {
             // Call server route to create auth user and DB row
             const res = await fetch('/api/staff/create', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 ownerId,
                 name: (staffData as any).name,
                 username: (staffData as any).email, // reusing email field as Staff ID/username
                 password: (staffData as any).password,
                 role: (staffData as any).role,
                 modules: (staffData as any).modules,
               }),
             });
             const j = await res.json().catch(() => ({}));
             if (!res.ok) {
              // More detailed error handling
              const errorMessage = j.details 
                ? (Array.isArray(j.details) ? j.details.join(', ') : j.details)
                : (j.error || 'Failed to create staff');
               toast({ 
                 title: 'Error', 
                 description: errorMessage, 
                 variant: 'destructive' 
               });
               throw new Error(errorMessage);
             }
             toast({ title: 'Success', description: 'Staff member added.' });
         }
         setIsFormDialogOpen(false);
         fetchStaff(ownerId);
         return Promise.resolve();
     } catch(e) {
         console.error('Error saving staff member: ', e);
         return Promise.reject(e);
     }
   }

  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    try {
      const { error } = await supabase.from('staff_members').delete().eq('id', (staffToDelete as any).id);
      if (error) throw error;
      toast({ title: 'Success', description: `Staff member "${(staffToDelete as any).name}" removed.` });
      setStaffToDelete(null);
      fetchStaff((staffMember as any)?.owner_id || (appUser as any)?.id);
    } catch (error) {
      console.error('Error deleting staff member: ', error);
      toast({ title: 'Error', description: 'Failed to remove staff member.', variant: 'destructive' });
    }
  };

  if (!hasPermission) {
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
                <div className="mx-auto bg-destructive/10 text-destructive p-3 rounded-full w-fit">
                    <ShieldAlert className="h-8 w-8" />
                </div>
                <CardTitle className="font-headline text-2xl">Access Denied</CardTitle>
                <CardDescription>You do not have permission to view or manage staff.</CardDescription>
            </CardHeader>
        </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Staff Management</h1>
         <Button onClick={openNewDialog} className="w-full sm:w-auto">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Staff
        </Button>
      </div>
      
      <StaffFormDialog
        isOpen={isFormDialogOpen}
        setIsOpen={setIsFormDialogOpen}
        staffMember={editingStaff}
        onSave={handleSaveStaff}
      />
      
      <AlertDialog open={!!staffToDelete} onOpenChange={(open) => !open && setStaffToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently remove "{(staffToDelete as any)?.name}" from your staff.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setStaffToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteStaff}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Staff Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div></div></TableCell>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                            <TableCell><div className="flex gap-1"><Skeleton className="h-5 w-12" /><Skeleton className="h-5 w-12" /></div></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-8 inline-block ml-2" /><Skeleton className="h-8 w-8 inline-block ml-2" /></TableCell>
                        </TableRow>
                    ))
                ) : staff.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            No staff members found. Add one to get started.
                        </TableCell>
                    </TableRow>
                ) : staff.map((member: any) => (
                <TableRow key={member.id}>
                    <TableCell>
                        <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={member.photoURL ?? ''} />
                                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-medium">{member.name}</div>
                                <div className="text-sm text-muted-foreground">{member.email}</div>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="secondary" className="capitalize">{member.role}</Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-wrap gap-1">
                            {(member.modules || []).map((m: string) => <Badge key={m} variant="outline" className="text-xs capitalize">{MODULES.find(mod => mod.id === m)?.label || m}</Badge>)}
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(member)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setStaffToDelete(member)}>
                           <Trash2 className="h-4 w-4" />
                        </Button>
                    </TableCell>
                </TableRow>
                ))}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StaffFormDialog({ 
  isOpen, 
  setIsOpen, 
  staffMember, 
  onSave
}: { 
  isOpen: boolean, 
  setIsOpen: (open: boolean) => void, 
  staffMember: StaffMember | null, 
  onSave: (data: Omit<StaffMember, 'id' | 'ownerId'> & { password?: string }, staffId?: string) => Promise<void>
}) {
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [modules, setModules] = useState<string[]>([]);
    const [pending, setPending] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (staffMember) {
                setName(staffMember.name);
                setEmail((staffMember as any).username || staffMember.email);
                setRole(staffMember.role as any);
                setModules((staffMember as any).modules || []);
                setPassword('');
            } else {
                setName('');
                setEmail('');
                setRole('');
                setModules([]);
                setPassword('');
            }
        }
    }, [staffMember, isOpen]);

    const handleModuleChange = (moduleId: string, checked: boolean | 'indeterminate') => {
        if (checked) { setModules(prev => [...prev, moduleId]); }
        else { setModules(prev => prev.filter(m => m !== moduleId)); }
    }

    const handleSave = () => {
        // Validate username (allow email-like usernames)
        const usernameRegex = /^[a-zA-Z0-9._-]+$/;
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

        // Process username (extract part before @ if email is used)
        const processedUsername = email.includes('@') 
            ? email.split('@')[0] 
            : email.trim();

        if (!name.trim()) {
            toast({ title: 'Validation Error', description: 'Full Name is required.', variant: 'destructive' });
            return;
        }

        if (!email.trim()) {
            toast({ title: 'Validation Error', description: 'Staff ID is required.', variant: 'destructive' });
            return;
        }

        if (!usernameRegex.test(processedUsername)) {
            toast({ 
                title: 'Validation Error', 
                description: 'Staff ID can only contain letters, numbers, dots, underscores, and hyphens.', 
                variant: 'destructive' 
            });
            return;
        }

        if (!role) {
            toast({ title: 'Validation Error', description: 'Role is required.', variant: 'destructive' });
            return;
        }

        // Only validate password for new staff members
        if (!staffMember && (!password || !passwordRegex.test(password))) {
            toast({ 
                title: 'Validation Error', 
                description: 'Password must be at least 8 characters long, contain a letter, a number, and a special character.', 
                variant: 'destructive' 
            });
            return;
        }

        setPending(true);
        onSave({ 
            name, 
            email, // Pass full email/username 
            role: role as any, 
            modules, 
            password 
        } as any, (staffMember as any)?.id)
            .finally(() => setPending(false));
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-headline">{staffMember ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
              <DialogDescription>
                {staffMember ? 'Update the details for this staff member.' : 'Enter the details for the new staff member.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffId">Staff ID</Label>
                <Input id="staffId" type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. sameer or sameer@tabill.com" />
                <p className="text-xs text-muted-foreground">
                  You can use a username (e.g., 'sameer') or a full email (e.g., 'sameer@tabill.com'). 
                  Usernames will automatically become 'username@tabill.com'.
                </p>
              </div>
              {!staffMember && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="e.g. StrongPass@123" />
                  <p className="text-xs text-muted-foreground">
                    This password will be used for all future logins. 
                    Must be at least 8 characters long and contain a letter, a number, and a special character.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                 <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role"><SelectValue placeholder="Select a role" /></SelectTrigger>
                    <SelectContent>
                        {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label>Module Permissions</Label>
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-md">
                    {MODULES.map(module => (
                        <div key={module.id} className="flex items-center space-x-2">
                            <Checkbox id={`module-${module.id}`} checked={modules.includes(module.id)} onCheckedChange={(checked) => handleModuleChange(module.id, checked)} />
                            <label htmlFor={`module-${module.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{module.label}</label>
                        </div>
                    ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsOpen(false)} variant="outline">Cancel</Button>
              <Button onClick={handleSave} disabled={pending}>{pending ? 'Saving...' : 'Save Changes'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    )
}
