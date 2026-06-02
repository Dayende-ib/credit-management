import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBankSession } from '@/lib/auth/bank-session'

export default async function HomePage() {
  const [supabase, bankSession] = await Promise.all([
    createClient(),
    getBankSession(),
  ])

  if (bankSession) {
    redirect('/bank/dashboard')
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/client/dashboard')
  }

  redirect('/login')
}
