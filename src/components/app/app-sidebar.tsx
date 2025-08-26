
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Table, BookOpen, BarChart2, LogOut, User as UserIcon, Gem, Users, Receipt, Activity, Box, ShoppingCart, ChefHat, HelpCircle, ShoppingBag, DollarSign, Building } from 'lucide-react';
import Logo from '@/components/logo';
import { useAuth } from '../auth-provider';
import { useActiveBranch } from '@/hooks/use-active-branch';

type MenuItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  module?: string; // Module ID for permission check
  tier: 'LITE' | 'PRO'; // Plan requirement
};

const menuItems: MenuItem[] = [
  { href: '/tables', label: 'Tables', icon: Table, module: 'tables', tier: 'LITE' },
  { href: '/takeaways', label: 'Takeaways', icon: ShoppingBag, module: 'takeaways', tier: 'LITE' },
  { href: '/billing', label: 'Billing', icon: Receipt, module: 'billing', tier: 'LITE' },
  { href: '/menu', label: 'Menu & Categories', icon: BookOpen, module: 'menu', tier: 'LITE' },
  { href: '/my-productions', label: 'My Productions', icon: ChefHat, module: 'my-productions', tier: 'PRO' },
  { href: '/kitchen', label: 'Kitchen Requests', icon: ChefHat, module: 'kitchen', tier: 'PRO' },
  { href: '/inventory', label: 'Inventory', icon: Box, module: 'inventory', tier: 'PRO' },
  { href: '/procurement', label: 'Procurement', icon: ShoppingCart, module: 'procurement', tier: 'PRO' },
  { href: '/reports', label: 'Reports', icon: BarChart2, module: 'reports', tier: 'LITE' },
  { href: '/staff-performance', label: 'Staff Performance', icon: Activity, module: 'staff-performance', tier: 'LITE' },
  { href: '/users', label: 'Staff Management', icon: Users, module: 'users', tier: 'LITE' },
  { href: '/expenses', label: 'Expenses', icon: DollarSign, module: 'expenses', tier: 'LITE' },
  { href: '/branches', label: 'Branches', icon: Building, module: 'branches', tier: 'LITE' },
  { href: '/guide', label: 'How-to Guide', icon: HelpCircle, module: 'guide', tier: 'LITE' },
  { href: '/subscription', label: 'Subscription', icon: Gem, module: 'subscription', tier: 'LITE' },
  { href: '/profile', label: 'Profile', icon: UserIcon, module: 'profile', tier: 'LITE' },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const { user, appUser, staffMember, signOut } = useAuth();
  const { activeBranchId, loading } = useActiveBranch();
  
  const userPlan = (appUser as any)?.subscription_plan || 'LITE'; // Default to LITE if no plan found

  // Supabase user fields: prefer user_metadata, then app profile, then email
  const displayName = (
    (user?.user_metadata as any)?.name ||
    (appUser as any)?.name ||
    user?.email ||
    'User'
  ) as string;
  const avatarUrl = (
    (user?.user_metadata as any)?.avatar_url ||
    (user?.user_metadata as any)?.picture ||
    ''
  ) as string;

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  const hasPermission = (item: MenuItem) => {
    // Check tier first
    if (item.tier === 'PRO' && userPlan !== 'PRO') {
      return false;
    }

    // If no module is specified, it's a public link for all logged-in users.
    if (!item.module) return true;

    // The guide page should be visible to everyone.
    if (item.module === 'guide') return true;
    
    // If the user is the main owner (not a staff member), they have all permissions.
    if (!staffMember) return true;

    // Otherwise, check if the staff member's modules array includes this one.
    return staffMember.modules?.includes(item.module);
  };

  const branchIndependent = new Set<string>(['/branches', '/profile', '/guide', '/subscription', '/login']);

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/reports" className="flex items-center gap-2" onClick={handleLinkClick}>
            <span className="hidden group-data-[collapsible=icon]:block">
              <Logo showText={false} />
            </span>
            <span className="block group-data-[collapsible=icon]:hidden">
              <Logo />
            </span>
        </Link>
      </SidebarHeader>

      <SidebarMenu className="flex-1">
        {!loading && !activeBranchId && (
          <div className="mx-3 my-2 rounded-md border border-amber-200 bg-amber-50 text-amber-800 p-3 text-sm">
            No active branch selected. Go to <Link href="/branches" className="underline font-medium">Branches</Link> to select one.
          </div>
        )}
        {menuItems.map((item) => {
          if (!hasPermission(item)) return null;
          const requiresBranch = !branchIndependent.has(item.href);
          const disabled = requiresBranch && !activeBranchId && !loading;
          const content = (
            <SidebarMenuButton
              isActive={pathname.startsWith(item.href)}
              tooltip={item.label + (disabled ? ' (select a branch)' : '')}
              className={disabled ? 'pointer-events-none opacity-60' : ''}
            >
              <item.icon />
              <span>{item.label}</span>
            </SidebarMenuButton>
          );
          return (
            <SidebarMenuItem key={item.href}>
              {disabled ? (
                <div>{content}</div>
              ) : (
                <Link href={item.href} onClick={handleLinkClick}>{content}</Link>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>

      <SidebarSeparator />

      <SidebarFooter>
        {user && 
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatarUrl} alt={displayName} data-ai-hint="person portrait" />
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm">{displayName}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} className="ml-auto group-data-[collapsible=icon]:hidden">
              <LogOut className="h-4 w-4" />
          </Button>
        </div>
        }
      </SidebarFooter>
    </Sidebar>
  );
}
