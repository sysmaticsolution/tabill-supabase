import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Create a separate admin client to bypass RLS and create users.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SEED_USER_EMAIL = 'tabil@tabill.com';

const categoriesData = [
    { name: 'Starters' },
    { name: 'Main Course (Veg)' },
    { name: 'Main Course (Non-Veg)' },
    { name: 'Breads' },
    { name: 'Rice & Biryani' },
    { name: 'Desserts' },
    { name: 'Beverages' },
];

const tablesData = [
  { name: 'Family Corner (AC)', capacity: 6, status: 'Available' },
  { name: 'Window Table (AC)', capacity: 4, status: 'Available' },
  { name: 'Couple Table (AC)', capacity: 2, status: 'Available' },
  { name: 'Family Table (AC)', capacity: 6, status: 'Available' },
  { name: 'Regular Table 1 (AC)', capacity: 4, status: 'Available' },
  { name: 'Regular Table 2 (AC)', capacity: 4, status: 'Available' },
  { name: 'Regular Table 3 (Non-AC)', capacity: 4, status: 'Available' },
  { name: 'Large Family (Non-AC)', capacity: 8, status: 'Available' },
  { name: 'Couple Table (Non-AC)', capacity: 2, status: 'Available' },
  { name: 'Group Table (Non-AC)', capacity: 6, status: 'Available' },
];

const menuItemsData = [
  // Starters
  { name: 'Chicken Tikka', category: 'Starters', variants: [{ name: '6 pieces', cost: 140, price: 280 }] },
  { name: 'Tandoori Chicken', category: 'Starters', variants: [{ name: 'Half', cost: 160, price: 320 }, { name: 'Full', cost: 300, price: 600 }] },
  { name: 'Paneer Tikka', category: 'Starters', variants: [{ name: 'Plate', cost: 80, price: 180 }] },
  { name: 'Fish Tikka', category: 'Starters', variants: [{ name: '6 pieces', cost: 180, price: 360 }] },
  { name: 'Chicken 65', category: 'Starters', variants: [{ name: 'Plate', cost: 120, price: 250 }] },
  { name: 'Gobi 65', category: 'Starters', variants: [{ name: 'Plate', cost: 60, price: 140 }] },
  { name: 'Chicken Lollipop', category: 'Starters', variants: [{ name: '6 pieces', cost: 120, price: 250 }] },
  
  // Main Course (Veg)
  { name: 'Palak Paneer', category: 'Main Course (Veg)', variants: [{ name: 'Regular', cost: 90, price: 220 }] },
  { name: 'Paneer Butter Masala', category: 'Main Course (Veg)', variants: [{ name: 'Regular', cost: 100, price: 240 }] },
  { name: 'Veg Kolhapuri', category: 'Main Course (Veg)', variants: [{ name: 'Regular', cost: 85, price: 200 }] },
  { name: 'Veg Korma', category: 'Main Course (Veg)', variants: [{ name: 'Regular', cost: 95, price: 210 }] },
  { name: 'Dal Makhani', category: 'Main Course (Veg)', variants: [{ name: 'Regular', cost: 70, price: 160 }] },
  { name: 'Mix Veg', category: 'Main Course (Veg)', variants: [{ name: 'Regular', cost: 60, price: 140 }] },
  
  // Main Course (Non-Veg)
  { name: 'Butter Chicken', category: 'Main Course (Non-Veg)', variants: [{ name: 'Half', cost: 150, price: 320 }, { name: 'Full', cost: 280, price: 580 }] },
  { name: 'Chicken Tikka Masala', category: 'Main Course (Non-Veg)', variants: [{ name: 'Half', cost: 160, price: 340 }, { name: 'Full', cost: 300, price: 620 }] },
  { name: 'Chicken Curry', category: 'Main Course (Non-Veg)', variants: [{ name: 'Half', cost: 140, price: 300 }, { name: 'Full', cost: 260, price: 540 }] },
  { name: 'Mutton Rogan Josh', category: 'Main Course (Non-Veg)', variants: [{ name: 'Regular', cost: 180, price: 400 }] },
  { name: 'Mutton Curry', category: 'Main Course (Non-Veg)', variants: [{ name: 'Regular', cost: 170, price: 380 }] },
  { name: 'Fish Curry', category: 'Main Course (Non-Veg)', variants: [{ name: 'Regular', cost: 160, price: 360 }] },
  { name: 'Prawn Curry', category: 'Main Course (Non-Veg)', variants: [{ name: 'Regular', cost: 190, price: 420 }] },
  
  // Breads
  { name: 'Tandoori Roti', category: 'Breads', variants: [{ name: 'Piece', cost: 10, price: 25 }] },
  { name: 'Butter Roti', category: 'Breads', variants: [{ name: 'Piece', cost: 12, price: 30 }] },
  { name: 'Plain Naan', category: 'Breads', variants: [{ name: 'Piece', cost: 15, price: 35 }] },
  { name: 'Garlic Naan', category: 'Breads', variants: [{ name: 'Piece', cost: 20, price: 45 }] },
  { name: 'Butter Naan', category: 'Breads', variants: [{ name: 'Piece', cost: 18, price: 40 }] },
  { name: 'Kulcha', category: 'Breads', variants: [{ name: 'Piece', cost: 16, price: 38 }] },
  
  // Rice & Biryani
  { name: 'Jeera Rice', category: 'Rice & Biryani', variants: [{ name: 'Plate', cost: 50, price: 120 }] },
  { name: 'Veg Pulao', category: 'Rice & Biryani', variants: [{ name: 'Plate', cost: 60, price: 140 }] },
  { name: 'Chicken Dum Biryani', category: 'Rice & Biryani', variants: [{ name: 'Half', cost: 130, price: 280 }, { name: 'Full', cost: 240, price: 520 }] },
  { name: 'Mutton Biryani', category: 'Rice & Biryani', variants: [{ name: 'Half', cost: 160, price: 340 }, { name: 'Full', cost: 300, price: 640 }] },
  { name: 'Prawn Biryani', category: 'Rice & Biryani', variants: [{ name: 'Half', cost: 170, price: 360 }, { name: 'Full', cost: 320, price: 680 }] },
  { name: 'Hyderabadi Biryani', category: 'Rice & Biryani', variants: [{ name: 'Half', cost: 150, price: 320 }, { name: 'Full', cost: 280, price: 600 }] },
  
  // Desserts
  { name: 'Gulab Jamun', category: 'Desserts', variants: [{ name: '2 pieces', cost: 25, price: 60 }] },
  { name: 'Rasgulla', category: 'Desserts', variants: [{ name: '2 pieces', cost: 20, price: 50 }] },
  { name: 'Kheer', category: 'Desserts', variants: [{ name: 'Small', cost: 30, price: 70 }, { name: 'Large', cost: 50, price: 110 }] },
  { name: 'Rasmalai', category: 'Desserts', variants: [{ name: '2 pieces', cost: 35, price: 80 }] },
  { name: 'Gajar Halwa', category: 'Desserts', variants: [{ name: 'Small', cost: 40, price: 90 }, { name: 'Large', cost: 60, price: 130 }] },
  
  // Beverages
  { name: 'Fresh Lime Soda', category: 'Beverages', variants: [{ name: 'Glass', cost: 15, price: 40 }] },
  { name: 'Mango Lassi', category: 'Beverages', variants: [{ name: 'Glass', cost: 25, price: 60 }] },
  { name: 'Sweet Lassi', category: 'Beverages', variants: [{ name: 'Glass', cost: 25, price: 60 }] },
  { name: 'Salted Lassi', category: 'Beverages', variants: [{ name: 'Glass', cost: 25, price: 60 }] },
  { name: 'Masala Chai', category: 'Beverages', variants: [{ name: 'Cup', cost: 10, price: 30 }] },
  { name: 'Filter Coffee', category: 'Beverages', variants: [{ name: 'Cup', cost: 12, price: 35 }] },
  { name: 'Cold Drinks', category: 'Beverages', variants: [{ name: 'Coke/Sprite', cost: 20, price: 45 }, { name: 'Fanta', cost: 20, price: 45 }] },
];

async function getOwnerId(email: string): Promise<string | null> {
  // 1. Get user ID from auth.users
  const { data: authList } = await supabaseAdmin.auth.admin.listUsers();
  let userId = authList.users.find(u => u.email === email)?.id;

  if (!userId) {
    console.log(`User ${email} not found in auth. Creating user...`);
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: 'password',
      email_confirm: true,
    });

    if (createError) {
      console.error(`Failed to create user ${email}:`, createError);
      return null;
    }

    userId = newUser.user.id;
    console.log(`Successfully created user: ${email}`);
  }

  // 2. Prefer matching by uid (auth id) using admin client to bypass RLS
  const { data: userByUid } = await supabaseAdmin
    .from('users')
    .select('id,email,uid')
    .eq('uid', userId)
    .single();

  if (userByUid) {
    // Ensure email is synced
    if (userByUid.email !== email) {
      await supabaseAdmin.from('users').update({ email }).eq('id', userByUid.id);
    }
    return userByUid.id;
  }

  // 3. If no uid match, check by email
  const { data: userByEmail } = await supabaseAdmin
    .from('users')
    .select('id,uid')
    .eq('email', email)
    .single();

  if (userByEmail) {
    // If email row exists but uid is different, reconcile
    if (userByEmail.uid && userByEmail.uid !== userId) {
      console.log('Email exists with different uid. Clearing old data and replacing row...');
      await clearAllDataForOwner(userByEmail.id);
      await supabaseAdmin.from('staff_members').delete().eq('owner_id', userByEmail.id);
      const { error: delErr } = await supabaseAdmin.from('users').delete().eq('id', userByEmail.id);
      if (delErr) {
        console.error('Failed to delete conflicting public.users row:', delErr);
        return null;
      }
    } else {
      // Attach uid to existing email row and use its id
      const { error: updErr } = await supabaseAdmin.from('users').update({ uid: userId }).eq('id', userByEmail.id);
      if (updErr) {
        if ((updErr as any).code === '23505') {
          // Unique violation on uid: a row with this uid exists; prefer it and remove the email-only row
          const { data: existingUidRow } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('uid', userId)
            .single();
          if (existingUidRow) {
            await clearAllDataForOwner(userByEmail.id);
            await supabaseAdmin.from('users').delete().eq('id', userByEmail.id);
            return existingUidRow.id as string;
          }
        }
        console.error('Failed to update uid on existing public.users row:', updErr);
        return null;
      }
      return userByEmail.id;
    }
  }

  // 4. Insert fresh row (let id auto-generate), set uid to auth id
  console.log('Inserting user into public.users...');
  const { data: insertedUsers, error: insertError } = await supabaseAdmin
    .from('users')
    .insert({
      uid: userId,
      email: email,
      name: 'Tabil Admin',
      mobile_number: '0000000000',
      restaurant_name: 'Tabill Restaurant',
      restaurant_address: '123 Seed Street',
      profile_complete: true,
      has_completed_onboarding: true,
      subscription_plan: 'PRO',
      subscription_status: 'lifetime',
    })
    .select('id')
    .single();

  if (insertError || !insertedUsers) {
    console.error('Failed to insert user into public.users:', insertError);
    return null;
  }

  console.log('Successfully inserted user into public.users table.');
  return insertedUsers.id as string;
}

async function clearAllDataForOwner(ownerId: string) {
  console.log(`Starting data cleanup for owner_id: ${ownerId}`);

  const tablesToDelete = [
    'order_items',
    'orders',
    'menu_item_variants',
    'menu_items',
    'categories',
    'tables',
    'inventory_items',
    'procurement_orders',
    'procurement_items',
    'kitchen_requests',
    'production_logs',
    'expenses',
    // delete staff before branches to avoid FK errors
    'staff_members',
    'branches',
  ];

  for (const table of tablesToDelete) {
    // The 'orders' table does not have an owner_id column, so we skip it.
    if (table === 'orders' || table === 'order_items') continue;
    
    console.log(`Deleting from ${table}...`);
    const { error } = await supabaseAdmin.from(table).delete().eq('owner_id', ownerId);
    if (error) {
      console.error(`Error deleting from ${table}:`, error.message);
    } else {
      console.log(`Successfully deleted from ${table}.`);
    }
  }

  console.log('Data cleanup finished.');

  // Ensure staff_members is cleared for this owner to prevent FK constraint issues
  console.log('Deleting from staff_members...');
  const { error: staffError } = await supabaseAdmin.from('staff_members').delete().eq('owner_id', ownerId);
  if (staffError) {
    console.error('Error deleting from staff_members:', staffError.message);
  } else {
    console.log('Successfully deleted from staff_members.');
  }
}

async function seedDataForOwner(ownerId: string) {
  // Seed Branch
  const { data: branch, error: branchError } = await supabaseAdmin
    .from('branches')
    .insert({ owner_id: ownerId, name: 'Main Branch', address: '123 Seed Street', status: 'Active' })
    .select()
    .single();
  if (branchError || !branch) return console.error('Error seeding branch:', branchError);
  const branchId = (branch as any).id as string;
  console.log('Seeded 1 branch.');

  // Seed Categories
  const categoriesToInsert = categoriesData.map(c => ({ name: c.name, owner_id: ownerId, branch_id: branchId }));
  const { data: insertedCategories, error: categoriesError } = await supabaseAdmin.from('categories').insert(categoriesToInsert).select();
  if (categoriesError) return console.error('Error seeding categories:', categoriesError);
  console.log(`Seeded ${insertedCategories.length} categories.`);

  // Seed Tables with schema compatibility (legacy may not have capacity). Omit status to avoid check-constraint mismatches.
  let tablesError = null as any;
  {
    const tablesPayloadNew = tablesData.map(t => ({ name: t.name, capacity: t.capacity, owner_id: ownerId, branch_id: branchId }));
    const { error } = await supabaseAdmin.from('tables').insert(tablesPayloadNew);
    tablesError = error;
    if (tablesError && (tablesError.code === 'PGRST204' || `${tablesError.message}`.includes("Could not find the 'capacity'"))) {
      // fallback: omit capacity for legacy schema
      const tablesPayloadLegacy = tablesData.map(t => ({ name: t.name, owner_id: ownerId, branch_id: branchId }));
      const { error: error2 } = await supabaseAdmin.from('tables').insert(tablesPayloadLegacy);
      if (error2) return console.error('Error seeding tables (legacy fallback failed):', error2);
      console.log(`Seeded ${tablesData.length} tables (legacy schema).`);
    } else if (tablesError) {
      return console.error('Error seeding tables:', tablesError);
    } else {
      console.log(`Seeded ${tablesData.length} tables.`);
    }
  }

  // Seed Menu Items and Variants (align with schema: menu_items requires base_price; variants have price_modifier)
  // Track whether legacy menu schema (no base_price, requires category text) is in use
  let legacyMenuSchema: boolean | null = null;
  for (const item of menuItemsData) {
    const category = insertedCategories.find(c => c.name === item.category);
    if (!category) {
      console.warn(`Category '${item.category}' not found for menu item '${item.name}'. Skipping.`);
      continue;
    }

    // Determine base_price from the first variant price
    const basePrice = item.variants[0]?.price ?? 0;
    if (basePrice <= 0) {
      console.warn(`Menu item '${item.name}' has no valid base price. Skipping.`);
      continue;
    }

    // Try insert with new schema first (has base_price)
    let menuItem: any = null;
    let itemError: any = null;
    {
      const res = await supabaseAdmin
        .from('menu_items')
        .insert({ name: item.name, category_id: category.id, base_price: basePrice, owner_id: ownerId, branch_id: branchId })
        .select()
        .single();
      menuItem = res.data;
      itemError = res.error;
    }
    if (itemError && (itemError.code === 'PGRST204' || `${itemError.message}`.includes("Could not find the 'base_price'"))) {
      // legacy schema fallback: no base_price, but may require category text column
      legacyMenuSchema = true;
      const res2 = await supabaseAdmin
        .from('menu_items')
        .insert({ name: item.name, category_id: category.id, owner_id: ownerId, branch_id: branchId, category: (category as any).name })
        .select()
        .single();
      menuItem = res2.data;
      itemError = res2.error;
    } else if (legacyMenuSchema === null) {
      legacyMenuSchema = false;
    }

    if (itemError) {
      console.error(`Error inserting menu item '${item.name}':`, itemError);
      continue;
    }

    // Insert variants compatible with schema
    let variantError: any = null;
    if (!legacyMenuSchema) {
      const variantsToInsert = item.variants.map(v => ({
        menu_item_id: menuItem.id,
        name: v.name,
        price_modifier: Number((v.price - basePrice).toFixed(2)),
        owner_id: ownerId,
        branch_id: branchId,
      }));
      const resV = await supabaseAdmin.from('menu_item_variants').insert(variantsToInsert);
      variantError = resV.error;
      if (variantError && (variantError.code === 'PGRST204' || `${variantError.message}`.includes("Could not find the 'price_modifier'"))) {
        // fallback to legacy cost/selling columns
        const variantsLegacy = item.variants.map(v => ({
          menu_item_id: menuItem.id,
          name: v.name,
          cost_price: v.cost,
          selling_price: v.price,
          owner_id: ownerId,
          branch_id: branchId,
        }));
        const resVL = await supabaseAdmin.from('menu_item_variants').insert(variantsLegacy);
        variantError = resVL.error;
      }
    } else {
      const variantsLegacy = item.variants.map(v => ({
        menu_item_id: menuItem.id,
        name: v.name,
        cost_price: v.cost,
        selling_price: v.price,
        owner_id: ownerId,
        branch_id: branchId,
      }));
      const resVL = await supabaseAdmin.from('menu_item_variants').insert(variantsLegacy);
      variantError = resVL.error;
    }
    if (variantError) {
      console.error(`Error inserting variants for '${item.name}':`, variantError);
    }
  }
  console.log(`Seeded ${menuItemsData.length} menu items with their variants.`);

  // Seed Staff Members
  const staffToInsert = [
    { owner_id: ownerId, branch_id: branchId, name: 'Priya', username: 'priya', email: 'priya@tabill.com', role: 'Manager' },
    { owner_id: ownerId, branch_id: branchId, name: 'Arun', username: 'arun', email: 'arun@tabill.com', role: 'Kitchen Staff' },
  ];
  const { data: staffRows, error: staffErr } = await supabaseAdmin.from('staff_members').insert(staffToInsert).select();
  if (staffErr) return console.error('Error seeding staff_members:', staffErr);
  const chefId = staffRows?.find(s => s.role === 'Kitchen Staff')?.id as string | undefined;
  console.log(`Seeded ${staffRows?.length ?? 0} staff members.`);

  // Seed Expenses
  const expensesToInsert = [
    { owner_id: ownerId, branch_id: branchId, category: 'Rent', amount: 50000, description: 'Monthly rent' },
    { owner_id: ownerId, branch_id: branchId, category: 'Supplies', amount: 8000, description: 'Kitchen supplies' },
  ];
  const { error: expErr } = await supabaseAdmin.from('expenses').insert(expensesToInsert);
  if (expErr) console.error('Error seeding expenses:', expErr);
  else console.log(`Seeded ${expensesToInsert.length} expenses.`);

  // Seed Inventory Items with schema compatibility (legacy may not have low_stock_threshold)
  const inventoryToInsert = [
    { owner_id: ownerId, branch_id: branchId, name: 'Chicken', quantity: 50, unit: 'kg', low_stock_threshold: 10 },
    { owner_id: ownerId, branch_id: branchId, name: 'Mutton', quantity: 30, unit: 'kg', low_stock_threshold: 5 },
    { owner_id: ownerId, branch_id: branchId, name: 'Fish', quantity: 20, unit: 'kg', low_stock_threshold: 5 },
    { owner_id: ownerId, branch_id: branchId, name: 'Prawns', quantity: 15, unit: 'kg', low_stock_threshold: 3 },
    { owner_id: ownerId, branch_id: branchId, name: 'Paneer', quantity: 30, unit: 'kg', low_stock_threshold: 5 },
    { owner_id: ownerId, branch_id: branchId, name: 'Rice', quantity: 100, unit: 'kg', low_stock_threshold: 20 },
    { owner_id: ownerId, branch_id: branchId, name: 'Basmati Rice', quantity: 50, unit: 'kg', low_stock_threshold: 10 },
    { owner_id: ownerId, branch_id: branchId, name: 'Wheat Flour', quantity: 80, unit: 'kg', low_stock_threshold: 15 },
    { owner_id: ownerId, branch_id: branchId, name: 'Garam Masala', quantity: 10, unit: 'kg', low_stock_threshold: 2 },
    { owner_id: ownerId, branch_id: branchId, name: 'Turmeric Powder', quantity: 5, unit: 'kg', low_stock_threshold: 1 },
    { owner_id: ownerId, branch_id: branchId, name: 'Red Chilli Powder', quantity: 8, unit: 'kg', low_stock_threshold: 2 },
    { owner_id: ownerId, branch_id: branchId, name: 'Coriander Powder', quantity: 10, unit: 'kg', low_stock_threshold: 2 },
    { owner_id: ownerId, branch_id: branchId, name: 'Cumin Seeds', quantity: 5, unit: 'kg', low_stock_threshold: 1 },
    { owner_id: ownerId, branch_id: branchId, name: 'Ginger', quantity: 10, unit: 'kg', low_stock_threshold: 2 },
    { owner_id: ownerId, branch_id: branchId, name: 'Garlic', quantity: 10, unit: 'kg', low_stock_threshold: 2 },
    { owner_id: ownerId, branch_id: branchId, name: 'Onions', quantity: 50, unit: 'kg', low_stock_threshold: 10 },
    { owner_id: ownerId, branch_id: branchId, name: 'Tomatoes', quantity: 40, unit: 'kg', low_stock_threshold: 8 },
    { owner_id: ownerId, branch_id: branchId, name: 'Potatoes', quantity: 30, unit: 'kg', low_stock_threshold: 5 },
    { owner_id: ownerId, branch_id: branchId, name: 'Cauliflower', quantity: 20, unit: 'kg', low_stock_threshold: 4 },
    { owner_id: ownerId, branch_id: branchId, name: 'Milk', quantity: 40, unit: 'liters', low_stock_threshold: 5 },
    { owner_id: ownerId, branch_id: branchId, name: 'Butter', quantity: 20, unit: 'kg', low_stock_threshold: 3 },
    { owner_id: ownerId, branch_id: branchId, name: 'Ghee', quantity: 15, unit: 'liters', low_stock_threshold: 2 },
    { owner_id: ownerId, branch_id: branchId, name: 'Yogurt', quantity: 30, unit: 'kg', low_stock_threshold: 5 },
    { owner_id: ownerId, branch_id: branchId, name: 'Oil', quantity: 25, unit: 'liters', low_stock_threshold: 4 },
  ];
  let invRows: any[] | null = null;
  {
    const res = await supabaseAdmin.from('inventory_items').insert(inventoryToInsert).select();
    if (res.error && (res.error.code === 'PGRST204' || `${res.error.message}`.includes("Could not find the 'low_stock_threshold'"))) {
      const legacyInv = inventoryToInsert.map(({ low_stock_threshold, ...rest }) => rest);
      const res2 = await supabaseAdmin.from('inventory_items').insert(legacyInv as any).select();
      if (res2.error) return console.error('Error seeding inventory_items (legacy fallback failed):', res2.error);
      invRows = res2.data as any[];
      console.log(`Seeded ${invRows?.length ?? 0} inventory items (legacy schema).`);
    } else if (res.error) {
      return console.error('Error seeding inventory_items:', res.error);
    } else {
      invRows = res.data as any[];
      console.log(`Seeded ${invRows?.length ?? 0} inventory items.`);
    }
  }

  // Seed Suppliers with schema compatibility (some legacy schemas may have only name)
  const suppliersToInsert = [
    { owner_id: ownerId, branch_id: branchId, name: 'Desi Spices Pvt Ltd', contact_name: 'Rajesh Kumar', contact_number: '9876543210', email: 'rajesh@desispices.com' },
    { owner_id: ownerId, branch_id: branchId, name: 'Fresh Produce Suppliers', contact_name: 'Suresh Patel', contact_number: '9876543211', email: 'suresh@freshproduce.com' },
    { owner_id: ownerId, branch_id: branchId, name: 'Dairy Farm Fresh', contact_name: 'Vikram Singh', contact_number: '9876543212', email: 'vikram@dairyfarm.com' },
    { owner_id: ownerId, branch_id: branchId, name: 'Meat Master Distributors', contact_name: 'Amit Sharma', contact_number: '9876543213', email: 'amit@meatmaster.com' },
    { owner_id: ownerId, branch_id: branchId, name: 'Grain & Cereals Co', contact_name: 'Deepak Verma', contact_number: '9876543214', email: 'deepak@graincereals.com' },
  ];
  let supplierRows: any[] | null = null;
  {
    const res = await supabaseAdmin.from('suppliers').insert(suppliersToInsert).select();
    if (res.error && res.error.code === 'PGRST204') {
      // fallback: only required columns
      const minimal = suppliersToInsert.map(s => ({ owner_id: s.owner_id, branch_id: s.branch_id, name: s.name }));
      const res2 = await supabaseAdmin.from('suppliers').insert(minimal as any).select();
      if (res2.error) {
        // Some legacy schemas require a NOT NULL 'phone' column
        if (`${res2.error.message}`.includes('"phone"') || res2.error.code === '23502') {
          const withPhone = (minimal as any[]).map(s => ({ ...s, phone: '0000000000' }));
          const res3 = await supabaseAdmin.from('suppliers').insert(withPhone as any).select();
          if (res3.error) return console.error('Error seeding suppliers (legacy with phone failed):', res3.error);
          supplierRows = res3.data as any[];
          console.log(`Seeded ${supplierRows?.length ?? 0} suppliers (legacy schema with phone).`);
        } else {
          return console.error('Error seeding suppliers (legacy fallback failed):', res2.error);
        }
      } else {
        supplierRows = res2.data as any[];
        console.log(`Seeded ${supplierRows?.length ?? 0} suppliers (legacy schema).`);
      }
    } else if (res.error) {
      // If base insert failed due to NOT NULL phone on a schema that also has other fields, try adding phone
      if (`${res.error.message}`.includes('"phone"') || res.error.code === '23502') {
        const withPhone = suppliersToInsert.map(s => ({ ...s, phone: '0000000000' }));
        const res3 = await supabaseAdmin.from('suppliers').insert(withPhone as any).select();
        if (res3.error) return console.error('Error seeding suppliers (phone retry failed):', res3.error);
        supplierRows = res3.data as any[];
        console.log(`Seeded ${supplierRows?.length ?? 0} suppliers (with phone).`);
      } else {
        return console.error('Error seeding suppliers:', res.error);
      }
    } else {
      supplierRows = res.data as any[];
      console.log(`Seeded ${supplierRows?.length ?? 0} suppliers.`);
    }
  }
  const supplierId = supplierRows?.[0]?.id as string;

  // Seed Procurement Order + Items (ensure supplier_name if required by schema)
  const supplierName = supplierRows?.[0]?.name || 'FreshFoods Ltd';
  let poRow: any = null;
  {
    const payloadNew = { owner_id: ownerId, branch_id: branchId, supplier_id: supplierId, supplier_name: supplierName, total_amount: 12000, status: 'Pending' } as any;
    const resPO = await supabaseAdmin
      .from('procurement_orders')
      .insert(payloadNew)
      .select()
      .single();
    if (resPO.error && (resPO.error.code === 'PGRST204' || `${resPO.error.message}`.includes("'supplier_name'"))) {
      const payloadLegacy = { owner_id: ownerId, branch_id: branchId, supplier_id: supplierId, total_amount: 12000, status: 'Pending' } as any;
      const resPO2 = await supabaseAdmin.from('procurement_orders').insert(payloadLegacy).select().single();
      if (resPO2.error) return console.error('Error seeding procurement_orders (legacy fallback failed):', resPO2.error);
      poRow = resPO2.data;
    } else if (resPO.error) {
      return console.error('Error seeding procurement_orders:', resPO.error);
    } else {
      poRow = resPO.data;
    }
  }
  const poId = (poRow as any).id as string;

  const riceId = invRows.find(i => i.name === 'Rice')?.id as string | undefined;
  const paneerId = invRows.find(i => i.name === 'Paneer')?.id as string | undefined;

  const poiToInsert = [
    { owner_id: ownerId, branch_id: branchId, procurement_order_id: poId, inventory_item_id: riceId, item_id: riceId, item_name: 'Rice', unit: 'kg', quantity: 20, unit_price: 50, total_price: 1000 },
    { owner_id: ownerId, branch_id: branchId, procurement_order_id: poId, inventory_item_id: paneerId, item_id: paneerId, item_name: 'Paneer', unit: 'kg', quantity: 10, unit_price: 200, total_price: 2000 },
  ];
  let poiErr: any = null;
{
  const res = await supabaseAdmin.from('procurement_order_items').insert(poiToInsert);
  if (res.error) {
    const msg = `${res.error.message}`.toLowerCase();
    if (res.error.code === 'PGRST204' || msg.includes("'inventory_item_id'") || msg.includes("inventory_item_id")) {
      // fallback: omit inventory_item_id (legacy schema)
      const legacyInsert = poiToInsert.map(({ inventory_item_id, ...rest }) => rest);
      const res2 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert as any);
      if (res2.error) {
        const msg2 = `${res2.error.message}`.toLowerCase();
        if (msg2.includes("'total_price'") || msg2.includes("total_price")) {
          // fallback: omit both inventory_item_id and total_price
          const legacyInsert2 = legacyInsert.map(({ total_price, ...rest }) => rest);
          const res3 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert2 as any);
          if (res3.error) {
            const msg3 = `${res3.error.message}`;
            if (msg3.includes("'unit_price'")) {
              // fallback: omit inventory_item_id, total_price, and unit_price
              const legacyInsert3 = legacyInsert2.map(({ unit_price, ...rest }) => rest);
              const res4 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert3 as any);
              if (res4.error) {
                const msg4 = `${res4.error.message}`;
                if (msg4.includes("'item_name'")) {
                  // fallback: omit inventory_item_id, total_price, unit_price, and item_name
                  const legacyInsert4 = legacyInsert3.map(({ item_name, ...rest }) => rest);
                  const res5 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert4 as any);
                  if (res5.error) {
                    const msg5 = `${res5.error.message}`;
                    if (msg5.includes("'unit'")) {
                      // fallback: omit inventory_item_id, total_price, unit_price, item_name, and unit
                      const legacyInsert5 = legacyInsert4.map(({ unit, ...rest }) => rest);
                      const res6 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert5 as any);
                      poiErr = res6.error;
                      if (!poiErr) console.log(`Seeded ${legacyInsert5.length} procurement order items (legacy schema, omitted inventory_item_id, total_price, unit_price, item_name, and unit).`);
                    } else {
                      poiErr = res5.error;
                    }
                  } else {
                    poiErr = res4.error;
                  }
                } else {
                  poiErr = res3.error;
                }
              } else {
                poiErr = res2.error;
              }
            } else {
              poiErr = res.error;
            }
          } else {
            poiErr = res2.error;
          }
        } else if (msg2.includes("'unit_price'")) {
          // fallback: omit inventory_item_id and unit_price
          const legacyInsert2 = legacyInsert.map(({ unit_price, ...rest }) => rest);
          const res3 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert2 as any);
          if (res3.error) {
            const msg3 = `${res3.error.message}`;
            if (msg3.includes("'item_name'")) {
              // fallback: omit inventory_item_id, unit_price, and item_name
              const legacyInsert3 = legacyInsert2.map(({ item_name, ...rest }) => rest);
              const res4 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert3 as any);
              if (res4.error) {
                const msg4 = `${res4.error.message}`;
                if (msg4.includes("'unit'")) {
                  // fallback: omit inventory_item_id, unit_price, item_name, and unit
                  const legacyInsert4 = legacyInsert3.map(({ unit, ...rest }) => rest);
                  const res5 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert4 as any);
                  poiErr = res5.error;
                  if (!poiErr) console.log(`Seeded ${legacyInsert4.length} procurement order items (legacy schema, omitted inventory_item_id, unit_price, item_name, and unit).`);
                } else {
                  poiErr = res4.error;
                }
              } else {
                poiErr = res3.error;
              }
            } else {
              poiErr = res3.error;
            }
          } else {
            poiErr = res2.error;
          }
        } else if (msg2.includes("'item_name'")) {
          // fallback: omit inventory_item_id and item_name
          const legacyInsert2 = legacyInsert.map(({ item_name, ...rest }) => rest);
          const res3 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert2 as any);
          if (res3.error) {
            const msg3 = `${res3.error.message}`;
            if (msg3.includes("'unit'")) {
              // fallback: omit inventory_item_id, item_name, and unit
              const legacyInsert3 = legacyInsert2.map(({ unit, ...rest }) => rest);
              const res4 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert3 as any);
              poiErr = res4.error;
              if (!poiErr) console.log(`Seeded ${legacyInsert3.length} procurement order items (legacy schema, omitted inventory_item_id, item_name, and unit).`);
            } else {
              poiErr = res3.error;
            }
          } else {
            poiErr = res2.error;
          }
        } else {
          poiErr = res2.error;
        }
      } else {
        poiErr = null;
        console.log(`Seeded ${legacyInsert.length} procurement order items (legacy schema, omitted inventory_item_id).`);
      }
    } else if (msg.includes("'total_price'")) {
      // fallback: omit total_price (legacy schema)
      const legacyInsert = poiToInsert.map(({ total_price, ...rest }) => rest);
      const res2 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert as any);
      if (res2.error) {
        const msg2 = `${res2.error.message}`;
        if (msg2.includes("'inventory_item_id'")) {
          // fallback: omit both total_price and inventory_item_id
          const legacyInsert2 = legacyInsert.map(({ inventory_item_id, ...rest }) => rest);
          const res3 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert2 as any);
          if (res3.error) {
            const msg3 = `${res3.error.message}`;
            if (msg3.includes("'unit_price'")) {
              // fallback: omit total_price, inventory_item_id, and unit_price
              const legacyInsert3 = legacyInsert2.map(({ unit_price, ...rest }) => rest);
              const res4 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert3 as any);
              if (res4.error) {
                const msg4 = `${res4.error.message}`;
                if (msg4.includes("'item_name'")) {
                  // fallback: omit total_price, inventory_item_id, unit_price, and item_name
                  const legacyInsert4 = legacyInsert3.map(({ item_name, ...rest }) => rest);
                  const res5 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert4 as any);
                  if (res5.error) {
                    const msg5 = `${res5.error.message}`;
                    if (msg5.includes("'unit'")) {
                      // fallback: omit total_price, inventory_item_id, unit_price, item_name, and unit
                      const legacyInsert5 = legacyInsert4.map(({ unit, ...rest }) => rest);
                      const res6 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert5 as any);
                      poiErr = res6.error;
                      if (!poiErr) console.log(`Seeded ${legacyInsert5.length} procurement order items (legacy schema, omitted total_price, inventory_item_id, unit_price, item_name, and unit).`);
                    } else {
                      poiErr = res5.error;
                    }
                  } else {
                    poiErr = res4.error;
                  }
                } else {
                  poiErr = res3.error;
                }
              } else {
                poiErr = res2.error;
              }
            } else {
              poiErr = res.error;
            }
          } else {
            poiErr = res2.error;
          }
        } else if (msg2.includes("'unit_price'")) {
          // fallback: omit total_price and unit_price
          const legacyInsert2 = legacyInsert.map(({ unit_price, ...rest }) => rest);
          const res3 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert2 as any);
          if (res3.error) {
            const msg3 = `${res3.error.message}`;
            if (msg3.includes("'item_name'")) {
              // fallback: omit total_price, unit_price, and item_name
              const legacyInsert3 = legacyInsert2.map(({ item_name, ...rest }) => rest);
              const res4 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert3 as any);
              if (res4.error) {
                const msg4 = `${res4.error.message}`;
                if (msg4.includes("'unit'")) {
                  // fallback: omit total_price, unit_price, item_name, and unit
                  const legacyInsert4 = legacyInsert3.map(({ unit, ...rest }) => rest);
                  const res5 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert4 as any);
                  poiErr = res5.error;
                  if (!poiErr) console.log(`Seeded ${legacyInsert4.length} procurement order items (legacy schema, omitted total_price, unit_price, item_name, and unit).`);
                } else {
                  poiErr = res4.error;
                }
              } else {
                poiErr = res3.error;
              }
            } else {
              poiErr = res3.error;
            }
          } else {
            poiErr = res2.error;
          }
        } else if (msg2.includes("'item_name'")) {
          // fallback: omit total_price and item_name
          const legacyInsert2 = legacyInsert.map(({ item_name, ...rest }) => rest);
          const res3 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert2 as any);
          if (res3.error) {
            const msg3 = `${res3.error.message}`;
            if (msg3.includes("'unit'")) {
              // fallback: omit total_price, item_name, and unit
              const legacyInsert3 = legacyInsert2.map(({ unit, ...rest }) => rest);
              const res4 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert3 as any);
              poiErr = res4.error;
              if (!poiErr) console.log(`Seeded ${legacyInsert3.length} procurement order items (legacy schema, omitted total_price, item_name, and unit).`);
            } else {
              poiErr = res3.error;
            }
          } else {
            poiErr = res2.error;
          }
        } else {
          poiErr = res2.error;
        }
      } else {
        poiErr = null;
        console.log(`Seeded ${legacyInsert.length} procurement order items (legacy schema, omitted total_price).`);
      }
    } else if (msg.includes("'unit_price'")) {
      // fallback: omit unit_price (legacy schema)
      const legacyInsert = poiToInsert.map(({ unit_price, ...rest }) => rest);
      const res2 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert as any);
      if (res2.error) {
        const msg2 = `${res2.error.message}`;
        if (msg2.includes("'inventory_item_id'")) {
          // fallback: omit unit_price and inventory_item_id
          const legacyInsert2 = legacyInsert.map(({ inventory_item_id, ...rest }) => rest);
          const res3 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert2 as any);
          if (res3.error) {
            const msg3 = `${res3.error.message}`;
            if (msg3.includes("'total_price'")) {
              // fallback: omit unit_price, inventory_item_id, and total_price
              const legacyInsert3 = legacyInsert2.map(({ total_price, ...rest }) => rest);
              const res4 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert3 as any);
              if (res4.error) {
                const msg4 = `${res4.error.message}`;
                if (msg4.includes("'item_name'")) {
                  // fallback: omit unit_price, inventory_item_id, total_price, and item_name
                  const legacyInsert4 = legacyInsert3.map(({ item_name, ...rest }) => rest);
                  const res5 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert4 as any);
                  if (res5.error) {
                    const msg5 = `${res5.error.message}`;
                    if (msg5.includes("'unit'")) {
                      // fallback: omit unit_price, inventory_item_id, total_price, item_name, and unit
                      const legacyInsert5 = legacyInsert4.map(({ unit, ...rest }) => rest);
                      const res6 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert5 as any);
                      poiErr = res6.error;
                      if (!poiErr) console.log(`Seeded ${legacyInsert5.length} procurement order items (legacy schema, omitted unit_price, inventory_item_id, total_price, item_name, and unit).`);
                    } else {
                      poiErr = res5.error;
                    }
                  } else {
                    poiErr = res4.error;
                  }
                } else {
                  poiErr = res3.error;
                }
              } else {
                poiErr = res2.error;
              }
            } else {
              poiErr = res.error;
            }
          } else {
            poiErr = res2.error;
          }
        } else if (msg2.includes("'total_price'")) {
          // fallback: omit unit_price and total_price
          const legacyInsert2 = legacyInsert.map(({ total_price, ...rest }) => rest);
          const res3 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert2 as any);
          if (res3.error) {
            const msg3 = `${res3.error.message}`;
            if (msg3.includes("'item_name'")) {
              // fallback: omit unit_price, total_price, and item_name
              const legacyInsert3 = legacyInsert2.map(({ item_name, ...rest }) => rest);
              const res4 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert3 as any);
              if (res4.error) {
                const msg4 = `${res4.error.message}`;
                if (msg4.includes("'unit'")) {
                  // fallback: omit unit_price, total_price, item_name, and unit
                  const legacyInsert4 = legacyInsert3.map(({ unit, ...rest }) => rest);
                  const res5 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert4 as any);
                  poiErr = res5.error;
                  if (!poiErr) console.log(`Seeded ${legacyInsert4.length} procurement order items (legacy schema, omitted unit_price, total_price, item_name, and unit).`);
                } else {
                  poiErr = res4.error;
                }
              } else {
                poiErr = res3.error;
              }
            } else {
              poiErr = res3.error;
            }
          } else {
            poiErr = res2.error;
          }
        } else if (msg2.includes("'item_name'")) {
          // fallback: omit unit_price and item_name
          const legacyInsert2 = legacyInsert.map(({ item_name, ...rest }) => rest);
          const res3 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert2 as any);
          if (res3.error) {
            const msg3 = `${res3.error.message}`;
            if (msg3.includes("'unit'")) {
              // fallback: omit unit_price, item_name, and unit
              const legacyInsert3 = legacyInsert2.map(({ unit, ...rest }) => rest);
              const res4 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert3 as any);
              poiErr = res4.error;
              if (!poiErr) console.log(`Seeded ${legacyInsert3.length} procurement order items (legacy schema, omitted unit_price, item_name, and unit).`);
            } else {
              poiErr = res3.error;
            }
          } else {
            poiErr = res2.error;
          }
        } else {
          poiErr = res2.error;
        }
      } else {
        poiErr = null;
        console.log(`Seeded ${legacyInsert.length} procurement order items (legacy schema, omitted unit_price).`);
      }
    } else if (msg.includes("'item_name'")) {
      // fallback: omit item_name (legacy schema)
      const legacyInsert = poiToInsert.map(({ item_name, ...rest }) => rest);
      const res2 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert as any);
      if (res2.error) {
        const msg2 = `${res2.error.message}`;
        if (msg2.includes("'inventory_item_id'")) {
          // fallback: omit item_name and inventory_item_id
          const legacyInsert2 = legacyInsert.map(({ inventory_item_id, ...rest }) => rest);
          const res3 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert2 as any);
          if (res3.error) {
            const msg3 = `${res3.error.message}`;
            if (msg3.includes("'unit'")) {
              // fallback: omit item_name, inventory_item_id, and unit
              const legacyInsert3 = legacyInsert2.map(({ unit, ...rest }) => rest);
              const res4 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert3 as any);
              poiErr = res4.error;
              if (!poiErr) console.log(`Seeded ${legacyInsert3.length} procurement order items (legacy schema, omitted item_name, inventory_item_id, and unit).`);
            } else {
              poiErr = res3.error;
            }
          } else {
            poiErr = res2.error;
          }
        } else if (msg2.includes("'unit'")) {
          // fallback: omit item_name and unit
          const legacyInsert2 = legacyInsert.map(({ unit, ...rest }) => rest);
          const res3 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert2 as any);
          poiErr = res3.error;
          if (!poiErr) console.log(`Seeded ${legacyInsert2.length} procurement order items (legacy schema, omitted both item_name and unit).`);
        } else {
          poiErr = res2.error;
        }
      } else {
        poiErr = null;
        console.log(`Seeded ${legacyInsert.length} procurement order items (legacy schema, omitted item_name).`);
      }
    } else if (msg.includes("'unit'")) {
      // fallback: omit unit (legacy schema)
      const legacyInsert = poiToInsert.map(({ unit, ...rest }) => rest);
      const res2 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert as any);
      if (res2.error) {
        const msg2 = `${res2.error.message}`;
        if (msg2.includes("'inventory_item_id'")) {
          // fallback: omit unit and inventory_item_id
          const legacyInsert2 = legacyInsert.map(({ inventory_item_id, ...rest }) => rest);
          const res3 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert2 as any);
          if (res3.error) {
            const msg3 = `${res3.error.message}`;
            if (msg3.includes("'item_name'")) {
              // fallback: omit unit, inventory_item_id, and item_name
              const legacyInsert3 = legacyInsert2.map(({ item_name, ...rest }) => rest);
              const res4 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert3 as any);
              poiErr = res4.error;
              if (!poiErr) console.log(`Seeded ${legacyInsert3.length} procurement order items (legacy schema, omitted unit, inventory_item_id, and item_name).`);
            } else {
              poiErr = res3.error;
            }
          } else {
            poiErr = res2.error;
          }
        } else if (msg2.includes("'item_name'")) {
          // fallback: omit unit and item_name
          const legacyInsert2 = legacyInsert.map(({ item_name, ...rest }) => rest);
          const res3 = await supabaseAdmin.from('procurement_order_items').insert(legacyInsert2 as any);
          poiErr = res3.error;
          if (!poiErr) console.log(`Seeded ${legacyInsert2.length} procurement order items (legacy schema, omitted both unit and item_name).`);
        } else {
          poiErr = res2.error;
        }
      } else {
        poiErr = null;
        console.log(`Seeded ${legacyInsert.length} procurement order items (legacy schema, omitted unit).`);
      }
    } else {
      poiErr = res.error;
    }
  } else {
    poiErr = null;
    console.log(`Seeded ${poiToInsert.length} procurement order items.`);
  }
}
if (poiErr) console.error('Error seeding procurement_order_items:', poiErr);

  // Seed Pending Order + Items
  const { data: tableRows } = await supabaseAdmin.from('tables').select('id').eq('owner_id', ownerId).limit(1);
  const tableId = tableRows?.[0]?.id as string | undefined;
  let pendingOrder: any = null;
{
  const res = await supabaseAdmin
    .from('pending_orders')
    .insert({ owner_id: ownerId, branch_id: branchId, table_id: tableId, total_amount: 0, status: 'Active' })
    .select()
    .single();
  if (res.error) {
    const msg = `${res.error.message}`.toLowerCase();
    if (res.error.code === 'PGRST204' || msg.includes("'status'") || msg.includes("status")) {
      // fallback: omit status column
      const legacyRes = await supabaseAdmin
        .from('pending_orders')
        .insert({ owner_id: ownerId, branch_id: branchId, table_id: tableId, total_amount: 0 })
        .select()
        .single();
      if (legacyRes.error) {
        const msg2 = `${legacyRes.error.message}`.toLowerCase();
        if (msg2.includes("'total_amount'") || msg2.includes("total_amount")) {
          // fallback: omit both status and total_amount
          const legacyRes2 = await supabaseAdmin
            .from('pending_orders')
            .insert({ owner_id: ownerId, branch_id: branchId, table_id: tableId })
            .select()
            .single();
          if (legacyRes2.error) return console.error('Error seeding pending_orders (legacy fallback failed - both status and total_amount):', legacyRes2.error);
          pendingOrder = legacyRes2.data;
          console.log('Seeded pending order (legacy schema, omitted both status and total_amount).');
        } else {
          return console.error('Error seeding pending_orders (legacy fallback failed - status):', legacyRes.error);
        }
      } else {
        pendingOrder = legacyRes.data;
        console.log('Seeded pending order (legacy schema, omitted status).');
      }
    } else if (msg.includes("'total_amount'") || msg.includes("total_amount")) {
      // fallback: omit total_amount column
      const legacyRes = await supabaseAdmin
        .from('pending_orders')
        .insert({ owner_id: ownerId, branch_id: branchId, table_id: tableId, status: 'Active' })
        .select()
        .single();
      if (legacyRes.error) {
        const msg2 = `${legacyRes.error.message}`;
        if (msg2.includes("'status'")) {
          // fallback: omit both total_amount and status
          const legacyRes2 = await supabaseAdmin
            .from('pending_orders')
            .insert({ owner_id: ownerId, branch_id: branchId, table_id: tableId })
            .select()
            .single();
          if (legacyRes2.error) return console.error('Error seeding pending_orders (legacy fallback failed - both total_amount and status):', legacyRes2.error);
          pendingOrder = legacyRes2.data;
          console.log('Seeded pending order (legacy schema, omitted both total_amount and status).');
        } else {
          return console.error('Error seeding pending_orders (legacy fallback failed - total_amount):', legacyRes.error);
        }
      } else {
        pendingOrder = legacyRes.data;
        console.log('Seeded pending order (legacy schema, omitted total_amount).');
      }
    } else {
      return console.error('Error seeding pending_orders:', res.error);
    }
  } else {
    pendingOrder = res.data;
  }
}
if (!pendingOrder) return console.error('Failed to create pending order');
const pendingOrderId = (pendingOrder as any).id as string;

  const { data: menuRows } = await supabaseAdmin.from('menu_items').select('id, base_price').eq('owner_id', ownerId).limit(2);
  const pItemsToInsert = (menuRows ?? []).map((m, idx) => ({
    owner_id: ownerId,
    branch_id: branchId,
    pending_order_id: pendingOrderId,
    menu_item_id: m.id,
    quantity: 1 + idx,
    total_price: Number(m.base_price) * (1 + idx),
  }));
  if (pItemsToInsert.length > 0) {
    const { error: poi2Err } = await supabaseAdmin.from('pending_order_items').insert(pItemsToInsert as any);
    if (poi2Err) console.error('Error seeding pending_order_items:', poi2Err);
    else console.log(`Seeded ${pItemsToInsert.length} pending order items.`);
  }

  // Seed Completed Order + Items
  let orderRow: any = null;
{
  const res = await supabaseAdmin
    .from('orders')
    .insert({ owner_id: ownerId, branch_id: branchId, table_id: tableId, total_amount: 500, tax_amount: 25, discount_amount: 0, payment_method: 'Cash', status: 'Completed' })
    .select()
    .single();
  if (res.error) {
    const msg = `${res.error.message}`.toLowerCase();
    if (res.error.code === 'PGRST204' || msg.includes("'discount_amount'") || msg.includes("discount_amount")) {
      // fallback: omit discount_amount
      const legacyRes = await supabaseAdmin
        .from('orders')
        .insert({ owner_id: ownerId, branch_id: branchId, table_id: tableId, total_amount: 500, tax_amount: 25, payment_method: 'Cash', status: 'Completed' })
        .select()
        .single();
      if (legacyRes.error) {
        const msg2 = `${legacyRes.error.message}`;
        if (msg2.includes("'status'")) {
          // fallback: omit both discount_amount and status
          const legacyRes2 = await supabaseAdmin
            .from('orders')
            .insert({ owner_id: ownerId, branch_id: branchId, table_id: tableId, total_amount: 500, tax_amount: 25, payment_method: 'Cash' })
            .select()
            .single();
          if (legacyRes2.error) {
            const msg3 = `${legacyRes2.error.message}`;
            if (msg3.includes("tax_amount")) {
              // fallback: omit discount_amount, status, and tax_amount
              const legacyRes3 = await supabaseAdmin
                .from('orders')
                .insert({ owner_id: ownerId, branch_id: branchId, table_id: tableId, total_amount: 500, payment_method: 'Cash' })
                .select()
                .single();
              if (legacyRes3.error) return console.error('Error seeding orders (legacy fallback failed - discount_amount, status, and tax_amount):', legacyRes3.error);
              orderRow = legacyRes3.data;
              console.log('Seeded order (legacy schema, omitted discount_amount, status, and tax_amount).');
            } else {
              return console.error('Error seeding orders (legacy fallback failed - discount_amount and status):', legacyRes2.error);
            }
          } else {
            orderRow = legacyRes2.data;
            console.log('Seeded order (legacy schema, omitted both discount_amount and status).');
          }
        } else {
          return console.error('Error seeding orders (legacy fallback failed - discount_amount):', legacyRes.error);
        }
      } else {
        orderRow = legacyRes.data;
        console.log('Seeded order (legacy schema, omitted discount_amount).');
      }
    } else if (msg.includes("'status'")) {
      // fallback: omit status
      const legacyRes = await supabaseAdmin
        .from('orders')
        .insert({ owner_id: ownerId, branch_id: branchId, table_id: tableId, total_amount: 500, tax_amount: 25, discount_amount: 0, payment_method: 'Cash' })
        .select()
        .single();
      if (legacyRes.error) {
        const msg2 = `${legacyRes.error.message}`;
        if (msg2.includes("tax_amount")) {
          // fallback: omit both status and tax_amount
          const legacyRes2 = await supabaseAdmin
            .from('orders')
            .insert({ owner_id: ownerId, branch_id: branchId, table_id: tableId, total_amount: 500, discount_amount: 0, payment_method: 'Cash' })
            .select()
            .single();
          if (legacyRes2.error) return console.error('Error seeding orders (legacy fallback failed - status and tax_amount):', legacyRes2.error);
          orderRow = legacyRes2.data;
          console.log('Seeded order (legacy schema, omitted both status and tax_amount).');
        } else {
          return console.error('Error seeding orders (legacy fallback failed - status):', legacyRes.error);
        }
      } else {
        orderRow = legacyRes.data;
        console.log('Seeded order (legacy schema, omitted status).');
      }
    } else {
      return console.error('Error seeding orders:', res.error);
    }
  } else {
    orderRow = res.data;
  }
}
if (!orderRow) return console.error('Failed to create order');
const orderId = (orderRow as any).id as string;

  const oItemsToInsert = (menuRows ?? []).map((m, idx) => ({
    owner_id: ownerId,
    branch_id: branchId,
    order_id: orderId,
    menu_item_id: m.id,
    quantity: 1,
    total_price: Number(m.base_price),
  }));
  if (oItemsToInsert.length > 0) {
    const { error: oiErr } = await supabaseAdmin.from('order_items').insert(oItemsToInsert as any);
    if (oiErr) console.error('Error seeding order_items:', oiErr);
    else console.log(`Seeded ${oItemsToInsert.length} order items.`);
  }

  // Seed Kitchen Request + Items
  const { data: krRow, error: krErr } = await supabaseAdmin
    .from('kitchen_requests')
    .insert({ owner_id: ownerId, branch_id: branchId, status: 'Pending' })
    .select()
    .single();
  if (krErr) return console.error('Error seeding kitchen_requests:', krErr);
  const krId = (krRow as any).id as string;

  const kriToInsert = [
    { owner_id: ownerId, branch_id: branchId, kitchen_request_id: krId, inventory_item_id: riceId, quantity: 5 },
  ];
  const { error: kriErr } = await supabaseAdmin.from('kitchen_request_items').insert(kriToInsert as any);
  if (kriErr) console.error('Error seeding kitchen_request_items:', kriErr);
  else console.log(`Seeded ${kriToInsert.length} kitchen request items.`);

  // Seed Production Logs
  const someMenu = (menuRows ?? [])[0];
  if (someMenu) {
    const { error: prodErr } = await supabaseAdmin.from('production_logs').insert({
      owner_id: ownerId,
      branch_id: branchId,
      menu_item_id: someMenu.id,
      quantity: 10,
      production_date: new Date().toISOString().slice(0, 10),
      chef_id: chefId ?? null,
    });
    if (prodErr) console.error('Error seeding production_logs:', prodErr);
    else console.log('Seeded 1 production log.');
  }
}

async function main() {
  try {
    console.log('Database has been reset. Seeding is disabled as per your request.');
    // console.log('Starting to seed Supabase database...');
    // const ownerId = await getOwnerId(SEED_USER_EMAIL);

    // if (!ownerId) {
    //   console.error(`Could not find user with email ${SEED_USER_EMAIL}. Aborting seed.`);
    //   return;
    // }

    // await clearAllDataForOwner(ownerId);
    // await seedDataForOwner(ownerId);

    // console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Error in main process:', error);
  }
}

// Only run if this file is executed directly
if (typeof window === 'undefined') {
  main();
}

export { main as seedDatabase };