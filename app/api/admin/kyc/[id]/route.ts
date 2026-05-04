import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { getAdminClient } from '@/lib/supabase/admin';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, supabase } = await requireRole(['admin']);
  if (error || !supabase) return error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, reviewer_notes } = body;

    const adminClient = getAdminClient();

    const updates: any = { updated_at: new Date().toISOString() };
    if (status !== undefined) updates.status = status;
    if (reviewer_notes !== undefined) updates.reviewer_notes = reviewer_notes;

    // Use adminClient to bypass RLS if needed, or regular client.
    const { data: kyc, error: updateError } = await adminClient
      .from('kyc_submissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // If approved, update user's kyc_status
    if (status === 'approved') {
      await adminClient.from('users').update({ kyc_status: 'verified' }).eq('id', kyc.user_id);
    } else if (status === 'rejected') {
      await adminClient.from('users').update({ kyc_status: 'rejected' }).eq('id', kyc.user_id);
    }

    return NextResponse.json({ success: true, kyc });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
