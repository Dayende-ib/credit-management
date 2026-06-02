import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const documentType = formData.get('documentType') as string | null
  const applicationId = formData.get('applicationId') as string | null

  if (!file || !documentType || !applicationId) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  // Verify the application belongs to the user (uses authenticated client → RLS checks pass)
  const { data: app } = await supabase
    .from('loan_applications')
    .select('id')
    .eq('id', applicationId)
    .eq('client_id', user.id)
    .single()

  if (!app) {
    return NextResponse.json({ error: 'Dossier introuvable' }, { status: 403 })
  }

  const fileExt = file.name.split('.').pop() ?? 'bin'
  const storagePath = `${user.id}/${applicationId}/${documentType}.${fileExt}`
  const arrayBuffer = await file.arrayBuffer()

  // Storage upload - requires service role key OR storage policies for authenticated users
  const service = await createServiceClient()
  const { error: uploadError } = await service.storage
    .from('kyc-documents')
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = service.storage
    .from('kyc-documents')
    .getPublicUrl(storagePath)

  // DB insert - delete existing doc of same type then insert fresh
  await supabase
    .from('loan_documents')
    .delete()
    .eq('application_id', applicationId)
    .eq('document_type', documentType)

  const { error: dbError } = await supabase
    .from('loan_documents')
    .insert({
      application_id: applicationId,
      document_type: documentType,
      file_url: publicUrl,
      file_name: file.name,
    })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ url: publicUrl })
}
