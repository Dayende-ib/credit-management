import { verifyBankSession } from '@/lib/auth/dal'
import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { ActionButtons } from './ActionButtons'
import { CommentBox } from './CommentBox'
import { DownloadButtons } from '@/components/bank/DownloadButtons'
import { KycDocuments } from './KycDocuments'
import {
  ApplicationStatus,
  STATUS_LABELS,
  DOCUMENT_LABELS,
  LOAN_TYPE_LABELS,
  CONTRACT_TYPE_LABELS,
  DocumentType,
} from '@/lib/types'
import Link from 'next/link'
import Image from 'next/image'

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

function DocPreview({ doc }: { doc: { id: string; file_url: string; document_type: string; file_name: string } }) {
  const isPdf = doc.file_url.toLowerCase().includes('.pdf')
  const label = DOCUMENT_LABELS[doc.document_type as DocumentType]

  return (
    <a
      href={doc.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 transition-all hover:border-primary-300 hover:shadow-md"
    >
      {isPdf ? (
        <div className="flex h-36 flex-col items-center justify-center gap-2 bg-red-50">
          <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs text-red-500 font-medium">PDF</span>
        </div>
      ) : (
        <div className="relative h-36 bg-gray-100">
          <Image
            src={doc.file_url}
            alt={label}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
      )}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-800 truncate">{label}</p>
          <p className="text-xs text-gray-400 truncate">{doc.file_name}</p>
        </div>
        <svg className="h-3.5 w-3.5 shrink-0 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </a>
  )
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
            <KycDocuments docs={(docs ?? []) as never} applicationId={id} />
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
