import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const { error, supabase } = await requireRole(['admin']);
  if (error || !supabase) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let query = supabase.from('deals').select(`
    *,
    seller:seller_id (id, full_name, email, company_name)
  `).order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data: deals, error: dbError } = await query;

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ deals });
}

export async function PATCH(req: NextRequest) {
  const { error, supabase } = await requireRole(['admin']);
  if (error || !supabase) return error;

  try {
    const { id, status, flagged } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 });
    }

    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (flagged !== undefined) updates.flagged = flagged;
    updates.updated_at = new Date().toISOString();

    const { data: deal, error: updateError } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, deal });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
