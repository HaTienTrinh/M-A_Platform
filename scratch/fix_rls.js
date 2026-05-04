const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function applyRLS() {
  const sql = `
    -- Users Policies
    DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
    CREATE POLICY "Users can read own profile" ON public.users
      FOR SELECT USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    CREATE POLICY "Users can update own profile" ON public.users
      FOR UPDATE USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Admins can do everything on users" ON public.users;
    CREATE POLICY "Admins can do everything on users" ON public.users
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
      );

    -- KYC Submissions Policies
    DROP POLICY IF EXISTS "Users can view own submissions" ON public.kyc_submissions;
    CREATE POLICY "Users can view own submissions" ON public.kyc_submissions
      FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can insert own submissions" ON public.kyc_submissions;
    CREATE POLICY "Users can insert own submissions" ON public.kyc_submissions
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Admins can view all submissions" ON public.kyc_submissions;
    CREATE POLICY "Admins can view all submissions" ON public.kyc_submissions
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
      );

    DROP POLICY IF EXISTS "Admins can update submissions" ON public.kyc_submissions;
    CREATE POLICY "Admins can update submissions" ON public.kyc_submissions
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
      );
  `;

  console.log('Applying RLS policies...');
  
  // Since we can't run raw SQL easily via the JS client without a custom function,
  // we'll try to use the 'rpc' method if a 'exec_sql' function exists, 
  // or just explain that this needs to be run.
  // Actually, I'll check if I can use a different approach.
  
  console.log('Note: Raw SQL execution via JS client requires a helper function.');
  console.log('Please run the following SQL in your Supabase SQL Editor:');
  console.log(sql);
}

applyRLS();
