'use client'

import { useActionState } from 'react'
import { submitApplication, StepState } from '../actions'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { LOAN_TYPE_LABELS, CONTRACT_TYPE_LABELS } from '@/lib/types'

const initialState: StepState = {}

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount)
}

export function Step5Confirm({
  profile,
  application,
  applicationId,
}: {
  profile: Record<string, unknown> | null
  application: Record<string, unknown> | null
  applicationId: string
}) {
  const [state, formAction, pending] = useActionState(submitApplication, initialState)

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-900">Confirmation du dossier</h2>
      <p className="mb-6 text-sm text-gray-500">Étape 6 sur 6 - Vérifiez avant de soumettre</p>

      {state.message && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</div>
      )}

      <div className="space-y-4 mb-6">
        {/* Identity */}
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between bg-gray-50 px-4 py-2">
            <h3 className="text-sm font-semibold text-gray-700">Identité</h3>
            <Link href={`/client/application/new?step=1&id=${applicationId}`} className="text-xs text-blue-600 hover:text-blue-700">Modifier</Link>
          </div>
          <div className="px-4 py-2">
            <Row label="Nom complet" value={profile?.full_name as string} />
            <Row label="Téléphone" value={profile?.phone as string} />
            <Row label="Adresse" value={profile?.address as string} />
            <Row label="Nationalité" value={profile?.nationality as string} />
          </div>
        </div>

        {/* Professional */}
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between bg-gray-50 px-4 py-2">
            <h3 className="text-sm font-semibold text-gray-700">Situation professionnelle</h3>
            <Link href={`/client/application/new?step=2&id=${applicationId}`} className="text-xs text-blue-600 hover:text-blue-700">Modifier</Link>
          </div>
          <div className="px-4 py-2">
            <Row label="Profession" value={profile?.profession as string} />
            <Row label="Employeur" value={profile?.employer as string} />
            <Row label="Type de contrat" value={profile?.contract_type ? CONTRACT_TYPE_LABELS[profile.contract_type as keyof typeof CONTRACT_TYPE_LABELS] : null} />
            <Row label="Ancienneté" value={profile?.seniority_years ? `${profile.seniority_years} ans` : null} />
          </div>
        </div>

        {/* Financial */}
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between bg-gray-50 px-4 py-2">
            <h3 className="text-sm font-semibold text-gray-700">Situation financière</h3>
            <Link href={`/client/application/new?step=3&id=${applicationId}`} className="text-xs text-blue-600 hover:text-blue-700">Modifier</Link>
          </div>
          <div className="px-4 py-2">
            <Row label="Revenu mensuel" value={profile?.monthly_income ? formatAmount(profile.monthly_income as number) : null} />
            <Row label="Charges mensuelles" value={profile?.monthly_expenses ? formatAmount(profile.monthly_expenses as number) : null} />
            <Row label="Autres crédits" value={profile?.other_credits ? formatAmount(profile.other_credits as number) : null} />
          </div>
        </div>

        {/* Loan */}
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between bg-gray-50 px-4 py-2">
            <h3 className="text-sm font-semibold text-gray-700">Crédit demandé</h3>
            <Link href={`/client/application/new?step=4&id=${applicationId}`} className="text-xs text-blue-600 hover:text-blue-700">Modifier</Link>
          </div>
          <div className="px-4 py-2">
            <Row label="Type" value={application?.loan_type ? LOAN_TYPE_LABELS[application.loan_type as keyof typeof LOAN_TYPE_LABELS] : null} />
            <Row label="Montant" value={application?.amount ? formatAmount(application.amount as number) : null} />
            <Row label="Durée" value={application?.duration_months ? `${application.duration_months} mois` : null} />
            <Row label="Objet" value={application?.purpose as string} />
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 p-4 mb-6">
        <p className="text-sm text-blue-800 font-medium">En soumettant ce dossier, vous certifiez que toutes les informations fournies sont exactes et complètes.</p>
      </div>

      <form action={formAction}>
        <input type="hidden" name="application_id" value={applicationId} />

        <div className="flex justify-between">
          <Link href={`/client/application/new?step=5&id=${applicationId}`}>
            <Button variant="outline">← Retour</Button>
          </Link>
          <Button type="submit" loading={pending} size="lg">
            Soumettre ma demande
          </Button>
        </div>
      </form>
    </div>
  )
}
