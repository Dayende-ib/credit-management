'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { getBankSession } from '@/lib/auth/bank-session'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { ApplicationStatus } from '@/lib/types'

async function requireBankUser() {
  const session = await getBankSession()
  if (!session) redirect('/bank/login')
  return session
}

async function changeStatus(
  applicationId: string,
  newStatus: ApplicationStatus,
  note: string,
  requiredRoles?: ('agent' | 'supervisor' | 'admin')[]
) {
  const session = await requireBankUser()

  if (requiredRoles && !requiredRoles.includes(session.role)) {
    return { error: "Vous n'avez pas les droits pour cette action" }
  }

  const supabase = await createServiceClient()

  const { error } = await supabase
    .from('loan_applications')
    .update({ status: newStatus })
    .eq('id', applicationId)

  if (error) return { error: 'Erreur mise à jour statut' }

  await supabase.from('application_status_history').insert({
    application_id: applicationId,
    status: newStatus,
    changed_by: session.id,
    note,
  })

  const { data: app } = await supabase
    .from('loan_applications')
    .select('client_id, application_number')
    .eq('id', applicationId)
    .single()

  if (app) {
    const statusMessages: Partial<Record<ApplicationStatus, { title: string; message: string }>> = {
      kyc_verification: {
        title: 'Vérification KYC en cours',
        message: `Votre dossier ${app.application_number} est en cours de vérification des documents.`,
      },
      analysis: {
        title: 'Dossier en analyse',
        message: `Votre dossier ${app.application_number} est maintenant en cours d'analyse.`,
      },
      additional_docs_required: {
        title: 'Documents supplémentaires requis',
        message: `Des documents supplémentaires sont nécessaires pour votre dossier ${app.application_number}.`,
      },
      approved: {
        title: 'Demande approuvée !',
        message: `Félicitations ! Votre demande ${app.application_number} a été approuvée.`,
      },
      rejected: {
        title: 'Demande rejetée',
        message: `Votre demande ${app.application_number} n'a pas pu être approuvée. Contactez un conseiller.`,
      },
    }

    const notif = statusMessages[newStatus]
    if (notif) {
      await supabase.from('notifications').insert({
        user_id: app.client_id,
        title: notif.title,
        message: notif.message,
      })
    }
  }

  revalidatePath(`/bank/applications/${applicationId}`)
  return { success: true }
}

export async function validateKYCAction(applicationId: string) {
  return changeStatus(applicationId, 'kyc_verification', 'Documents KYC validés', ['agent', 'supervisor', 'admin'])
}

export async function requestMoreDocsAction(applicationId: string, note: string) {
  return changeStatus(applicationId, 'additional_docs_required', note || 'Documents complémentaires requis', ['agent', 'supervisor', 'admin'])
}

export async function setInAnalysisAction(applicationId: string) {
  return changeStatus(applicationId, 'analysis', 'Dossier passé en analyse', ['agent', 'supervisor', 'admin'])
}

export async function approveAction(applicationId: string, note: string) {
  return changeStatus(applicationId, 'approved', note || 'Demande approuvée', ['supervisor', 'admin'])
}

export async function rejectAction(applicationId: string, note: string) {
  return changeStatus(applicationId, 'rejected', note || 'Demande rejetée', ['supervisor', 'admin'])
}

const commentSchema = z.object({
  content: z.string().min(1, 'Commentaire requis'),
})

export type CommentState = { error?: string; success?: boolean }

export async function addCommentAction(
  applicationId: string,
  prevState: CommentState,
  formData: FormData
): Promise<CommentState> {
  const session = await requireBankUser()
  const parsed = commentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors.content?.[0] }

  const supabase = await createServiceClient()
  const { error } = await supabase.from('application_comments').insert({
    application_id: applicationId,
    author_id: session.id,
    content: parsed.data.content,
  })

  if (error) return { error: 'Erreur ajout commentaire' }

  revalidatePath(`/bank/applications/${applicationId}`)
  return { success: true }
}
