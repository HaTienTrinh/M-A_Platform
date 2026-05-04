import { createSupabaseServer } from '@/lib/supabase/server';
import { sendEmailNotification, type EmailType } from '@/lib/email';

export async function createNotification(params: {
  userId: string;
  type: EmailType;
  title: string;
  body: string;
  dealId?: string;
  emailData?: any;
}) {
  const supabase = await createSupabaseServer();

  // Insert notification into DB
  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    deal_id: params.dealId || null,
  });

  if (error) {
    console.error('Failed to create notification in DB:', error);
  }

  // Get user email
  const { data: user } = await supabase.from('users').select('email').eq('id', params.userId).single();
  
  if (user && user.email) {
    // Send email
    await sendEmailNotification(user.email, params.type, params.emailData || {});
  }
}
