-- Tabill: Complete database schema, RLS policies, helper functions, and indexes
-- Safe to run multiple times (uses IF NOT EXISTS and DROP ... IF EXISTS where needed)

-- 0) Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Enums (create only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('Owner','Manager','Waitstaff','Kitchen Staff','Procurement','Inventory');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'branch_status') THEN
    CREATE TYPE branch_status AS ENUM ('Active','Inactive','Suspended');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_category') THEN
    CREATE TYPE expense_category AS ENUM ('Rent','Utilities','Salaries','Supplies','Equipment','Marketing','Maintenance','Other');
  END IF;
END$$;

-- 2) Core tables

-- 2.1 Users (restaurant owners)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  uid uuid UNIQUE NOT NULL,          -- Supabase Auth user.id
  email text UNIQUE NOT NULL,
  name text DEFAULT '',
  mobile_number text DEFAULT '',
  restaurant_name text DEFAULT '',
  restaurant_address text DEFAULT '',
  profile_complete boolean DEFAULT false,
  subscription_status text DEFAULT 'trial',     -- 'trial' | 'active' | 'expired' | 'cancelled' | 'lifetime'
  subscription_plan text DEFAULT 'PRO',         -- 'LITE' | 'PRO'
  trial_ends_at timestamptz,
  subscription_ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2.2 Branches
CREATE TABLE IF NOT EXISTS public.branches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  contact_number text,
  email text,
  status branch_status DEFAULT 'Active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2.3 Staff members (email optional, username + auth_uid for staff login)
CREATE TABLE IF NOT EXISTS public.staff_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  name text NOT NULL,
  username text UNIQUE,             -- e.g. 'priya'
  email text,                       -- may be 'username@tabill.com'
  role user_role NOT NULL DEFAULT 'Waitstaff',
  modules text[] DEFAULT '{}',      -- allowed modules
  auth_uid uuid UNIQUE,             -- Supabase Auth user.id for staff
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2.4 Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2.5 Menu items
CREATE TABLE IF NOT EXISTS public.menu_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  base_price numeric(10,2) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2.6 Menu item variants (duplicating owner/branch for simpler RLS)
CREATE TABLE IF NOT EXISTS public.menu_item_variants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price_modifier numeric(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2.7 Restaurant tables
CREATE TABLE IF NOT EXISTS public.tables (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  name text NOT NULL,
  capacity integer NOT NULL,
  status text DEFAULT 'Available',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2.8 Pending orders (cart)
CREATE TABLE IF NOT EXISTS public.pending_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  table_id uuid REFERENCES public.tables(id) ON DELETE SET NULL,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text DEFAULT 'Active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2.9 Pending order items (duplicate owner/branch for simpler RLS)
CREATE TABLE IF NOT EXISTS public.pending_order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  pending_order_id uuid NOT NULL REFERENCES public.pending_orders(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  menu_item_variant_id uuid REFERENCES public.menu_item_variants(id) ON DELETE SET NULL,
  quantity integer NOT NULL,
  total_price numeric(10,2) NOT NULL,
  special_instructions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2.10 Orders (completed)
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  table_id uuid REFERENCES public.tables(id) ON DELETE SET NULL,
  total_amount numeric(10,2) NOT NULL,
  tax_amount numeric(10,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  payment_method text,
  status text DEFAULT 'Completed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2.11 Order items (duplicate owner/branch for simpler RLS)
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  menu_item_variant_id uuid REFERENCES public.menu_item_variants(id) ON DELETE SET NULL,
  quantity integer NOT NULL,
  total_price numeric(10,2) NOT NULL,
  special_instructions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2.12 Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  category expense_category NOT NULL,
  amount numeric(10,2) NOT NULL,
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2.13 Inventory
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  name text NOT NULL,
  quantity numeric(10,2) NOT NULL,
  unit text NOT NULL,
  low_stock_threshold numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2.14 Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  name text NOT NULL,
  contact_name text,
  contact_number text,
  email text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2.15 Procurement items (line items, ad‑hoc)
CREATE TABLE IF NOT EXISTS public.procurement_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  quantity numeric(10,2) NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  status text DEFAULT 'Pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2.16 Procurement orders (PO header)
CREATE TABLE IF NOT EXISTS public.procurement_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  total_amount numeric(10,2) NOT NULL,
  status text DEFAULT 'Pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2.17 Procurement order items (PO lines)
CREATE TABLE IF NOT EXISTS public.procurement_order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  procurement_order_id uuid REFERENCES public.procurement_orders(id) ON DELETE CASCADE,
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  quantity numeric(10,2) NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2.18 Kitchen requests
CREATE TABLE IF NOT EXISTS public.kitchen_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  status text DEFAULT 'Pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2.19 Kitchen request items
CREATE TABLE IF NOT EXISTS public.kitchen_request_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  kitchen_request_id uuid NOT NULL REFERENCES public.kitchen_requests(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  quantity numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2.20 Production logs
CREATE TABLE IF NOT EXISTS public.production_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE SET NULL,
  quantity integer NOT NULL,
  production_date date NOT NULL DEFAULT CURRENT_DATE,
  chef_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2.x Ensure required columns exist for legacy databases
DO $$
BEGIN
  -- Add missing owner_id columns (legacy tables may lack these)
  ALTER TABLE public.menu_item_variants      ADD COLUMN IF NOT EXISTS owner_id uuid;
  ALTER TABLE public.pending_order_items     ADD COLUMN IF NOT EXISTS owner_id uuid;
  ALTER TABLE public.order_items             ADD COLUMN IF NOT EXISTS owner_id uuid;
  ALTER TABLE public.procurement_order_items ADD COLUMN IF NOT EXISTS owner_id uuid;
  ALTER TABLE public.kitchen_request_items   ADD COLUMN IF NOT EXISTS owner_id uuid;

  -- Add missing branch_id columns
  ALTER TABLE public.menu_item_variants      ADD COLUMN IF NOT EXISTS branch_id uuid;
  ALTER TABLE public.pending_order_items     ADD COLUMN IF NOT EXISTS branch_id uuid;
  ALTER TABLE public.order_items             ADD COLUMN IF NOT EXISTS branch_id uuid;
  ALTER TABLE public.procurement_items       ADD COLUMN IF NOT EXISTS branch_id uuid;
  ALTER TABLE public.procurement_orders      ADD COLUMN IF NOT EXISTS branch_id uuid;
  ALTER TABLE public.procurement_order_items ADD COLUMN IF NOT EXISTS branch_id uuid;
  ALTER TABLE public.kitchen_requests        ADD COLUMN IF NOT EXISTS branch_id uuid;
  ALTER TABLE public.kitchen_request_items   ADD COLUMN IF NOT EXISTS branch_id uuid;
  ALTER TABLE public.production_logs         ADD COLUMN IF NOT EXISTS branch_id uuid;
END $$;

-- Add foreign keys for newly added columns (no-op if already present)
DO $$
BEGIN
  -- menu_item_variants FKs
  BEGIN
    ALTER TABLE public.menu_item_variants
      ADD CONSTRAINT menu_item_variants_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TABLE public.menu_item_variants
      ADD CONSTRAINT menu_item_variants_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- pending_order_items FKs
  BEGIN
    ALTER TABLE public.pending_order_items
      ADD CONSTRAINT pending_order_items_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TABLE public.pending_order_items
      ADD CONSTRAINT pending_order_items_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- order_items FKs
  BEGIN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- procurement_order_items FKs
  BEGIN
    ALTER TABLE public.procurement_order_items
      ADD CONSTRAINT procurement_order_items_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TABLE public.procurement_order_items
      ADD CONSTRAINT procurement_order_items_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- kitchen_request_items FKs
  BEGIN
    ALTER TABLE public.kitchen_request_items
      ADD CONSTRAINT kitchen_request_items_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TABLE public.kitchen_request_items
      ADD CONSTRAINT kitchen_request_items_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- 2.y Expand compatibility: ensure owner_id/branch_id exist on all policy-scoped tables
DO $$
BEGIN
  -- Add owner_id if missing
  ALTER TABLE public.categories               ADD COLUMN IF NOT EXISTS owner_id uuid;
  ALTER TABLE public.menu_items               ADD COLUMN IF NOT EXISTS owner_id uuid;
  ALTER TABLE public.tables                   ADD COLUMN IF NOT EXISTS owner_id uuid;
  ALTER TABLE public.pending_orders           ADD COLUMN IF NOT EXISTS owner_id uuid;
  ALTER TABLE public.orders                   ADD COLUMN IF NOT EXISTS owner_id uuid;
  ALTER TABLE public.expenses                 ADD COLUMN IF NOT EXISTS owner_id uuid;
  ALTER TABLE public.inventory_items          ADD COLUMN IF NOT EXISTS owner_id uuid;
  ALTER TABLE public.suppliers                ADD COLUMN IF NOT EXISTS owner_id uuid;
  ALTER TABLE public.procurement_items        ADD COLUMN IF NOT EXISTS owner_id uuid;
  ALTER TABLE public.procurement_orders       ADD COLUMN IF NOT EXISTS owner_id uuid;
  ALTER TABLE public.procurement_order_items  ADD COLUMN IF NOT EXISTS owner_id uuid;
  ALTER TABLE public.kitchen_requests         ADD COLUMN IF NOT EXISTS owner_id uuid;
  ALTER TABLE public.kitchen_request_items    ADD COLUMN IF NOT EXISTS owner_id uuid;
  ALTER TABLE public.production_logs          ADD COLUMN IF NOT EXISTS owner_id uuid;

  -- Add branch_id if missing
  ALTER TABLE public.categories               ADD COLUMN IF NOT EXISTS branch_id uuid;
  ALTER TABLE public.menu_items               ADD COLUMN IF NOT EXISTS branch_id uuid;
  ALTER TABLE public.tables                   ADD COLUMN IF NOT EXISTS branch_id uuid;
  ALTER TABLE public.pending_orders           ADD COLUMN IF NOT EXISTS branch_id uuid;
  ALTER TABLE public.orders                   ADD COLUMN IF NOT EXISTS branch_id uuid;
  ALTER TABLE public.expenses                 ADD COLUMN IF NOT EXISTS branch_id uuid;
  ALTER TABLE public.inventory_items          ADD COLUMN IF NOT EXISTS branch_id uuid;
  ALTER TABLE public.suppliers                ADD COLUMN IF NOT EXISTS branch_id uuid;
  ALTER TABLE public.procurement_items        ADD COLUMN IF NOT EXISTS branch_id uuid;
  ALTER TABLE public.procurement_orders       ADD COLUMN IF NOT EXISTS branch_id uuid;
  ALTER TABLE public.procurement_order_items  ADD COLUMN IF NOT EXISTS branch_id uuid;
  ALTER TABLE public.kitchen_requests         ADD COLUMN IF NOT EXISTS branch_id uuid;
  ALTER TABLE public.kitchen_request_items    ADD COLUMN IF NOT EXISTS branch_id uuid;
  ALTER TABLE public.production_logs          ADD COLUMN IF NOT EXISTS branch_id uuid;
END $$;

-- Add foreign keys for the above, safely (ignore if already exists)
DO $$
BEGIN
  -- Helper pattern per table
  -- categories
  BEGIN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- menu_items
  BEGIN
    ALTER TABLE public.menu_items
      ADD CONSTRAINT menu_items_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TABLE public.menu_items
      ADD CONSTRAINT menu_items_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- tables
  BEGIN
    ALTER TABLE public.tables
      ADD CONSTRAINT tables_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TABLE public.tables
      ADD CONSTRAINT tables_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- pending_orders
  BEGIN
    ALTER TABLE public.pending_orders
      ADD CONSTRAINT pending_orders_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TABLE public.pending_orders
      ADD CONSTRAINT pending_orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- orders
  BEGIN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- expenses
  BEGIN
    ALTER TABLE public.expenses
      ADD CONSTRAINT expenses_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TABLE public.expenses
      ADD CONSTRAINT expenses_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- inventory_items
  BEGIN
    ALTER TABLE public.inventory_items
      ADD CONSTRAINT inventory_items_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TABLE public.inventory_items
      ADD CONSTRAINT inventory_items_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- suppliers
  BEGIN
    ALTER TABLE public.suppliers
      ADD CONSTRAINT suppliers_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TABLE public.suppliers
      ADD CONSTRAINT suppliers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- procurement_items
  BEGIN
    ALTER TABLE public.procurement_items
      ADD CONSTRAINT procurement_items_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TABLE public.procurement_items
      ADD CONSTRAINT procurement_items_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- procurement_orders
  BEGIN
    ALTER TABLE public.procurement_orders
      ADD CONSTRAINT procurement_orders_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TABLE public.procurement_orders
      ADD CONSTRAINT procurement_orders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- procurement_order_items
  BEGIN
    ALTER TABLE public.procurement_order_items
      ADD CONSTRAINT procurement_order_items_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TABLE public.procurement_order_items
      ADD CONSTRAINT procurement_order_items_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- kitchen_requests
  BEGIN
    ALTER TABLE public.kitchen_requests
      ADD CONSTRAINT kitchen_requests_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TABLE public.kitchen_requests
      ADD CONSTRAINT kitchen_requests_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- kitchen_request_items
  BEGIN
    ALTER TABLE public.kitchen_request_items
      ADD CONSTRAINT kitchen_request_items_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TABLE public.kitchen_request_items
      ADD CONSTRAINT kitchen_request_items_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- production_logs
  BEGIN
    ALTER TABLE public.production_logs
      ADD CONSTRAINT production_logs_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER TABLE public.production_logs
      ADD CONSTRAINT production_logs_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Ensure menu_items.category_id exists for legacy databases
DO $$
BEGIN
  ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS category_id uuid;
END $$;

-- Add FK for menu_items.category_id safely
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.menu_items
      ADD CONSTRAINT menu_items_category_id_fkey FOREIGN KEY (category_id)
      REFERENCES public.categories(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- 6.4 Branch limits (paid add-on)
-- Add fields on users to control branch limits
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS base_branch_limit integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS extra_branches integer NOT NULL DEFAULT 0;

-- Helper to compute max branches (base + extras)
CREATE OR REPLACE FUNCTION public.get_owner_max_branches(p_owner_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(u.base_branch_limit,1) + COALESCE(u.extra_branches,0)
  FROM public.users u
  WHERE u.id = p_owner_id;
$$;

-- Trigger to enforce branch limit on insert
CREATE OR REPLACE FUNCTION public.enforce_branch_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count integer;
  max_allowed integer;
BEGIN
  SELECT COUNT(*) INTO current_count FROM public.branches WHERE owner_id = NEW.owner_id;
  SELECT public.get_owner_max_branches(NEW.owner_id) INTO max_allowed;

  IF current_count >= COALESCE(max_allowed, 1) THEN
    RAISE EXCEPTION 'Branch limit reached. Upgrade plan or purchase additional branches.' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_enforce_branch_limit'
  ) THEN
    CREATE TRIGGER trg_enforce_branch_limit
    BEFORE INSERT ON public.branches
    FOR EACH ROW EXECUTE FUNCTION public.enforce_branch_limit();
  END IF;
END $$;

-- 3) RLS: enable on all tables
ALTER TABLE public.users                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_variants         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_requests           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_request_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_logs            ENABLE ROW LEVEL SECURITY;

-- 4) Helper functions for RLS (SECURITY DEFINER, stable, safe search path)
CREATE OR REPLACE FUNCTION public.current_user_is_owner(target_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = target_owner_id
      AND u.uid::text = auth.uid()::text
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_staff_of_owner(target_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_members s
    WHERE s.owner_id = target_owner_id
      AND s.auth_uid::text = auth.uid()::text
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_owner_or_staff(target_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_is_owner(target_owner_id)
      OR public.current_user_is_staff_of_owner(target_owner_id);
$$;

CREATE OR REPLACE FUNCTION public.current_user_can_access_branch(target_branch_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.branches b
    JOIN public.users u ON u.id = b.owner_id
    WHERE b.id = target_branch_id
      AND u.uid::text = auth.uid()::text
  )
  OR EXISTS (
    SELECT 1
    FROM public.branches b
    JOIN public.staff_members s ON s.owner_id = b.owner_id
    WHERE b.id = target_branch_id
      AND s.auth_uid::text = auth.uid()::text
  );
$$;

-- 5) Policies
-- 5.1 Users (each owner manages own row)
DROP POLICY IF EXISTS users_manage_own ON public.users;
CREATE POLICY users_manage_own
ON public.users
FOR ALL
USING (uid::text = auth.uid()::text)
WITH CHECK (uid::text = auth.uid()::text);

-- 5.2 Branches
DROP POLICY IF EXISTS branches_select ON public.branches;
CREATE POLICY branches_select
ON public.branches
FOR SELECT
USING (public.current_user_is_owner_or_staff(owner_id));

DROP POLICY IF EXISTS branches_write ON public.branches;
CREATE POLICY branches_write
ON public.branches
FOR ALL
USING (public.current_user_is_owner(owner_id))
WITH CHECK (public.current_user_is_owner(owner_id));

-- 5.3 Generic policy template for owner/branch tables
-- Apply to: staff_members, categories, menu_items, menu_item_variants, tables, pending_orders,
-- pending_order_items, orders, order_items, expenses, inventory_items, suppliers,
-- procurement_items, procurement_orders, procurement_order_items, kitchen_requests,
-- kitchen_request_items, production_logs

-- Helper macro-like comments (manually repeat for each table)
-- Using + With Check: owner or staff of owner, and if branch set, must be accessible

-- staff_members
DROP POLICY IF EXISTS staff_members_access ON public.staff_members;
CREATE POLICY staff_members_access
ON public.staff_members
FOR ALL
  USING (
  public.current_user_is_owner_or_staff(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
)
WITH CHECK (
  public.current_user_is_owner(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
);

-- categories
DROP POLICY IF EXISTS categories_access ON public.categories;
CREATE POLICY categories_access
ON public.categories
FOR ALL
  USING (
  public.current_user_is_owner_or_staff(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
)
WITH CHECK (
  public.current_user_is_owner(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
);

-- menu_items
DROP POLICY IF EXISTS menu_items_access ON public.menu_items;
CREATE POLICY menu_items_access
ON public.menu_items
FOR ALL
USING (
  public.current_user_is_owner_or_staff(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
)
WITH CHECK (
  public.current_user_is_owner(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
);

-- menu_item_variants
DROP POLICY IF EXISTS menu_item_variants_access ON public.menu_item_variants;
CREATE POLICY menu_item_variants_access
ON public.menu_item_variants
FOR ALL
USING (
  public.current_user_is_owner_or_staff(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
)
WITH CHECK (
  public.current_user_is_owner(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
);

-- tables
DROP POLICY IF EXISTS tables_access ON public.tables;
CREATE POLICY tables_access
ON public.tables
FOR ALL
USING (
  public.current_user_is_owner_or_staff(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
)
WITH CHECK (
  public.current_user_is_owner(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
);

-- pending_orders
DROP POLICY IF EXISTS pending_orders_access ON public.pending_orders;
CREATE POLICY pending_orders_access
ON public.pending_orders
FOR ALL
USING (
  public.current_user_is_owner_or_staff(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
)
WITH CHECK (
  public.current_user_is_owner(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
);

-- pending_order_items
DROP POLICY IF EXISTS pending_order_items_access ON public.pending_order_items;
CREATE POLICY pending_order_items_access
ON public.pending_order_items
FOR ALL
  USING (
  public.current_user_is_owner_or_staff(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
)
WITH CHECK (
  public.current_user_is_owner(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
);

-- orders
DROP POLICY IF EXISTS orders_access ON public.orders;
CREATE POLICY orders_access
ON public.orders
FOR ALL
  USING (
  public.current_user_is_owner_or_staff(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
)
WITH CHECK (
  public.current_user_is_owner(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
);

-- order_items
DROP POLICY IF EXISTS order_items_access ON public.order_items;
CREATE POLICY order_items_access
ON public.order_items
FOR ALL
  USING (
  public.current_user_is_owner_or_staff(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
)
WITH CHECK (
  public.current_user_is_owner(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
);

-- expenses
DROP POLICY IF EXISTS expenses_access ON public.expenses;
CREATE POLICY expenses_access
ON public.expenses
FOR ALL
  USING (
  public.current_user_is_owner_or_staff(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
)
WITH CHECK (
  public.current_user_is_owner(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
);

-- inventory_items
DROP POLICY IF EXISTS inventory_items_access ON public.inventory_items;
CREATE POLICY inventory_items_access
ON public.inventory_items
FOR ALL
  USING (
  public.current_user_is_owner_or_staff(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
)
WITH CHECK (
  public.current_user_is_owner(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
);

-- suppliers
DROP POLICY IF EXISTS suppliers_access ON public.suppliers;
CREATE POLICY suppliers_access
ON public.suppliers
FOR ALL
  USING (
  public.current_user_is_owner_or_staff(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
)
WITH CHECK (
  public.current_user_is_owner(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
);

-- procurement_items
DROP POLICY IF EXISTS procurement_items_access ON public.procurement_items;
CREATE POLICY procurement_items_access
ON public.procurement_items
FOR ALL
  USING (
  public.current_user_is_owner_or_staff(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
)
WITH CHECK (
  public.current_user_is_owner(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
);

-- procurement_orders
DROP POLICY IF EXISTS procurement_orders_access ON public.procurement_orders;
CREATE POLICY procurement_orders_access
ON public.procurement_orders
FOR ALL
  USING (
  public.current_user_is_owner_or_staff(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
)
WITH CHECK (
  public.current_user_is_owner(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
);

-- procurement_order_items
DROP POLICY IF EXISTS procurement_order_items_access ON public.procurement_order_items;
CREATE POLICY procurement_order_items_access
ON public.procurement_order_items
FOR ALL
  USING (
  public.current_user_is_owner_or_staff(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
)
WITH CHECK (
  public.current_user_is_owner(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
);

-- kitchen_requests
DROP POLICY IF EXISTS kitchen_requests_access ON public.kitchen_requests;
CREATE POLICY kitchen_requests_access
ON public.kitchen_requests
FOR ALL
  USING (
  public.current_user_is_owner_or_staff(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
)
WITH CHECK (
  public.current_user_is_owner(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
);

-- kitchen_request_items
DROP POLICY IF EXISTS kitchen_request_items_access ON public.kitchen_request_items;
CREATE POLICY kitchen_request_items_access
ON public.kitchen_request_items
FOR ALL
  USING (
  public.current_user_is_owner_or_staff(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
)
WITH CHECK (
  public.current_user_is_owner(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
);

-- production_logs
DROP POLICY IF EXISTS production_logs_access ON public.production_logs;
CREATE POLICY production_logs_access
ON public.production_logs
FOR ALL
  USING (
  public.current_user_is_owner_or_staff(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
)
WITH CHECK (
  public.current_user_is_owner(owner_id)
  AND (branch_id IS NULL OR public.current_user_can_access_branch(branch_id))
);

-- 6) Utility functions from chat

-- 6.1 Total expenses in date range
CREATE OR REPLACE FUNCTION public.get_total_expenses(p_owner_id uuid, p_start_date date, p_end_date date)
RETURNS numeric(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_expenses numeric(10,2);
BEGIN
  SELECT COALESCE(SUM(amount),0) INTO total_expenses
  FROM public.expenses
  WHERE owner_id = p_owner_id
    AND date BETWEEN p_start_date AND p_end_date;

  RETURN total_expenses;
END;
$$;

-- 6.2 Count branches for an owner
CREATE OR REPLACE FUNCTION public.get_owner_branches_count(p_owner_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE branch_count integer;
BEGIN
  SELECT COUNT(*) INTO branch_count
  FROM public.branches
  WHERE owner_id = p_owner_id;

  RETURN branch_count;
END;
$$;

-- 6.3 Branch details rollup
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_branch_details'
      AND oidvectortypes(p.proargtypes) = 'uuid'
  ) THEN
    DROP FUNCTION public.get_branch_details(uuid);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_branch_details(p_branch_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  address text,
  contact_number text,
  email text,
  status branch_status,
  total_staff bigint,
  total_tables integer,
  total_revenue numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.name,
    b.address,
    b.contact_number,
    b.email,
    b.status,
    (SELECT COUNT(*) FROM public.staff_members WHERE branch_id = b.id) AS total_staff,
    (SELECT COUNT(*) FROM public.tables WHERE branch_id = b.id) AS total_tables,
    COALESCE((SELECT SUM(total_amount) FROM public.orders WHERE branch_id = b.id), 0) AS total_revenue
  FROM public.branches b
  WHERE b.id = p_branch_id;
END;
$$;

-- 7) Indexes
CREATE INDEX IF NOT EXISTS idx_users_uid                 ON public.users(uid);
CREATE INDEX IF NOT EXISTS idx_branches_owner_id         ON public.branches(owner_id);

CREATE INDEX IF NOT EXISTS idx_staff_members_owner_id    ON public.staff_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_branch_id   ON public.staff_members(branch_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_auth_uid    ON public.staff_members(auth_uid);

CREATE INDEX IF NOT EXISTS idx_categories_owner_id       ON public.categories(owner_id);
CREATE INDEX IF NOT EXISTS idx_categories_branch_id      ON public.categories(branch_id);

CREATE INDEX IF NOT EXISTS idx_menu_items_owner_id       ON public.menu_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_branch_id      ON public.menu_items(branch_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id    ON public.menu_items(category_id);

CREATE INDEX IF NOT EXISTS idx_menu_item_variants_owner  ON public.menu_item_variants(owner_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_variants_branch ON public.menu_item_variants(branch_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_variants_item   ON public.menu_item_variants(menu_item_id);

CREATE INDEX IF NOT EXISTS idx_tables_owner_id           ON public.tables(owner_id);
CREATE INDEX IF NOT EXISTS idx_tables_branch_id          ON public.tables(branch_id);

CREATE INDEX IF NOT EXISTS idx_pending_orders_owner_id   ON public.pending_orders(owner_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_branch_id  ON public.pending_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_table_id   ON public.pending_orders(table_id);

CREATE INDEX IF NOT EXISTS idx_pending_order_items_owner ON public.pending_order_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_pending_order_items_po_id ON public.pending_order_items(pending_order_id);

CREATE INDEX IF NOT EXISTS idx_orders_owner_id           ON public.orders(owner_id);
CREATE INDEX IF NOT EXISTS idx_orders_branch_id          ON public.orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_table_id           ON public.orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at         ON public.orders(created_at);

CREATE INDEX IF NOT EXISTS idx_order_items_owner_id      ON public.order_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id      ON public.order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_expenses_owner_id         ON public.expenses(owner_id);
CREATE INDEX IF NOT EXISTS idx_expenses_branch_id        ON public.expenses(branch_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date             ON public.expenses(date);

CREATE INDEX IF NOT EXISTS idx_inventory_owner_id        ON public.inventory_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_inventory_branch_id       ON public.inventory_items(branch_id);

CREATE INDEX IF NOT EXISTS idx_suppliers_owner_id        ON public.suppliers(owner_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_branch_id       ON public.suppliers(branch_id);

CREATE INDEX IF NOT EXISTS idx_proc_items_owner_id       ON public.procurement_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_proc_items_branch_id      ON public.procurement_items(branch_id);

CREATE INDEX IF NOT EXISTS idx_proc_orders_owner_id      ON public.procurement_orders(owner_id);
CREATE INDEX IF NOT EXISTS idx_proc_orders_branch_id     ON public.procurement_orders(branch_id);

CREATE INDEX IF NOT EXISTS idx_proc_order_items_owner_id ON public.procurement_order_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_proc_order_items_po_id    ON public.procurement_order_items(procurement_order_id);

CREATE INDEX IF NOT EXISTS idx_kitchen_requests_owner_id ON public.kitchen_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_requests_branch   ON public.kitchen_requests(branch_id);

CREATE INDEX IF NOT EXISTS idx_kitchen_request_items_kr  ON public.kitchen_request_items(kitchen_request_id);

CREATE INDEX IF NOT EXISTS idx_production_logs_owner_id  ON public.production_logs(owner_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_branch_id ON public.production_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_date      ON public.production_logs(production_date);