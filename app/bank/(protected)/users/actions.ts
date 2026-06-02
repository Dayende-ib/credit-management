'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { getBankSession } from '@/lib/auth/bank-session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

async function requireAdmin() {
  const session = await getBankSession()
  if (!session || session.role !== 'admin') redirect('/bank/dashboard')
  return session
}

const addUserSchema = z.object({
  full_name: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
  role: z.enum(['agent', 'supervisor', 'admin']),
})

export type AddUserState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
}

export async function addUserAction(prevState: AddUserState, formData: FormData): Promise<AddUserState> {
  await requireAdmin()

  const raw = Object.fromEntries(formData)
  const parsed = addUserSchema.safeParse(raw)

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { full_name, email, password, role } = parsed.data
  const password_hash = await bcrypt.hash(password, 12)

  const supabase = await createServiceClient()
  const { error } = await supabase.from('internal_users').insert({
    full_name,
    email,
    password_hash,
    role,
  })

  if (error) {
    if (error.code === '23505') return { message: 'Cet email est déjà utilisé' }
    return { message: 'Erreur création utilisateur' }
  }

  revalidatePath('/bank/users')
  return { success: true }
}
