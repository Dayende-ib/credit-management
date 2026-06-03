import { NextRequest, NextResponse } from 'next/server'
import { getBankSession } from '@/lib/auth/bank-session'
import { createServiceClient } from '@/lib/supabase/service'
import { generateApplicationDocx } from '@/lib/documents/generateDocx'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getBankSession()
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params
  const supabase = createServiceClient()

  const [{ data: app }, { data: history }, { data: docs }] = await Promise.all([
    supabase.from('loan_applications').select('*, profiles(*)').eq('id', id).single(),
    supabase
      .from('application_status_history')
      .select('*, internal_users(full_name)')
      .eq('application_id', id)
      .order('changed_at', { ascending: false }),
    supabase.from('loan_documents').select('document_type').eq('application_id', id),
  ])

  if (!app) return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 })

  const buffer = await generateApplicationDocx({
    application: app,
    profile: app.profiles as Record<string, unknown> | null,
    history: history ?? [],
    docs: docs ?? [],
  })

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="dossier-${app.application_number}.docx"`,
      'Content-Length': String(buffer.length),
    },
  })
}
