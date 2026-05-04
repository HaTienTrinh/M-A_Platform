import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function run() {
  const { data: users, error } = await supabase.auth.admin.listUsers()
  if (error) {
     console.log('Error listing users via admin:', error.message)
     // fallback to normal users select
     const { data: pubUsers, error: pubErr } = await supabase.from('users').select('*')
     console.log('Public users table:', pubUsers, pubErr)
  } else {
     console.log('Auth users:', users.users)
     const { data: pubUsers } = await supabase.from('users').select('*')
     console.log('Public users table:', pubUsers)
  }
}
run()
