import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ownerId, branchId, name, username, password, role, modules } = body || {};

    // Validate input
    const validationErrors: string[] = [];
    if (!ownerId) validationErrors.push('Owner ID is required');
    if (!username) validationErrors.push('Username is required');
    if (!password) validationErrors.push('Password is required');
    if (!name) validationErrors.push('Name is required');
    if (!role) validationErrors.push('Role is required');
    if (!branchId) validationErrors.push('Branch ID is required');

    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, { status: 400 });
    }

    // Validate username format (allow email-like usernames)
    const usernameRegex = /^[a-zA-Z0-9._-]+$/;
    const processedUsername = username.includes('@') 
      ? username.split('@')[0] 
      : username;

    if (!usernameRegex.test(processedUsername)) {
      return NextResponse.json({ 
        error: 'Invalid username', 
        details: 'Username can only contain letters, numbers, dots, underscores, and hyphens' 
      }, { status: 400 });
    }

    const email = username.includes('@') 
      ? username 
      : `${processedUsername}@tabill.com`; 

    // 0) Validate branch ownership
    const { data: branch, error: brErr } = await (supabaseAdmin as any)
      .from('branches')
      .select('id, owner_id')
      .eq('id', branchId)
      .eq('owner_id', ownerId)
      .maybeSingle();
    if (brErr) {
      return NextResponse.json({ error: 'Branch validation failed', details: brErr.message }, { status: 400 });
    }
    if (!branch) {
      return NextResponse.json({ error: 'Invalid branch', details: 'Branch not found or not owned by this owner' }, { status: 400 });
    }

    // 1) Create auth user
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { staff: true, username: processedUsername },
    });

    if (createErr || !created.user) {
      console.error('Staff creation auth error:', createErr);
      return NextResponse.json({ 
        error: 'Failed to create auth user', 
        details: createErr?.message || 'Unknown auth creation error' 
      }, { status: 500 });
    }

    const authUid = created.user.id;

    // 2) Insert staff row
    const { error: insertErr } = await supabaseAdmin
      .from('staff_members')
      .insert({ 
        owner_id: ownerId, 
        branch_id: branchId,
        name, 
        email, 
        role, 
        modules: modules || [], 
        username: processedUsername, 
        auth_uid: authUid 
      });

    if (insertErr) {
      console.error('Staff creation database error:', insertErr);
      // best-effort cleanup: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authUid).catch(() => {});
      return NextResponse.json({ 
        error: 'Failed to create staff member', 
        details: insertErr.message 
      }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Staff member created successfully' });
  } catch (e: any) {
    console.error('Unexpected staff creation error:', e);
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: e?.message || 'Unknown error occurred' 
    }, { status: 500 });
  }
}
