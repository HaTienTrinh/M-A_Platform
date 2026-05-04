import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { email, password, fullName, role } = await request.json();
    const adminClient = getAdminClient();

    // 1. Create auth user using admin client so it doesn't log them in automatically if we don't want to,
    // or we can use regular signup. But we need to handle the trigger failure if it exists.
    // Wait, if the trigger is failing, we can create the user and bypass the trigger? No.
    // Let's just create the user.
    const { data: authData, error: signUpError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role,
      }
    });

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    const authUser = authData.user;
    if (!authUser) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // 2. Insert into public.users
    const mappedRole = role === 'Seller / Business Owner' ? 'seller' : (role === 'M&A Advisor' ? 'advisor' : 'buyer');

    const { error: profileError } = await adminClient
      .from('users')
      .insert({
        id: authUser.id,
        email: authUser.email,
        full_name: fullName,
        role: ['buyer', 'seller', 'advisor', 'admin'].includes(role) ? role : mappedRole,
        kyc_status: 'pending',
        created_at: new Date().toISOString(),
      });

    if (profileError) {
      // Rollback: delete the auth user if profile insert fails
      await adminClient.auth.admin.deleteUser(authUser.id);
      return NextResponse.json(
        { error: 'Database error saving new user: ' + profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, user: authUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
