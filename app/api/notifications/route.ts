import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/lib/notifications';
import { requireAuth } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    const { error: authError, user, supabase } = await requireAuth();
    if (authError || !user || !supabase) return authError;

    const body = await req.json();
    const { userId, type, title, body: msgBody, emailData, dealId } = body;

    // Optional validation logic here to ensure user can send to userId
    // E.g. they are in the same deal.

    await createNotification({
      userId,
      type,
      title,
      body: msgBody,
      dealId,
      emailData
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Notify Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
