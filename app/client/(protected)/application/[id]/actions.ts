'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function resubmitDocumentsAction(applicationId: string): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const service = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Verify ownership and correct status
  const { data: app } = await supabase
    .from('loan_applications')
    .select('id, status, application_number, client_id')
    .eq('id', applicationId)
    .eq('client_id', user.id)
    .single()

  if (!app) return { error: 'Dossier introuvable' }
  if (app.status !== 'additional_docs_required') return { error: 'Action non autorisée' }

  // Revert to KYC verification so the agent re-checks
  const { error } = await supabase
    .from('loan_applications')
    .update({ status: 'kyc_verification' })
    .eq('id', applicationId)

  if (error) return { error: error.message }

  await service.from('application_status_history').insert({
    application_id: applicationId,
    status: 'kyc_verification',
    note: 'Documents complémentaires soumis par le client',
  })

  await service.from('notifications').insert({
    user_id: user.id,
    title: 'Documents envoyés',
    message: `Vos documents complémentaires pour le dossier ${app.application_number} ont bien été transmis. Nous procédons à la vérification.`,
  })

  // Revalidate both client and bank pages so both see the updated status
  revalidatePath(`/client/application/${applicationId}`)
  revalidatePath(`/bank/applications/${applicationId}`)
  revalidatePath('/bank/applications')
  return { success: true }
}
