import { verifyBankSession } from '@/lib/auth/dal'
import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { ActionButtons } from './ActionButtons'
import { CommentBox } from './CommentBox'
import { DownloadButtons } from '@/components/bank/DownloadButtons'
import {
  ApplicationStatus,
  STATUS_LABELS,
  DOCUMENT_LABELS,
  LOAN_TYPE_LABELS,
  CONTRACT_TYPE_LABELS,
  DocumentType,
} from '@/lib/types'
import Link from 'next/link'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount)
}

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value ?? '-'}</span>
    </div>
  )
}

export default async function ApplicationDossierPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await verifyBankSession()
  const { id } = await params

  const supabase = await createServiceClient()

  const { data: app } = await supabase
    .from('loan_applications')
    .select('*, profiles(*)')
    .eq('id', id)
    .single()

  if (!app || app.status === 'draft') notFound()

  const profile = app.profiles as Record<string, unknown> | null

  const [{ data: docs }, { data: history }, { data: comments }] = await Promise.all([
    supabase.from('loan_documents').select('*').eq('application_id', id),
    supabase
      .from('application_status_history')
      .select('*, internal_users(full_name)')
      .eq('application_id', id)
      .order('changed_at', { ascending: false }),
    supabase
      .from('application_comments')
      .select('*, internal_users(full_name, role)')
      .eq('application_id', id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/bank/applications" className="text-sm text-gray-500 hover:text-gray-700">
              ← Demandes
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Dossier {app.application_number}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Soumis le {app.submitted_at ? formatDate(app.submitted_at) : '-'}
          </p>
        </div>
        <StatusBadge status={app.status as ApplicationStatus} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">

          <Card>
            <CardHeader>
              <CardTitle>Informations client</CardTitle>
            </CardHeader>
            <Row label="Nom complet" value={profile?.full_name as string} />
            <Row label="Email" value={profile?.email as string} />
            <Row label="Téléphone" value={profile?.phone as string} />
            <Row label="Date de naissance" value={profile?.date_of_birth as string} />
            <Row label="Nationalité" value={profile?.nationality as string} />
            <Row label="Adresse" value={profile?.address as string} />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Situation professionnelle & financière</CardTitle>
            </CardHeader>
            <Row label="Profession" value={profile?.profession as string} />
            <Row label="Employeur" value={profile?.employer as string} />
            <Row
              label="Type de contrat"
              value={profile?.contract_type ? CONTRACT_TYPE_LABELS[profile.contract_type as keyof typeof CONTRACT_TYPE_LABELS] : null}
            />
            <Row label="Ancienneté" value={profile?.seniority_years ? `${profile.seniority_years} ans` : null} />
            <Row label="Revenu mensuel" value={profile?.monthly_income ? formatAmount(profile.monthly_income as number) : null} />
            <Row label="Charges mensuelles" value={profile?.monthly_expenses ? formatAmount(profile.monthly_expenses as number) : null} />
            <Row label="Autres crédits" value={profile?.other_credits ? formatAmount(profile.other_credits as number) : null} />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Crédit demandé</CardTitle>
            </CardHeader>
            <Row
              label="Type de crédit"
              value={app.loan_type ? LOAN_TYPE_LABELS[app.loan_type as keyof typeof LOAN_TYPE_LABELS] : null}
            />
            <Row label="Montant" value={app.amount ? formatAmount(app.amount) : null} />
            <Row label="Durée" value={app.duration_months ? `${app.duration_months} mois` : null} />
            <Row label="Objet" value={app.purpose} />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents KYC</CardTitle>
            </CardHeader>
            {docs && docs.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {docs.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900">
                        {DOCUMENT_LABELS[doc.document_type as DocumentType]}
                      </p>
                      <p className="text-xs text-blue-600">Voir →</p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucun document téléversé</p>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Commentaires internes</CardTitle>
            </CardHeader>
            <div className="mb-4 space-y-4">
              {(comments ?? []).map((comment) => {
                const author = comment.internal_users as { full_name?: string; role?: string } | null
                return (
                  <div key={comment.id} className="rounded-lg bg-gray-50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{author?.full_name ?? 'Agent'}</span>
                      <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                )
              })}
              {(comments ?? []).length === 0 && (
                <p className="text-sm text-gray-500">Aucun commentaire</p>
              )}
            </div>
            <CommentBox applicationId={id} />
          </Card>
        </div>

        <div className="space-y-6">
          <DownloadButtons
            applicationId={id}
            applicationNumber={app.application_number}
          />

          <Card>
            <CardTitle className="mb-4">Actions</CardTitle>
            <ActionButtons
              applicationId={id}
              status={app.status as ApplicationStatus}
              session={session}
            />
          </Card>

          <Card>
            <CardTitle className="mb-4">Historique</CardTitle>
            <div className="space-y-3">
              {(history ?? []).map((entry) => {
                const agent = entry.internal_users as { full_name?: string } | null
                return (
                  <div key={entry.id} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{STATUS_LABELS[entry.status as ApplicationStatus]}</p>
                      {entry.note && <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(entry.changed_at)}
                        {agent?.full_name && ` · ${agent.full_name}`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
