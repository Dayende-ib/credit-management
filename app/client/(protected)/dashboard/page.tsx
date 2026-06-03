import { verifyClientSession } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { ApplicationStatus, STATUS_LABELS, StatusHistory } from '@/lib/types'

const STATUS_ORDER: ApplicationStatus[] = [
  'submitted',
  'kyc_verification',
  'analysis',
  'approved',
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount)
}

function Timeline({ history, currentStatus }: { history: StatusHistory[]; currentStatus: ApplicationStatus }) {
  const completedStatuses = new Set(history.map((h) => h.status))

  return (
    <div className="mt-4 flex flex-col gap-0">
      {STATUS_ORDER.map((status, idx) => {
        const done = completedStatuses.has(status)
        const isCurrent = currentStatus === status
        const entry = history.find((h) => h.status === status)
        const isLast = idx === STATUS_ORDER.length - 1

        return (
          <div key={status} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div
                className={[
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold',
                  done
                    ? 'border-green-500 bg-green-500 text-white'
                    : isCurrent
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-300 bg-white text-gray-400',
                ].join(' ')}
              >
                {done ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              {!isLast && (
                <div className={['h-8 w-0.5', done ? 'bg-green-300' : 'bg-gray-200'].join(' ')} />
              )}
            </div>
            <div className="pb-6">
              <p className={['font-medium', done ? 'text-gray-900' : 'text-gray-400'].join(' ')}>
                {STATUS_LABELS[status]}
              </p>
              {entry && (
                <p className="text-xs text-gray-500">{formatDate(entry.changed_at)}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default async function ClientDashboardPage() {
  const user = await verifyClientSession()
  const supabase = await createClient()

  const { data: applications } = await supabase
    .from('loan_applications')
    .select('*')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  const { data: notifRows } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(1)

  const notification = notifRows?.[0] ?? null

  // Mark it as read immediately so it won't show again on next visit
  if (notification) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification.id)
  }

  const latestApp = applications?.[0] ?? null

  let history: StatusHistory[] = []
  if (latestApp) {
    const { data } = await supabase
      .from('application_status_history')
      .select('*')
      .eq('application_id', latestApp.id)
      .order('changed_at', { ascending: true })
    history = data ?? []
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500">Suivez l&apos;avancement de votre demande</p>
        </div>
        {!latestApp || latestApp.status !== 'draft' ? (
          <Link href="/client/application/new">
            <Button>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouvelle demande
            </Button>
          </Link>
        ) : null}
      </div>

      {/* Latest notification — shown once, then marked read */}
      {notification && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4">
          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary-900">{notification.title}</p>
            <p className="text-sm text-primary-700 mt-0.5">{notification.message}</p>
          </div>
        </div>
      )}

      {latestApp ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Application status card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Demande {latestApp.application_number}</CardTitle>
                <StatusBadge status={latestApp.status} />
              </CardHeader>

              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-sm">
                {latestApp.amount && (
                  <div>
                    <p className="text-gray-500">Montant demandé</p>
                    <p className="font-semibold text-gray-900">{formatAmount(latestApp.amount)}</p>
                  </div>
                )}
                {latestApp.duration_months && (
                  <div>
                    <p className="text-gray-500">Durée</p>
                    <p className="font-semibold text-gray-900">{latestApp.duration_months} mois</p>
                  </div>
                )}
                {latestApp.submitted_at && (
                  <div>
                    <p className="text-gray-500">Soumise le</p>
                    <p className="font-semibold text-gray-900">{formatDate(latestApp.submitted_at)}</p>
                  </div>
                )}
              </div>

              {latestApp.status === 'draft' && (
                <div className="mt-4 rounded-lg bg-yellow-50 p-4">
                  <p className="text-sm font-medium text-yellow-800">Demande en brouillon</p>
                  <p className="text-sm text-yellow-700 mt-1">Complétez et soumettez votre dossier pour démarrer le traitement.</p>
                  <Link href={`/client/application/new?id=${latestApp.id}`} className="mt-3 inline-block">
                    <Button size="sm">Reprendre ma demande</Button>
                  </Link>
                </div>
              )}

              {latestApp.status === 'rejected' && (
                <div className="mt-4 rounded-lg bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-800">Demande rejetée</p>
                  <p className="text-sm text-red-700 mt-1">Votre demande n&apos;a pas pu être approuvée. Contactez votre conseiller pour plus d&apos;informations.</p>
                </div>
              )}

              {latestApp.status === 'approved' && (
                <div className="mt-4 rounded-lg bg-green-50 p-4">
                  <p className="text-sm font-medium text-green-800">Demande approuvée !</p>
                  <p className="text-sm text-green-700 mt-1">Félicitations ! Votre demande a été approuvée. Un conseiller vous contactera prochainement.</p>
                </div>
              )}
            </Card>
          </div>

          {/* Timeline */}
          <Card>
            <CardTitle className="mb-4">Progression</CardTitle>
            {latestApp.status !== 'draft' ? (
              <Timeline history={history} currentStatus={latestApp.status} />
            ) : (
              <p className="text-sm text-gray-500">La progression sera affichée une fois votre demande soumise.</p>
            )}
          </Card>
        </div>
      ) : (
        <Card padding="lg">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Aucune demande en cours</h3>
              <p className="mt-1 text-sm text-gray-500">Démarrez votre demande de crédit en quelques étapes simples.</p>
            </div>
            <Link href="/client/application/new">
              <Button>Faire une demande de crédit</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
