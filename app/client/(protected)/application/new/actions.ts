'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

export type StepState = {
  errors?: Record<string, string[]>
  message?: string
  applicationId?: string
}

// Step 1: Personal info
const step1Schema = z.object({
  first_name: z.string().min(1, 'Prénom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  date_of_birth: z.string().min(1, 'Date de naissance requise'),
  gender: z.string().min(1, 'Sexe requis'),
  nationality: z.string().min(1, 'Nationalité requise'),
  phone: z.string().min(8, 'Téléphone invalide'),
  address: z.string().min(5, 'Adresse requise'),
})

// Step 2: Professional situation
const step2Schema = z.object({
  profession: z.string().min(1, 'Profession requise'),
  employer: z.string().optional(),
  seniority_years: z.coerce.number().min(0),
  contract_type: z.string().min(1, 'Type de contrat requis'),
})

// Step 3: Financial situation
const step3Schema = z.object({
  monthly_income: z.coerce.number().positive('Revenu invalide'),
  monthly_expenses: z.coerce.number().min(0, 'Valeur invalide'),
  other_credits: z.coerce.number().min(0, 'Valeur invalide'),
})

// Step 4: Loan request
const step4Schema = z.object({
  loan_type: z.string().min(1, 'Type de crédit requis'),
  amount: z.coerce.number().positive('Montant invalide'),
  duration_months: z.coerce.number().int().min(1).max(360),
  purpose: z.string().min(10, "Décrivez l'objet du prêt (min 10 caractères)"),
})

export async function saveStep1(prevState: StepState, formData: FormData): Promise<StepState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Non authentifié' }

  const raw = Object.fromEntries(formData)
  const parsed = step1Schema.safeParse(raw)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const { first_name, last_name, ...rest } = parsed.data
  const full_name = `${first_name} ${last_name}`

  // Update profile
  await supabase.from('profiles').update({
    full_name,
    phone: rest.phone,
    date_of_birth: rest.date_of_birth,
    gender: rest.gender,
    nationality: rest.nationality,
    address: rest.address,
  }).eq('id', user.id)

  // Create or fetch draft application
  let appId = formData.get('application_id') as string | null

  if (!appId) {
    const { data: app, error } = await supabase
      .from('loan_applications')
      .insert({ client_id: user.id })
      .select('id')
      .single()

    if (error || !app) return { message: 'Erreur création dossier' }
    appId = app.id
  }

  revalidatePath('/client/application/new')
  redirect(`/client/application/new?step=2&id=${appId}`)
}

export async function saveStep2(prevState: StepState, formData: FormData): Promise<StepState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Non authentifié' }

  const raw = Object.fromEntries(formData)
  const parsed = step2Schema.safeParse(raw)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const appId = formData.get('application_id') as string

  await supabase.from('profiles').update({
    profession: parsed.data.profession,
    employer: parsed.data.employer ?? null,
    seniority_years: parsed.data.seniority_years,
    contract_type: parsed.data.contract_type as never,
  }).eq('id', user.id)

  redirect(`/client/application/new?step=3&id=${appId}`)
}

export async function saveStep3(prevState: StepState, formData: FormData): Promise<StepState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Non authentifié' }

  const raw = Object.fromEntries(formData)
  const parsed = step3Schema.safeParse(raw)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const appId = formData.get('application_id') as string

  await supabase.from('profiles').update({
    monthly_income: parsed.data.monthly_income,
    monthly_expenses: parsed.data.monthly_expenses,
    other_credits: parsed.data.other_credits,
  }).eq('id', user.id)

  redirect(`/client/application/new?step=4&id=${appId}`)
}

export async function saveStep4(prevState: StepState, formData: FormData): Promise<StepState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Non authentifié' }

  const raw = Object.fromEntries(formData)
  const parsed = step4Schema.safeParse(raw)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const appId = formData.get('application_id') as string

  const { error } = await supabase.from('loan_applications').update({
    loan_type: parsed.data.loan_type as never,
    amount: parsed.data.amount,
    duration_months: parsed.data.duration_months,
    purpose: parsed.data.purpose,
  }).eq('id', appId).eq('client_id', user.id)

  if (error) return { message: 'Erreur mise à jour dossier' }

  redirect(`/client/application/new?step=5&id=${appId}`)
}

export async function proceedToConfirm(prevState: StepState, formData: FormData): Promise<StepState> {
  const appId = formData.get('application_id') as string
  redirect(`/client/application/new?step=6&id=${appId}`)
}

export async function submitApplication(prevState: StepState, formData: FormData): Promise<StepState> {
  const supabase = await createClient()
  const service = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Non authentifié' }

  const appId = formData.get('application_id') as string

  const { error } = await supabase.from('loan_applications').update({
    status: 'submitted',
    submitted_at: new Date().toISOString(),
  }).eq('id', appId).eq('client_id', user.id)

  if (error) return { message: `Erreur soumission dossier : ${error.message}` }

  // Create status history entry
  await service.from('application_status_history').insert({
    application_id: appId,
    status: 'submitted',
    note: 'Demande soumise par le client',
  })

  // Create notification
  await service.from('notifications').insert({
    user_id: user.id,
    title: 'Demande soumise',
    message: 'Votre demande de crédit a été soumise avec succès. Nous allons analyser votre dossier.',
  })

  revalidatePath('/client/dashboard')
  redirect('/client/dashboard')
}
