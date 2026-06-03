import { verifyClientSession } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { ApplicationStatus, LOAN_TYPE_LABELS, LoanType } from '@/lib/types'

function formatAmount(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const STATUS_STEP: Record<ApplicationStatus, number> = {
  draft: 0,
  submitted: 1,
  kyc_verification: 2,
  analysis: 3,
  additional_docs_required: 3,
  approved: 4,
  rejected: 4,
  disbursed: 5,
}

function ProgressBar({ status }: { status: ApplicationStatus }) {
  const step = STATUS_STEP[status]
  const total = 5
  const pct = Math.round((step / total) * 100)

  const color =
    status === 'approved' || status === 'disbursed'
      ? 'bg-green-500'
      : status === 'rejected'
      ? 'bg-red-400'
      : 'bg-primary-500'

  return (
    <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
      <div
        className={['h-1.5 rounded-full transition-all', color].join(' ')}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default async function ClientApplicationsPage() {
  const user = await verifyClientSession()
  const supabase = await createClient()

  const { data: applications } = await supabase
    .from('loan_applications')
    .select('*')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  const submitted = applications?.filter((a) => a.status !== 'draft') ?? []
  const drafts = applications?.filter((a) => a.status === 'draft') ?? []

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes demandes</h1>
          <p className="text-sm text-gray-500">
            {submitted.length} demande{submitted.length !== 1 ? 's' : ''} soumise{submitted.length !== 1 ? 's' : ''}
            {drafts.length > 0 && ` · ${drafts.length} brouillon${drafts.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/client/application/new">
          <Button>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle demande
          </Button>
        </Link>
      </div>

      {/* Drafts */}
      {drafts.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Brouillons
          </h2>
          <div className="space-y-3">
            {drafts.map((app) => (
              <Card key={app.id} padding="md" className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-gray-700">{app.application_number}</span>
                    <StatusBadge status={app.status as ApplicationStatus} />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Créé le {formatDate(app.created_at)}
                    {app.loan_type && ` · ${LOAN_TYPE_LABELS[app.loan_type as LoanType]}`}
                  </p>
                </div>
                <Link href={`/client/application/new?id=${app.id}&step=1`}>
                  <Button variant="outline" size="sm">Reprendre →</Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Submitted applications */}
      {submitted.length > 0 ? (
        <div className="space-y-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Demandes soumises
          </h2>
          {submitted.map((app) => (
            <Card key={app.id} padding="md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  {/* Header row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-gray-800">
                      {app.application_number}
                    </span>
                    <StatusBadge status={app.status as ApplicationStatus} />
                    {app.loan_type && (
                      <span className="text-xs text-gray-400">
                        {LOAN_TYPE_LABELS[app.loan_type as LoanType]}
                      </span>
                    )}
                  </div>

                  {/* Details row */}
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    {app.amount && (
                      <span className="font-semibold text-gray-900">
                        {formatAmount(app.amount)}
                      </span>
                    )}
                    {app.duration_months && (
                      <span className="text-gray-500">{app.duration_months} mois</span>
                    )}
                    {app.submitted_at && (
                      <span className="text-gray-400 text-xs">
                        Soumis le {formatDate(app.submitted_at)}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <ProgressBar status={app.status as ApplicationStatus} />
                </div>

                <Link
                  href={`/client/application/${app.id}`}
                  className="mt-2 shrink-0 text-sm font-medium text-primary-600 hover:text-primary-700 sm:mt-0"
                >
                  Voir le détail →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : drafts.length === 0 ? (
        <Card padding="lg">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
              <svg className="h-8 w-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Aucune demande</h3>
              <p className="mt-1 text-sm text-gray-500">
                Vous n&apos;avez pas encore soumis de demande de crédit.
              </p>
            </div>
            <Link href="/client/application/new">
              <Button>Faire une demande de crédit</Button>
            </Link>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
