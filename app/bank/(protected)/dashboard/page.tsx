import { verifyBankSession } from '@/lib/auth/dal'
import { createServiceClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/ui/Card'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import Link from 'next/link'

function formatAmount(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function BankDashboardPage() {
  const session = await verifyBankSession()
  const supabase = await createServiceClient()

  const { data: apps } = await supabase
    .from('loan_applications')
    .select('status, amount, submitted_at, id, application_number, profiles(full_name)')
    .neq('status', 'draft')
    .order('submitted_at', { ascending: false })

  const counts = {
    total: apps?.length ?? 0,
    pending: apps?.filter((a) => a.status === 'submitted').length ?? 0,
    kyc: apps?.filter((a) => a.status === 'kyc_verification').length ?? 0,
    analysis: apps?.filter((a) => a.status === 'analysis').length ?? 0,
    approved: apps?.filter((a) => a.status === 'approved').length ?? 0,
    rejected: apps?.filter((a) => a.status === 'rejected').length ?? 0,
  }

  const recent = apps?.slice(0, 8) ?? []

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500">Bienvenue, {session.full_name}</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total"
          value={counts.total}
          color="gray"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />
        <StatCard
          label="Soumises"
          value={counts.pending}
          color="blue"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Vérif. KYC"
          value={counts.kyc}
          color="purple"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
        />
        <StatCard
          label="En analyse"
          value={counts.analysis}
          color="yellow"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
        <StatCard
          label="Approuvées"
          value={counts.approved}
          color="green"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Rejetées"
          value={counts.rejected}
          color="red"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      <Card padding="none">
        <CardHeader className="px-6 pt-6">
          <CardTitle>Demandes récentes</CardTitle>
          <Link href="/bank/applications" className="text-sm text-blue-600 hover:text-blue-700">
            Voir tout →
          </Link>
        </CardHeader>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-gray-500">
              <th className="px-6 py-3 text-left">Dossier</th>
              <th className="px-6 py-3 text-left">Client</th>
              <th className="px-6 py-3 text-left">Montant</th>
              <th className="px-6 py-3 text-left">Date</th>
              <th className="px-6 py-3 text-left">Statut</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((app) => (
              <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-6 py-3">
                  <Link href={`/bank/applications/${app.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                    {app.application_number}
                  </Link>
                </td>
                <td className="px-6 py-3 text-gray-700">
                  {(app.profiles as { full_name?: string } | null)?.full_name ?? '-'}
                </td>
                <td className="px-6 py-3 text-gray-700">
                  {app.amount ? formatAmount(app.amount) : '-'}
                </td>
                <td className="px-6 py-3 text-gray-500">
                  {app.submitted_at ? formatDate(app.submitted_at) : '-'}
                </td>
                <td className="px-6 py-3">
                  <StatusBadge status={app.status as never} />
                </td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Aucune demande</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
