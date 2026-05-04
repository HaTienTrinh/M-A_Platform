import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { getAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const { error, supabase } = await requireRole(['admin']);
  if (error || !supabase) return error;

  const { data: users, error: dbError } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ users });
}

export async function PATCH(req: NextRequest) {
  const { error, supabase } = await requireRole(['admin']);
  if (error || !supabase) return error;

  try {
    const { id, role, kyc_status } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updates: any = {};
    if (role !== undefined) updates.role = role;
    if (kyc_status !== undefined) updates.kyc_status = kyc_status;

    const { data: user, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
