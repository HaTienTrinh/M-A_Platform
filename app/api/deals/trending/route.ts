// /app/api/deals/trending/route.ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

export async function GET() {
  try {
    const { error: authError, supabase } = await requireAuth();
    if (authError || !supabase) return authError;
    
    // Trigger recalculation (in a real app this would be hourly via cron, 
    // but here we ensure data is fresh)
    await supabase.rpc('recalculate_trending_scores');

    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('status', 'active')
      .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('trending_score', { ascending: false })
      .limit(6);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Trending fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
