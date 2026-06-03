'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { setBankSession, deleteBankSession } from '@/lib/auth/bank-session'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export type BankLoginState = {
  errors?: Record<string, string[]>
  message?: string
}

export async function bankLoginAction(prevState: BankLoginState, formData: FormData): Promise<BankLoginState> {
  const raw = Object.fromEntries(formData)
  const parsed = loginSchema.safeParse(raw)

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { email, password } = parsed.data

  const supabase = createServiceClient()
  const { data: user, error } = await supabase
    .from('internal_users')
    .select('*')
    .eq('email', email)
    .eq('is_active', true)
    .single()

  if (error || !user) {
    return { message: 'Email ou mot de passe incorrect' }
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return { message: 'Email ou mot de passe incorrect' }
  }

  await setBankSession({
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
  })

  redirect('/bank/dashboard')
}

export async function bankLogoutAction() {
  await deleteBankSession()
  redirect('/bank/login')
}
