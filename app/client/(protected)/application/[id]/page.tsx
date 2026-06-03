import { verifyClientSession } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import Link from 'next/link'
import {
  ApplicationStatus,
  STATUS_LABELS,
  LOAN_TYPE_LABELS,
  CONTRACT_TYPE_LABELS,
  DOCUMENT_LABELS,
  DocumentType,
  LoanType,
  ContractType,
  StatusHistory,
  LoanDocument,
} from '@/lib/types'
import Image from 'next/image'
import { SupplementaryUpload } from './SupplementaryUpload'

function formatAmount(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{value}</span>
    </div>
  )
}

const STATUS_STEPS: { status: ApplicationStatus; label: string }[] = [
  { status: 'submitted',              label: 'Soumise' },
  { status: 'kyc_verification',       label: 'Vérification KYC' },
  { status: 'analysis',               label: 'En analyse' },
  { status: 'approved',               label: 'Décision' },
]

function Timeline({ history, currentStatus }: { history: StatusHistory[]; currentStatus: ApplicationStatus }) {
  const completedStatuses = new Set(history.map((h) => h.status))
  const isFinal = currentStatus === 'approved' || currentStatus === 'rejected' || currentStatus === 'disbursed'

  return (
    <div className="space-y-0">
      {STATUS_STEPS.map((step, idx) => {
        const done = completedStatuses.has(step.status)
        const isCurrent = currentStatus === step.status
        const isDecision = step.status === 'approved'
        const entry = history.find((h) => h.status === step.status)
        const isLast = idx === STATUS_STEPS.length - 1

        // For the decision step, show actual outcome
        const displayLabel = isDecision && isFinal
          ? STATUS_LABELS[currentStatus]
          : step.label

        const dotColor =
          isDecision && isFinal
            ? currentStatus === 'approved' || currentStatus === 'disbursed'
              ? 'border-green-500 bg-green-500 text-white'
              : 'border-red-500 bg-red-500 text-white'
            : done
            ? 'border-primary-500 bg-primary-500 text-white'
            : isCurrent
            ? 'border-primary-500 bg-primary-50 text-primary-600'
            : 'border-gray-200 bg-white text-gray-400'

        return (
          <div key={step.status} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className={['flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all', dotColor].join(' ')}>
                {(done || (isDecision && isFinal)) ? (
                  currentStatus === 'rejected' && isDecision ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )
                ) : (
                  idx + 1
                )}
              </div>
              {!isLast && (
                <div className={['h-10 w-0.5', done ? 'bg-primary-300' : 'bg-gray-200'].join(' ')} />
              )}
            </div>
            <div className="pb-2 pt-1">
              <p className={['text-sm font-medium', done || isCurrent || (isDecision && isFinal) ? 'text-gray-900' : 'text-gray-400'].join(' ')}>
                {displayLabel}
              </p>
              {entry && (
                <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(entry.changed_at)}</p>
              )}
              {isCurrent && !isFinal && (
                <p className="text-xs text-primary-600 mt-0.5 font-medium">En cours…</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DocPreview({ doc }: { doc: LoanDocument }) {
  const isPdf = doc.file_url.toLowerCase().includes('.pdf')
  const label = DOCUMENT_LABELS[doc.document_type as DocumentType]

  return (
    <a
      href={doc.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 transition-shadow hover:shadow-md"
    >
      {isPdf ? (
        <div className="flex h-28 items-center justify-center bg-red-50">
          <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      ) : (
        <div style={{ position: 'relative', height: '7rem' }} className="bg-gray-100">
          <Image
            src={doc.file_url}
            alt={label}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      <div className="flex items-center justify-between px-3 py-2">
        <p className="text-xs font-medium text-gray-700 truncate">{label}</p>
        <svg className="h-3.5 w-3.5 shrink-0 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </a>
  )
}

export default async function ClientApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await verifyClientSession()
  const { id } = await params
  const supabase = await createClient()

  const { data: app } = await supabase
    .from('loan_applications')
    .select('*, profiles(*)')
    .eq('id', id)
    .eq('client_id', user.id)
    .single()

  if (!app || app.status === 'draft') notFound()

  const profile = app.profiles as Record<string, unknown> | null

  const [{ data: docs }, { data: history }] = await Promise.all([
    supabase.from('loan_documents').select('*').eq('application_id', id),
    supabase
      .from('application_status_history')
      .select('*')
      .eq('application_id', id)
      .order('changed_at', { ascending: true }),
  ])

  const isApproved = app.status === 'approved' || app.status === 'disbursed'
  const isRejected = app.status === 'rejected'
  const needsDocs = app.status === 'additional_docs_required'

  // Get the most recent additional_docs_required history entry
  const lastDocsEntry = needsDocs
    ? [...(history ?? [])].reverse().find((h) => h.status === 'additional_docs_required') ?? null
    : null

  // Distinguish flows: [COMPLEMENT] prefix = new doc request, [KYC_REJECT] = KYC rejection
  const isComplementRequest = lastDocsEntry?.note?.startsWith('[COMPLEMENT]') ?? false
  const rawNote = lastDocsEntry?.note ?? null
  const agentNote = rawNote
    ? rawNote.replace(/^\[(COMPLEMENT|KYC_REJECT)\]\s*/, '')
    : null

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <Link href="/client/applications" className="text-sm text-gray-400 hover:text-gray-600">
            ← Mes demandes
          </Link>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dossier {app.application_number}
            </h1>
            {app.submitted_at && (
              <p className="mt-1 text-sm text-gray-500">Soumis le {formatDate(app.submitted_at)}</p>
            )}
          </div>
          <StatusBadge status={app.status as ApplicationStatus} />
        </div>
      </div>

      {/* Alert banners */}
      {isApproved && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-green-800">Félicitations ! Votre demande a été approuvée.</p>
            <p className="mt-0.5 text-sm text-green-700">Un conseiller vous contactera prochainement pour les modalités de décaissement.</p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-red-800">Votre demande n&apos;a pas pu être approuvée.</p>
            <p className="mt-0.5 text-sm text-red-700">Contactez un conseiller BPBF pour plus d&apos;informations.</p>
          </div>
        </div>
      )}

      {needsDocs && (
        <SupplementaryUpload
          applicationId={id}
          agentNote={agentNote}
          isComplementRequest={isComplementRequest}
          docs={(docs ?? []) as never}
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left — main content */}
        <div className="space-y-6 lg:col-span-2">

          {/* Loan details */}
          <Card>
            <CardHeader>
              <CardTitle>Crédit demandé</CardTitle>
            </CardHeader>
            <Row label="Type de crédit" value={app.loan_type ? LOAN_TYPE_LABELS[app.loan_type as LoanType] : null} />
            <Row label="Montant" value={app.amount ? formatAmount(app.amount) : null} />
            <Row label="Durée" value={app.duration_months ? `${app.duration_months} mois` : null} />
            <Row label="Objet du prêt" value={app.purpose} />
            {app.amount && app.duration_months && (
              <Row
                label="Mensualité estimée"
                value={formatAmount(Math.round((app.amount / app.duration_months) * 1.08))}
              />
            )}
          </Card>

          {/* Personal info */}
          <Card>
            <CardHeader>
              <CardTitle>Vos informations</CardTitle>
            </CardHeader>
            <Row label="Nom complet" value={profile?.full_name as string} />
            <Row label="Téléphone" value={profile?.phone as string} />
            <Row label="Adresse" value={profile?.address as string} />
            <Row label="Profession" value={profile?.profession as string} />
            <Row label="Type de contrat" value={profile?.contract_type ? CONTRACT_TYPE_LABELS[profile.contract_type as ContractType] : null} />
            <Row label="Revenu mensuel" value={profile?.monthly_income ? formatAmount(profile.monthly_income as number) : null} />
          </Card>

          {/* KYC documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents KYC</CardTitle>
              <span className="text-xs text-gray-400">{docs?.length ?? 0} / 5 documents</span>
            </CardHeader>
            {docs && docs.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(docs as LoanDocument[]).map((doc) => (
                  <DocPreview key={doc.id} doc={doc} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucun document téléversé.</p>
            )}
          </Card>
        </div>

        {/* Right — timeline + history */}
        <div className="space-y-6">
          <Card>
            <CardTitle className="mb-5">Suivi de ma demande</CardTitle>
            <Timeline history={(history ?? []) as StatusHistory[]} currentStatus={app.status as ApplicationStatus} />
          </Card>

          <Card>
            <CardTitle className="mb-4">Historique</CardTitle>
            <div className="space-y-4">
              {(history ?? []).slice().reverse().map((entry) => (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {STATUS_LABELS[entry.status as ApplicationStatus]}
                    </p>
                    {entry.note && (
                      <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(entry.changed_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
