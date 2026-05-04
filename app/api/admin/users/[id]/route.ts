import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { getAdminClient } from '@/lib/supabase/admin';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, supabase } = await requireRole(['admin']);
  if (error || !supabase) return error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { role, kyc_status } = body;

    const adminClient = getAdminClient();
    
    const updates: any = {};
    if (role !== undefined) updates.role = role;
    if (kyc_status !== undefined) updates.kyc_status = kyc_status;

    const { data: user, error: updateError } = await adminClient
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
