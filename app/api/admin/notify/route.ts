import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/lib/notifications';
import { requireRole } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    const { error: authError, user, supabase } = await requireRole(['admin']);
    if (authError || !user || !supabase) return authError;

    const body = await req.json();
    const { userId, type, title, body: msgBody, emailData } = body;

    await createNotification({
      userId,
      type,
      title,
      body: msgBody,
      emailData
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin Notify Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
