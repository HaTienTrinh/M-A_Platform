import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

function getEnv(path) {
  const content = fs.readFileSync(path, 'utf8')
  const env = {}
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/)
    if (match) {
      let key = match[1]
      let value = match[2] || ''
      if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1)
      } else if (value.length > 0 && value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1)
      }
      env[key] = value
    }
  })
  return env
}

const env = getEnv('.env')
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: users, error } = await supabase.from('users').select('id, email, role, kyc_status').limit(10)
  if (error) {
    console.error('Error fetching users:', error)
    return
  }
  console.log('USERS_DATA_JSON_START')
  console.log(JSON.stringify(users, null, 2))
  console.log('USERS_DATA_JSON_END')
}

run()
