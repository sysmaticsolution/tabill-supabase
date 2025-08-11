
// Updated data types for Supabase PostgreSQL

export type MenuItemVariant = {
  id: string;
  menu_item_id: string;
  name: string; // e.g., "Half", "Full", "Bucket"
  cost_price: number;
  selling_price: number;
  created_at: string;
};

export type MenuItem = {
  id: string;
  name: string;
  category: string;
  part_number?: string;
  variants: MenuItemVariant[];
  chef_id?: string;
  created_at: string;
  updated_at: string;
};

export type Table = {
  id: string;
  name: string;
  location: string;
  status: 'available' | 'occupied' | 'billing';
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  // Populated via joins
  menu_item?: MenuItem;
  variant?: MenuItemVariant;
};

export type Order = {
  id: string;
  order_number: string;
  table_id: string | null;
  order_type: 'dine-in' | 'takeaway';
  items: OrderItem[];
  subtotal: number;
  sgst_rate: number;
  cgst_rate: number;
  sgst_amount: number;
  cgst_amount: number;
  total: number;
  payment_status: 'Paid' | 'Unpaid';
  payment_method?: 'Cash' | 'Card / UPI' | 'Razorpay';
  staff_id?: string;
  staff_name: string;
  order_date: string;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  created_at: string;
};

export type AppUser = {
    id: string;
    uid: string;
    email: string | null;
    name: string;
    mobile_number: string;
    restaurant_name: string;
    restaurant_address: string;
    profile_complete: boolean;
    has_completed_onboarding: boolean;
    subscription_status: 'trial' | 'active' | 'expired' | 'cancelled' | 'lifetime';
    subscription_plan: 'LITE' | 'PRO';
    trial_ends_at?: string | null;
    subscribed_at?: string | null;
    subscription_ends_at?: string | null;
    created_at: string;
    updated_at: string;
};

export type StaffMember = {
    id: string;
    owner_id: string; // ID of the AppUser who owns this staff member
    name: string;
    email: string;
    role: 'Manager' | 'Waitstaff' | 'Kitchen Staff' | 'Procurement' | 'Inventory' | string;
    modules: string[];
    created_at: string;
    updated_at: string;
};

export type InventoryItem = {
    id: string;
    owner_id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    reorder_level: number;
    last_updated: string;
    created_at: string;
};

export type Supplier = {
    id: string;
    owner_id: string;
    name: string;
    contact_person?: string;
    phone: string;
    address?: string;
    created_at: string;
};

export type ProcurementItem = {
    id: string;
    owner_id: string;
    name: string;
    unit: string;
    created_at: string;
};

export type ProcurementOrder = {
    id: string;
    owner_id: string;
    supplier_id: string;
    supplier_name: string;
    items: {
        item_id: string;
        item_name: string;
        quantity: number;
        unit: string;
        price_per_unit: number;
    }[];
    total_amount: number;
    status: 'Pending' | 'Ordered' | 'Received' | 'Cancelled';
    order_date: string;
    received_date?: string | null;
    created_at: string;
};

export type KitchenRequest = {
    id: string;
    owner_id: string;
    items: {
        inventory_item_id: string;
        item_name: string;
        quantity: number;
        unit: string;
    }[];
    status: 'Pending' | 'Fulfilled' | 'Partially Fulfilled' | 'Cancelled';
    request_date: string;
    fulfilled_date?: string | null;
    requesting_staff_id: string;
    requesting_staff_name: string;
    created_at: string;
};

export type ProductionLog = {
    id: string;
    owner_id: string;
    chef_id: string;
    chef_name: string;
    menu_item_id: string;
    menu_item_name: string;
    variant_name: string;
    quantity_produced: number;
    production_date: string;
    cost_of_production: number;
    created_at: string;
};

export type ExpenseCategory = 
    | 'Rent' 
    | 'Utilities' 
    | 'Salaries' 
    | 'Supplies' 
    | 'Equipment' 
    | 'Marketing' 
    | 'Maintenance' 
    | 'Other';

export interface Expense {
    id?: string;
    owner_id: string;
    category: ExpenseCategory;
    amount: number;
    description?: string;
    date: string; // ISO date string
    created_at?: string;
    updated_at?: string;
}

export type BranchStatus = 'Active' | 'Inactive' | 'Suspended';

export interface Branch {
    id?: string;
    owner_id: string;
    name: string;
    address?: string;
    contact_number?: string;
    email?: string;
    status: BranchStatus;
    created_at?: string;
    updated_at?: string;
    
    // Optional computed fields from branch details function
    total_staff?: number;
    total_tables?: number;
    total_revenue?: number;
}

// Legacy types for backward compatibility during migration
export type LegacyOrderItem = {
  menuItem: MenuItem;
  variant: MenuItemVariant;
  quantity: number;
};

export type LegacyOrder = {
  id: string;
  tableId: string;
  orderType?: 'dine-in' | 'takeaway';
  items: LegacyOrderItem[];
  subtotal: number;
  sgstRate: number;
  cgstRate: number;
  sgstAmount: number;
  cgstAmount: number;
  total: number;
  date: string;
  paymentStatus: 'Paid' | 'Unpaid';
  paymentMethod?: 'Cash' | 'Card / UPI';
  paymentDetails?: any;
  staffId?: string;
  staffName?: string;
};
export const menuItems: Omit<MenuItem, 'id' | 'created_at' | 'updated_at' | 'variants'>[] = [
  {
    name: 'Chicken Biryani',
    category: 'Main Course (Non-Veg)',
    part_number: 'MNV001',
    variants: [], // Will be populated separately
  },
  {
    name: 'Masala Dosa',
    category: 'Main Course (Veg)',
    part_number: 'MVG001',
    variants: [],
  },
  {
    name: 'Mutton Curry',
    category: 'Main Course (Non-Veg)',
    part_number: 'MNV002',
    variants: [],
  },
  {
    name: 'Gulab Jamun',
    category: 'Dessert',
    part_number: 'DST001',
    variants: [],
  },
  {
    name: 'Gobi Manchurian',
    category: 'Appetizer',
    part_number: 'APZ001',
    variants: [],
  },
  {
    name: 'Filter Coffee',
    category: 'Beverage',
    part_number: 'BEV001',
    variants: [],
  },
  {
    name: 'Fish Fry',
    category: 'Appetizer',
    part_number: 'APZ002',
    variants: [],
  },
  {
    name: 'Paneer Butter Masala',
    category: 'Main Course (Veg)',
    part_number: 'MVG002',
    variants: [],
  },
];

export const categories: Omit<Category, 'id' | 'created_at'>[] = [
    { name: 'Main Course (Non-Veg)' },
    { name: 'Main Course (Veg)' },
    { name: 'Appetizer' },
    { name: 'Dessert' },
    { name: 'Beverage' },
];


export const tables: Omit<Table, 'id' | 'created_at'>[] = [
  { name: 'Table 1', location: 'Ground Floor', status: 'available' },
  { name: 'Table 2', location: 'Ground Floor', status: 'available' },
  { name: 'Table 3', location: 'Ground Floor', status: 'available' },
  { name: 'Table 4', location: 'Ground Floor', status: 'available' },
  { name: 'Table 5', location: 'First Floor', status: 'available' },
  { name: 'Table 6', location: 'First Floor', status: 'available' },
  { name: 'Table 7', location: 'First Floor', status: 'available' },
  { name: 'Table 8', location: 'Rooftop', status: 'available' },
  { name: 'Table 9', location: 'Rooftop', status: 'available' },
  { name: 'Table 10', location: 'Rooftop', status: 'available' },
];
