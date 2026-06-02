import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getBankSession, type BankSessionPayload } from './bank-session'
import { redirect } from 'next/navigation'

export const verifyClientSession = cache(async () => {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return user
})

export const verifyBankSession = cache(async (): Promise<BankSessionPayload> => {
  const session = await getBankSession()

  if (!session) {
    redirect('/bank/login')
  }

  return session
})

export const requireRole = cache(async (...roles: BankSessionPayload['role'][]) => {
  const session = await verifyBankSession()

  if (!roles.includes(session.role)) {
    redirect('/bank/dashboard')
  }

  return session
})
