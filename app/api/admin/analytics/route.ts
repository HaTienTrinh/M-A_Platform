import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { getAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const { error, supabase } = await requireRole(['admin']);
  if (error || !supabase) return error;

  try {
    const adminClient = getAdminClient();

    // Fetch aggregate stats
    const [{ count: userCount }, { count: dealCount }, { count: activeDeals }] = await Promise.all([
      adminClient.from('users').select('*', { count: 'exact', head: true }),
      adminClient.from('deals').select('*', { count: 'exact', head: true }),
      adminClient.from('deals').select('*', { count: 'exact', head: true }).eq('status', 'active')
    ]);

    return NextResponse.json({
      analytics: {
        total_users: userCount || 0,
        total_deals: dealCount || 0,
        active_deals: activeDeals || 0,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
