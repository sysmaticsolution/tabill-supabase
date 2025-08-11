import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function createOwner() {
  const email = 'tabil@tabill.com';
  const password = 'veltron2025';

  const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const exists = existingUser.users.find(u => u.email === email);
  let authUser = exists as any;

  if (!authUser) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { demo: true, name: 'Tabill Demo' }
    });
    if (error) throw error;
    authUser = data.user!;
  } else {
    // Ensure verified
    await supabaseAdmin.auth.admin.updateUserById(authUser.id, { email_confirm: true }).catch(() => {});
  }

  // Generous limits to avoid trigger blocks during seeding
  const now = new Date();
  const trialEnds = new Date(now);
  trialEnds.setDate(now.getDate() + 30); // 30-day trial

  const ownerProfile = {
    uid: authUser!.id,
    email,
    name: 'Tabill Demo',
    restaurant_name: 'Veltron Biryani House',
    restaurant_address: 'HSR Layout, Bengaluru',
    profile_complete: true,
    subscription_status: 'active',
    subscription_plan: 'PRO',
    base_branch_limit: 1,
    extra_branches: 10,
    trial_ends_at: trialEnds.toISOString(),
    subscribed_at: now.toISOString(),
    subscription_ends_at: trialEnds.toISOString()
  } as any;

  const { data: userRow, error: upErr } = await supabaseAdmin
    .from('users')
    .upsert(ownerProfile, { onConflict: 'uid' })
    .select('id')
    .single();
  if (upErr) throw upErr;

  // Clear previous demo data under this owner to keep seed idempotent
  const tablesToClear = [
    'branches',
    'staff_members',
    'inventory_items',
    'kitchen_requests',
    'suppliers',
    'procurement_items',
    'procurement_orders',
    'production_logs',
  ];
  for (const t of tablesToClear) {
    await supabaseAdmin.from(t).delete().eq('owner_id', userRow.id);
  }

  return { ownerId: userRow.id, authUid: authUser!.id };
}

async function createBranches(ownerId: string) {
  const branches = [
    { owner_id: ownerId, name: 'HSR Layout', address: 'HSR, BLR', status: 'Active' },
    { owner_id: ownerId, name: 'Koramangala', address: 'Koramangala, BLR', status: 'Active' },
    { owner_id: ownerId, name: 'Whitefield', address: 'Whitefield, BLR', status: 'Inactive' },
  ];
  const { data, error } = await supabaseAdmin.from('branches').upsert(branches).select('id, name');
  if (error) throw error;
  return data!;
}

async function createCategories(ownerId: string, branchId: string) {
  const rows = [
    { owner_id: ownerId, branch_id: branchId, name: 'Starters' },
    { owner_id: ownerId, branch_id: branchId, name: 'Main Course' },
    { owner_id: ownerId, branch_id: branchId, name: 'Breads' },
    { owner_id: ownerId, branch_id: branchId, name: 'Biryani' },
    { owner_id: ownerId, branch_id: branchId, name: 'Beverages' },
  ];
  const { data, error } = await supabaseAdmin.from('categories').insert(rows).select('id, name');
  if (error) throw error;
  return data!;
}

async function createMenu(ownerId: string, branchId: string, cats: any[]) {
  const catByName: Record<string, string> = Object.fromEntries(cats.map(c => [c.name, c.id]));
  
  // Define unique menu items for each branch
  const branchMenuItems: Record<string, any[]> = {
    'HSR Layout': [
      { category: 'Biryani', name: 'Chicken Biryani' },
      { category: 'Biryani', name: 'Mutton Biryani' },
      { category: 'Main Course', name: 'Butter Chicken' },
      { category: 'Starters', name: 'Chicken 65' },
      { category: 'Beverages', name: 'Masala Soda' },
    ],
    'Koramangala': [
      { category: 'Biryani', name: 'Fish Biryani' },
      { category: 'Biryani', name: 'Prawn Biryani' },
      { category: 'Main Course', name: 'Paneer Butter Masala' },
      { category: 'Starters', name: 'Gobi Manchurian' },
      { category: 'Beverages', name: 'Filter Coffee' },
    ],
    'Whitefield': [
      { category: 'Biryani', name: 'Egg Biryani' },
      { category: 'Biryani', name: 'Vegetable Biryani' },
      { category: 'Main Course', name: 'Fish Curry' },
      { category: 'Starters', name: 'Chilli Paneer' },
      { category: 'Beverages', name: 'Lassi' },
    ]
  };

  // Get branch name to select appropriate menu items
  const branchName = (await supabaseAdmin.from('branches').select('name').eq('id', branchId).single()).data?.name || 'HSR Layout';
  
  const items = branchMenuItems[branchName].map(item => ({
    owner_id: ownerId, 
    branch_id: branchId, 
    category_id: catByName[item.category], 
    category: item.category, 
    name: item.name
  }));

  const { data, error } = await supabaseAdmin.from('menu_items').insert(items).select('id, name');
  if (error) throw error;

  const variants: any[] = [];
  for (const it of data!) {
    if (it.name.includes('Biryani')) {
      variants.push(
        { owner_id: ownerId, branch_id: branchId, menu_item_id: it.id, name: 'Half', price_modifier: 0 },
        { owner_id: ownerId, branch_id: branchId, menu_item_id: it.id, name: 'Full', price_modifier: 100 },
      );
    } else {
      variants.push({ owner_id: ownerId, branch_id: branchId, menu_item_id: it.id, name: 'Regular', price_modifier: 0 });
    }
  }
  await supabaseAdmin.from('menu_item_variants').insert(variants).select('id');
}

function priceFor(itemName: string, variantName: string) {
  const map: Record<string, number> = {
    'Chicken Biryani:Half': 250,
    'Chicken Biryani:Full': 350,
    'Mutton Biryani:Half': 320,
    'Mutton Biryani:Full': 420,
    'Fish Biryani:Half': 280,
    'Fish Biryani:Full': 380,
    'Prawn Biryani:Half': 350,
    'Prawn Biryani:Full': 450,
    'Egg Biryani:Half': 200,
    'Egg Biryani:Full': 300,
    'Vegetable Biryani:Half': 180,
    'Vegetable Biryani:Full': 280,
    'Butter Chicken:Regular': 280,
    'Paneer Butter Masala:Regular': 250,
    'Fish Curry:Regular': 300,
    'Chicken 65:Regular': 220,
    'Gobi Manchurian:Regular': 200,
    'Chilli Paneer:Regular': 220,
    'Masala Soda:Regular': 60,
    'Filter Coffee:Regular': 40,
    'Lassi:Regular': 50,
  };
  const key = `${itemName}:${variantName || 'Regular'}`;
  return map[key] ?? 200;
}

async function createSampleOrders(ownerId: string, branchId: string) {
  const { data: items } = await supabaseAdmin
    .from('menu_items')
    .select('id, name')
    .eq('owner_id', ownerId)
    .eq('branch_id', branchId);
  if (!items || items.length === 0) return;

  const itemIds = items.map(i => i.id);
  const { data: variants } = await supabaseAdmin
    .from('menu_item_variants')
    .select('id, menu_item_id, name')
    .in('menu_item_id', itemIds);

  if (!variants || variants.length === 0) return;

  const itemNameById = new Map(items.map(i => [i.id, i.name] as [string, string]));

  const days = 30;
  for (let d = 0; d < days; d++) {
    const day = new Date(); day.setDate(day.getDate() - d);
    const ordersPerDay = randBetween(5, 20);
    for (let k = 0; k < ordersPerDay; k++) {
      const orderDate = new Date(day.getTime() + randBetween(10, 20) * 60 * 1000);
      const payment_method = Math.random() < 0.5 ? 'Cash' : 'Card / UPI';

      const lines = randBetween(1, 4);
      let subtotal = 0;
      const orderItems: any[] = [];
      for (let i = 0; i < lines; i++) {
        const v = variants[randBetween(0, variants.length - 1)];
        const itemName = itemNameById.get(v.menu_item_id) || 'Item';
        const qty = randBetween(1, 3);
        const unit = priceFor(itemName, v.name || 'Regular');
        const lineTotal = unit * qty;
        subtotal += lineTotal;
        orderItems.push({ owner_id: ownerId, branch_id: branchId, order_id: '', menu_item_id: v.menu_item_id, variant_id: v.id, quantity: qty, unit_price: unit, total_price: lineTotal });
      }
      const sgst = subtotal * 0.09; const cgst = subtotal * 0.09;
      const grand = subtotal + sgst + cgst;

      const { data: ord, error: oErr } = await supabaseAdmin
        .from('orders')
        .insert({ owner_id: ownerId, branch_id: branchId, table_id: null, subtotal, sgst_amount: sgst, cgst_amount: cgst, total: grand, payment_method, order_date: orderDate.toISOString(), status: 'Completed' })
        .select('id')
        .single();
      if (oErr) throw oErr;

      const itemsToInsert = orderItems.map(oi => ({ ...oi, order_id: ord.id }));
      await supabaseAdmin.from('order_items').insert(itemsToInsert);
    }
  }
}

async function createTables(ownerId: string, branchId: string) {
  const t = Array.from({ length: 12 }).map((_, i) => ({ owner_id: ownerId, branch_id: branchId, name: `T${i + 1}`, capacity: i % 2 === 0 ? 2 : 4, status: 'Available' }));
  await supabaseAdmin.from('tables').insert(t);
}

async function createStaff(ownerId: string, branches: { id: string; name: string }[]) {
  const staffDefs = [
    { username: 'manager1', name: 'Meera Manager', role: 'Manager', modules: ['reports','tables','menu','users','branches','expenses','procurement','inventory'] },
    { username: 'waiter1', name: 'Vikas Waiter', role: 'Waitstaff', modules: ['order','tables','billing'] },
    { username: 'chef1', name: 'Arjun Chef', role: 'Kitchen Staff', modules: ['kitchen','my-productions'] },
    { username: 'inventory1', name: 'Kavya Store', role: 'Inventory', modules: ['inventory'] },
    { username: 'procure1', name: 'Ravi Procurement', role: 'Procurement', modules: ['procurement'] },
  ];
  for (const s of staffDefs) {
    const email = `${s.username}@tabill.com`;
    const { data: listed } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = listed.users.find((u: any) => u.email === email);
    let uid = found?.id as string | undefined;
    if (!uid) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password: 'Veltron@2025', email_confirm: true, user_metadata: { staff: true, username: s.username } });
      if (error) throw error;
      uid = data.user!.id;
    }
    const branch_id = s.role === 'Waitstaff' || s.role === 'Kitchen Staff' ? branches[0]?.id : null;
    const { error: insErr } = await supabaseAdmin.from('staff_members').insert({ owner_id: ownerId, name: s.name, email, role: s.role, modules: s.modules, username: s.username, auth_uid: uid, branch_id });
    if (insErr) {
      // ignore duplicates
    }
  }
}

async function createInventory(ownerId: string) {
  const now = new Date().toISOString();
  const items = [
    { owner_id: ownerId, name: 'Basmati Rice', category: 'Grains', unit: 'kg', quantity: 200, reorder_level: 50, last_updated: now },
    { owner_id: ownerId, name: 'Chicken', category: 'Meat', unit: 'kg', quantity: 80, reorder_level: 20, last_updated: now },
    { owner_id: ownerId, name: 'Mutton', category: 'Meat', unit: 'kg', quantity: 40, reorder_level: 10, last_updated: now },
    { owner_id: ownerId, name: 'Onions', category: 'Vegetables', unit: 'kg', quantity: 100, reorder_level: 25, last_updated: now },
    { owner_id: ownerId, name: 'Refined Oil', category: 'Oil', unit: 'L', quantity: 60, reorder_level: 15, last_updated: now },
    { owner_id: ownerId, name: 'Spice Mix', category: 'Spices', unit: 'kg', quantity: 20, reorder_level: 5, last_updated: now },
  ];
  await supabaseAdmin.from('inventory_items').insert(items);
}

async function createSuppliersAndProcurement(ownerId: string) {
  const suppliers = [
    { owner_id: ownerId, name: 'Fresh Farms', phone: '+91 98765 11111', address: 'HSR Sector 2, BLR', contact_person: 'Mr. Sharma' },
    { owner_id: ownerId, name: 'Meat Master', phone: '+91 98765 22222', address: 'Koramangala 5th block', contact_person: 'Mr. Khan' },
    { owner_id: ownerId, name: 'Spice Kart', phone: '+91 98765 33333', address: 'Whitefield', contact_person: 'Ms. Priya' },
  ];
  const { data: supp, error: sErr } = await supabaseAdmin.from('suppliers').insert(suppliers).select('id, name');
  if (sErr) throw sErr;

  const items = [
    { owner_id: ownerId, name: 'Basmati Rice', unit: 'kg' },
    { owner_id: ownerId, name: 'Refined Oil', unit: 'L' },
    { owner_id: ownerId, name: 'Masala Powder', unit: 'kg' },
  ];
  const { data: pItems, error: pErr } = await supabaseAdmin.from('procurement_items').insert(items).select('id, name, unit');
  if (pErr) throw pErr;

  const findItem = (name: string) => pItems!.find((i: any) => i.name === name)!;
  const po1Items = [
    { item_id: findItem('Basmati Rice').id, item_name: 'Basmati Rice', quantity: 50, unit: 'kg', price_per_unit: 75 },
    { item_id: findItem('Refined Oil').id, item_name: 'Refined Oil', quantity: 20, unit: 'L', price_per_unit: 120 },
  ];
  const po1Total = po1Items.reduce((t, i) => t + i.quantity * i.price_per_unit, 0);

  const po2Items = [
    { item_id: findItem('Masala Powder').id, item_name: 'Masala Powder', quantity: 10, unit: 'kg', price_per_unit: 300 },
  ];
  const po2Total = po2Items.reduce((t, i) => t + i.quantity * i.price_per_unit, 0);

  await supabaseAdmin.from('procurement_orders').insert([
    { owner_id: ownerId, supplier_id: supp![0].id, supplier_name: supp![0].name, items: po1Items, total_amount: po1Total, status: 'Pending', order_date: new Date().toISOString() },
    { owner_id: ownerId, supplier_id: supp![2].id, supplier_name: supp![2].name, items: po2Items, total_amount: po2Total, status: 'Ordered', order_date: new Date().toISOString() },
  ]);
}

async function createKitchenRequests(ownerId: string) {
  const { data: inv } = await supabaseAdmin.from('inventory_items').select('id, name, unit, quantity').eq('owner_id', ownerId);
  if (!inv || inv.length === 0) return;
  const pick = (name: string) => inv.find((i: any) => i.name === name);
  const now = new Date();
  const requests: any[] = [
    {
      owner_id: ownerId,
      items: [
        { inventory_item_id: pick('Basmati Rice')?.id, item_name: 'Basmati Rice', quantity: 10, unit: 'kg' },
        { inventory_item_id: pick('Spice Mix')?.id, item_name: 'Spice Mix', quantity: 2, unit: 'kg' },
      ],
      status: 'Pending',
      request_date: now.toISOString(),
      requesting_staff_id: 'chef1',
      requesting_staff_name: 'Arjun Chef',
    },
  ];
  await supabaseAdmin.from('kitchen_requests').insert(requests);
}

async function createProductionLogs(ownerId: string) {
  const { data: items } = await supabaseAdmin.from('menu_items').select('id, name').eq('owner_id', ownerId);
  const item = items?.find((i: any) => i.name === 'Chicken Biryani') || items?.[0];
  if (!item) return;
  await supabaseAdmin.from('production_logs').insert([
    { owner_id: ownerId, chef_id: 'chef1', chef_name: 'Arjun Chef', menu_item_id: item.id, menu_item_name: item.name, variant_name: 'Half', quantity_produced: 30, production_date: new Date().toISOString(), cost_of_production: 4200 },
  ]);
}

function randBetween(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function main() {
  const { ownerId } = await createOwner();
  const branches = await createBranches(ownerId);
  for (const b of branches) {
    const cats = await createCategories(ownerId, b.id);
    await createMenu(ownerId, b.id, cats);
    await createTables(ownerId, b.id);
    await createSampleOrders(ownerId, b.id);
  }
  await createStaff(ownerId, branches as any);
  await createInventory(ownerId);
  await createSuppliersAndProcurement(ownerId);
  await createKitchenRequests(ownerId);
  await createProductionLogs(ownerId);
  console.log('Demo data seeded. Login as tabil@tabill.com / veltron2025');
}

if (typeof window === 'undefined') {
  main().catch(err => { console.error(err); process.exit(1); });
}
