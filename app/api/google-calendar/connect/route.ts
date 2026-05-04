// /app/api/google-calendar/connect/route.ts
import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google-calendar';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const origin = request.headers.get('origin') || process.env.APP_URL;
  
  // Use origin to construct the correct redirect URI
  const redirectUri = `${origin}/api/google-calendar/callback`;
  
  const url = getAuthUrl(redirectUri);

  return NextResponse.json({ url });
}
