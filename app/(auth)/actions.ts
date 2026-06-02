'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const registerSchema = z.object({
  full_name: z.string().min(2, 'Nom requis (min 2 caractères)'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(8, 'Téléphone invalide'),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
})

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export type AuthState = {
  errors?: Record<string, string[]>
  message?: string
}

export async function registerAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const raw = Object.fromEntries(formData)
  const parsed = registerSchema.safeParse(raw)

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { full_name, email, phone, password } = parsed.data

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { message: error.message }
  }

  if (data.user) {
    const service = await createServiceClient()
    await service.from('profiles').insert({
      id: data.user.id,
      full_name,
      email,
      phone,
    })
  }

  redirect('/client/dashboard')
}

export async function loginAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const raw = Object.fromEntries(formData)
  const parsed = loginSchema.safeParse(raw)

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { email, password } = parsed.data
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { message: 'Veuillez confirmer votre email avant de vous connecter.' }
    }
    return { message: 'Email ou mot de passe incorrect' }
  }

  redirect('/client/dashboard')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
