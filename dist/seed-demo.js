var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var createClient = require('@supabase/supabase-js').createClient;
var dotenv = require('dotenv');
// Load environment variables
dotenv.config();
var supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
var serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
var supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
});
function createOwner() {
    return __awaiter(this, void 0, void 0, function () {
        var email, password, existingUser, exists, authUser, _a, data, error, ownerProfile, _b, userRow, upErr;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    email = 'tabil@tabill.com';
                    password = 'veltron2025';
                    return [4 /*yield*/, supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 })];
                case 1:
                    existingUser = (_c.sent()).data;
                    exists = existingUser.users.find(function (u) { return u.email === email; });
                    authUser = exists;
                    if (!!authUser) return [3 /*break*/, 3];
                    return [4 /*yield*/, supabaseAdmin.auth.admin.createUser({
                            email: email,
                            password: password,
                            email_confirm: true,
                            user_metadata: { demo: true, name: 'Tabill Demo' }
                        })];
                case 2:
                    _a = _c.sent(), data = _a.data, error = _a.error;
                    if (error)
                        throw error;
                    authUser = data.user;
                    _c.label = 3;
                case 3:
                    ownerProfile = {
                        uid: authUser.id,
                        email: email,
                        name: 'Tabill Demo',
                        restaurant_name: 'Veltron Biryani House',
                        restaurant_address: 'HSR Layout, Bengaluru',
                        profile_complete: true,
                        subscription_status: 'active',
                        subscription_plan: 'PRO',
                        base_branch_limit: 1,
                        extra_branches: 2
                    };
                    return [4 /*yield*/, supabaseAdmin
                            .from('users')
                            .upsert(ownerProfile, { onConflict: 'uid' })
                            .select('id')
                            .single()];
                case 4:
                    _b = _c.sent(), userRow = _b.data, upErr = _b.error;
                    if (upErr)
                        throw upErr;
                    return [2 /*return*/, { ownerId: userRow.id, authUid: authUser.id }];
            }
        });
    });
}
function createBranches(ownerId) {
    return __awaiter(this, void 0, void 0, function () {
        var branches, _a, data, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    branches = [
                        { owner_id: ownerId, name: 'HSR Layout', address: 'HSR, BLR', status: 'Active' },
                        { owner_id: ownerId, name: 'Koramangala', address: 'Koramangala, BLR', status: 'Active' },
                        { owner_id: ownerId, name: 'Whitefield', address: 'Whitefield, BLR', status: 'Inactive' },
                    ];
                    return [4 /*yield*/, supabaseAdmin
                            .from('branches')
                            .upsert(branches)
                            .select('id, name')
                            .throwOnError()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error)
                        throw error;
                    return [2 /*return*/, data];
            }
        });
    });
}
function createCategories(ownerId, branchId) {
    return __awaiter(this, void 0, void 0, function () {
        var rows, _a, data, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    rows = [
                        { owner_id: ownerId, branch_id: branchId, name: 'Starters', category: 'Food' },
                        { owner_id: ownerId, branch_id: branchId, name: 'Main Course', category: 'Food' },
                        { owner_id: ownerId, branch_id: branchId, name: 'Breads', category: 'Food' },
                        { owner_id: ownerId, branch_id: branchId, name: 'Biryani', category: 'Food' },
                        { owner_id: ownerId, branch_id: branchId, name: 'Beverages', category: 'Drink' },
                    ];
                    return [4 /*yield*/, supabaseAdmin
                            .from('categories')
                            .upsert(rows)
                            .select('id, name')
                            .throwOnError()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error)
                        throw error;
                    return [2 /*return*/, data];
            }
        });
    });
}
function createMenu(ownerId, branchId, cats) {
    return __awaiter(this, void 0, void 0, function () {
        var catByName, items, _a, data, error, variants, _i, _b, it;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    catByName = Object.fromEntries(cats.map(function (c) { return [c.name, c.id]; }));
                    items = [
                        { owner_id: ownerId, branch_id: branchId, category_id: catByName['Biryani'], name: 'Chicken Biryani', category: 'Food', base_price: 250 },
                        { owner_id: ownerId, branch_id: branchId, category_id: catByName['Biryani'], name: 'Mutton Biryani', category: 'Food', base_price: 320 },
                        { owner_id: ownerId, branch_id: branchId, category_id: catByName['Main Course'], name: 'Butter Chicken', category: 'Food', base_price: 280 },
                        { owner_id: ownerId, branch_id: branchId, category_id: catByName['Starters'], name: 'Chicken 65', category: 'Food', base_price: 220 },
                        { owner_id: ownerId, branch_id: branchId, category_id: catByName['Beverages'], name: 'Masala Soda', category: 'Drink', base_price: 60 },
                    ];
                    return [4 /*yield*/, supabaseAdmin
                            .from('menu_items')
                            .upsert(items)
                            .select('id, name')
                            .throwOnError()];
                case 1:
                    _a = _c.sent(), data = _a.data, error = _a.error;
                    if (error)
                        throw error;
                    variants = [];
                    for (_i = 0, _b = data; _i < _b.length; _i++) {
                        it = _b[_i];
                        if (it.name.includes('Biryani')) {
                            variants.push({ owner_id: ownerId, branch_id: branchId, menu_item_id: it.id, name: 'Half', price_modifier: 0, cost_price: 140, selling_price: 250 }, { owner_id: ownerId, branch_id: branchId, menu_item_id: it.id, name: 'Full', price_modifier: 100, cost_price: 220, selling_price: 350 });
                        }
                        else {
                            variants.push({ owner_id: ownerId, branch_id: branchId, menu_item_id: it.id, name: 'Regular', price_modifier: 0, cost_price: 120, selling_price: 200 });
                        }
                    }
                    return [4 /*yield*/, supabaseAdmin.from('menu_item_variants').upsert(variants).throwOnError()];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function createTables(ownerId, branchId) {
    return __awaiter(this, void 0, void 0, function () {
        var t;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    t = Array.from({ length: 12 }).map(function (_, i) { return ({
                        owner_id: ownerId,
                        branch_id: branchId,
                        name: "T".concat(i + 1),
                        capacity: i % 2 === 0 ? 2 : 4,
                        status: 'Available'
                    }); });
                    return [4 /*yield*/, supabaseAdmin.from('tables').upsert(t).throwOnError()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function randBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function createSampleOrders(ownerId, branchId) {
    return __awaiter(this, void 0, void 0, function () {
        var items, variants, days, d, day, ordersPerDay, k, tableId, orderDate, payment_method, _a, ord, oErr, lines, total, sgst, cgst, orderItems, i, v, qty, unit, lineTotal;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, supabaseAdmin.from('menu_items').select('id, name').eq('owner_id', ownerId).eq('branch_id', branchId)];
                case 1:
                    items = (_b.sent()).data;
                    return [4 /*yield*/, supabaseAdmin.from('menu_item_variants').select('id, menu_item_id, name, cost_price, selling_price').eq('owner_id', ownerId).eq('branch_id', branchId)];
                case 2:
                    variants = (_b.sent()).data;
                    if (!items || !variants)
                        return [2 /*return*/];
                    days = 30;
                    d = 0;
                    _b.label = 3;
                case 3:
                    if (!(d < days)) return [3 /*break*/, 10];
                    day = new Date();
                    day.setDate(day.getDate() - d);
                    ordersPerDay = randBetween(5, 20);
                    k = 0;
                    _b.label = 4;
                case 4:
                    if (!(k < ordersPerDay)) return [3 /*break*/, 9];
                    tableId = null;
                    orderDate = new Date(day.getTime() + randBetween(10, 20) * 60 * 1000);
                    payment_method = Math.random() < 0.5 ? 'Cash' : 'Card / UPI';
                    return [4 /*yield*/, supabaseAdmin
                            .from('orders')
                            .insert({
                            owner_id: ownerId,
                            branch_id: branchId,
                            table_id: tableId,
                            total_amount: 0,
                            tax_amount: 0,
                            discount_amount: 0,
                            payment_method: payment_method,
                            status: 'Completed',
                            created_at: orderDate.toISOString(),
                            order_number: "ORD-".concat(d, "-").concat(k)
                        })
                            .select('id')
                            .single()
                            .throwOnError()];
                case 5:
                    _a = _b.sent(), ord = _a.data, oErr = _a.error;
                    if (oErr)
                        throw oErr;
                    lines = randBetween(1, 4);
                    total = 0;
                    sgst = 0;
                    cgst = 0;
                    orderItems = [];
                    for (i = 0; i < lines; i++) {
                        v = variants[randBetween(0, variants.length - 1)];
                        qty = randBetween(1, 3);
                        unit = Number(v.selling_price) || 200;
                        lineTotal = unit * qty;
                        total += lineTotal;
                        orderItems.push({
                            owner_id: ownerId,
                            branch_id: branchId,
                            order_id: ord.id,
                            menu_item_id: v.menu_item_id,
                            menu_item_variant_id: v.id,
                            quantity: qty,
                            total_price: lineTotal
                        });
                    }
                    sgst = total * 0.09;
                    cgst = total * 0.09;
                    return [4 /*yield*/, supabaseAdmin.from('order_items').upsert(orderItems).throwOnError()];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, supabaseAdmin
                            .from('orders')
                            .update({
                            total_amount: total + sgst + cgst,
                            tax_amount: sgst + cgst,
                            created_at: orderDate.toISOString()
                        })
                            .eq('id', ord.id)
                            .throwOnError()];
                case 7:
                    _b.sent();
                    _b.label = 8;
                case 8:
                    k++;
                    return [3 /*break*/, 4];
                case 9:
                    d++;
                    return [3 /*break*/, 3];
                case 10: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var ownerId, branches, _i, branches_1, b, cats;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, createOwner()];
                case 1:
                    ownerId = (_a.sent()).ownerId;
                    return [4 /*yield*/, createBranches(ownerId)];
                case 2:
                    branches = _a.sent();
                    _i = 0, branches_1 = branches;
                    _a.label = 3;
                case 3:
                    if (!(_i < branches_1.length)) return [3 /*break*/, 9];
                    b = branches_1[_i];
                    return [4 /*yield*/, createCategories(ownerId, b.id)];
                case 4:
                    cats = _a.sent();
                    return [4 /*yield*/, createMenu(ownerId, b.id, cats)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, createTables(ownerId, b.id)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, createSampleOrders(ownerId, b.id)];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 3];
                case 9:
                    console.log('Demo data seeded. Login as tabil@tabill.com / veltron2025');
                    return [2 /*return*/];
            }
        });
    });
}
// Run only in Node
if (typeof window === 'undefined') {
    main().catch(function (err) { console.error(err); process.exit(1); });
}
module.exports = { main: main };
