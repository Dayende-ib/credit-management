'use server'

import { createServiceClient } from '@/lib/supabase/service'
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

  const supabase = createServiceClient()

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

export async function rejectDocumentAction(
  documentId: string,
  applicationId: string,
  reason: string
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireBankUser()
  const supabase = createServiceClient()

  // Mark document as rejected
  const { error: docError } = await supabase
    .from('loan_documents')
    .update({ status: 'rejected', reject_reason: reason || null })
    .eq('id', documentId)

  if (docError) return { error: docError.message }

  // Change application status to additional_docs_required only if not already set
  const { data: app } = await supabase
    .from('loan_applications')
    .select('status, client_id, application_number')
    .eq('id', applicationId)
    .single()

  if (app && app.status !== 'additional_docs_required') {
    await supabase
      .from('loan_applications')
      .update({ status: 'additional_docs_required' })
      .eq('id', applicationId)

    await supabase.from('application_status_history').insert({
      application_id: applicationId,
      status: 'additional_docs_required',
      changed_by: session.id,
      note: '[KYC_REJECT] Documents KYC rejetés — re-soumission requise',
    })

    await supabase.from('notifications').insert({
      user_id: app.client_id,
      title: 'Documents à re-soumettre',
      message: `Un ou plusieurs documents KYC de votre dossier ${app.application_number} ont été rejetés. Veuillez les soumettre à nouveau.`,
    })
  }

  revalidatePath(`/bank/applications/${applicationId}`)
  return { success: true }
}

export async function approveDocumentAction(
  documentId: string,
  applicationId: string
): Promise<{ error?: string; success?: boolean }> {
  await requireBankUser()
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('loan_documents')
    .update({ status: 'approved', reject_reason: null })
    .eq('id', documentId)

  if (error) return { error: error.message }

  revalidatePath(`/bank/applications/${applicationId}`)
  return { success: true }
}

export async function requestMoreDocsAction(applicationId: string, note: string) {
  // [COMPLEMENT] prefix distinguishes "new document" requests from KYC rejections
  const markedNote = `[COMPLEMENT] ${note || 'Nouveau document complémentaire requis'}`
  return changeStatus(applicationId, 'additional_docs_required', markedNote, ['agent', 'supervisor', 'admin'])
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

  const supabase = createServiceClient()
  const { error } = await supabase.from('application_comments').insert({
    application_id: applicationId,
    author_id: session.id,
    content: parsed.data.content,
  })

  if (error) return { error: 'Erreur ajout commentaire' }

  revalidatePath(`/bank/applications/${applicationId}`)
  return { success: true }
}
