import { verifyBankSession } from '@/lib/auth/dal'
import { createServiceClient } from '@/lib/supabase/service'
import { StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { ApplicationStatus } from '@/lib/types'

const FILTER_TABS: { label: string; value: string }[] = [
  { label: 'Toutes', value: 'all' },
  { label: 'Soumises', value: 'submitted' },
  { label: 'KYC', value: 'kyc_verification' },
  { label: 'Analyse', value: 'analysis' },
  { label: 'Docs requis', value: 'additional_docs_required' },
  { label: 'Approuvées', value: 'approved' },
  { label: 'Rejetées', value: 'rejected' },
]

function formatAmount(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function ApplicationsListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>
}) {
  await verifyBankSession()
  const params = await searchParams
  const statusFilter = params.status ?? 'all'
  const search = params.search ?? ''

  const supabase = createServiceClient()

  let query = supabase
    .from('loan_applications')
    .select('*, profiles(full_name, phone, email)')
    .neq('status', 'draft')
    .order('submitted_at', { ascending: false })

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  if (search) {
    query = query.or(`application_number.ilike.%${search}%,profiles.full_name.ilike.%${search}%,profiles.phone.ilike.%${search}%`)
  }

  const { data: applications } = await query

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Demandes de crédit</h1>
        <p className="text-sm text-gray-500">{applications?.length ?? 0} dossier(s) trouvé(s)</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={`/bank/applications?status=${tab.value}${search ? `&search=${search}` : ''}`}
              className={[
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                statusFilter === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50',
              ].join(' ')}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <form method="GET" action="/bank/applications" className="flex gap-2">
          {statusFilter !== 'all' && <input type="hidden" name="status" value={statusFilter} />}
          <input
            name="search"
            defaultValue={search}
            placeholder="Rechercher nom, téléphone, n° dossier..."
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-72"
          />
          <button type="submit" className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            Rechercher
          </button>
        </form>
      </div>

      <Card padding="none">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-gray-500">
              <th className="px-6 py-3 text-left">N° Dossier</th>
              <th className="px-6 py-3 text-left">Client</th>
              <th className="px-6 py-3 text-left">Téléphone</th>
              <th className="px-6 py-3 text-left">Montant</th>
              <th className="px-6 py-3 text-left">Soumis le</th>
              <th className="px-6 py-3 text-left">Statut</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {(applications ?? []).map((app) => {
              const profile = app.profiles as { full_name?: string; phone?: string } | null
              return (
                <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono font-medium text-gray-800">{app.application_number}</td>
                  <td className="px-6 py-3 text-gray-700">{profile?.full_name ?? '-'}</td>
                  <td className="px-6 py-3 text-gray-500">{profile?.phone ?? '-'}</td>
                  <td className="px-6 py-3 text-gray-700">{app.amount ? formatAmount(app.amount) : '-'}</td>
                  <td className="px-6 py-3 text-gray-500">{app.submitted_at ? formatDate(app.submitted_at) : '-'}</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={app.status as ApplicationStatus} />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Link
                      href={`/bank/applications/${app.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Consulter →
                    </Link>
                  </td>
                </tr>
              )
            })}
            {(applications ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">Aucune demande trouvée</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
