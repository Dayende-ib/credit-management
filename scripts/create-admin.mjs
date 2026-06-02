// Run once to create the first admin user:
// node scripts/create-admin.mjs

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const admin = {
  full_name: 'Administrateur',
  email: 'admin@creditpro.com',
  password: 'Admin@1234',   // ← changez ce mot de passe
  role: 'admin',
}

const password_hash = await bcrypt.hash(admin.password, 12)

const { data, error } = await supabase
  .from('internal_users')
  .insert({ ...admin, password: undefined, password_hash })
  .select('id, email, role')
  .single()

if (error) {
  console.error('Erreur :', error.message)
} else {
  console.log('✓ Admin créé :', data)
}
