import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { id, email, fullName, role } = await request.json();
    const adminClient = getAdminClient();

    const mappedRole = role === 'Seller / Business Owner' ? 'seller' : (role === 'M&A Advisor' ? 'advisor' : role);

    const { error: profileError } = await adminClient
      .from('users')
      .insert({
        id,
        email,
        full_name: fullName,
        role: ['buyer', 'seller', 'advisor', 'admin'].includes(mappedRole) ? mappedRole : 'buyer',
        kyc_status: 'pending',
        created_at: new Date().toISOString(),
      });

    if (profileError) {
      return NextResponse.json(
        { error: 'Database error saving new user: ' + profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
