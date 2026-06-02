'use client'

import { useActionState } from 'react'
import { saveStep4, StepState } from '../actions'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

const initialState: StepState = {}

const loanTypeOptions = [
  { value: 'personal', label: 'Crédit personnel' },
  { value: 'auto', label: 'Crédit auto' },
  { value: 'mortgage', label: 'Crédit immobilier' },
  { value: 'business', label: 'Crédit professionnel' },
  { value: 'education', label: 'Crédit études' },
]

export function Step4LoanRequest({
  application,
  applicationId,
}: {
  application: Record<string, unknown> | null
  applicationId: string
}) {
  const [state, formAction, pending] = useActionState(saveStep4, initialState)

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-900">Demande de crédit</h2>
      <p className="mb-6 text-sm text-gray-500">Étape 4 sur 5 - Détails du crédit souhaité</p>

      {state.message && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="application_id" value={applicationId} />

        <Select
          label="Type de crédit"
          name="loan_type"
          required
          options={loanTypeOptions}
          defaultValue={(application?.loan_type as string | null) ?? ''}
          error={state.errors?.loan_type?.[0]}
        />

        <Input
          label="Montant demandé (FCFA)"
          name="amount"
          type="number"
          min="50000"
          step="10000"
          required
          placeholder="2 000 000"
          defaultValue={(application?.amount as number | null) ?? ''}
          error={state.errors?.amount?.[0]}
        />

        <Input
          label="Durée de remboursement (mois)"
          name="duration_months"
          type="number"
          min="6"
          max="360"
          required
          placeholder="24"
          defaultValue={(application?.duration_months as number | null) ?? ''}
          hint="Entre 6 et 360 mois"
          error={state.errors?.duration_months?.[0]}
        />

        <Textarea
          label="Objet du prêt"
          name="purpose"
          required
          placeholder="Décrivez l'utilisation prévue du crédit..."
          defaultValue={(application?.purpose as string | null) ?? ''}
          error={state.errors?.purpose?.[0]}
        />

        <div className="flex justify-between pt-2">
          <Link href={`/client/application/new?step=3&id=${applicationId}`}>
            <Button variant="outline">← Retour</Button>
          </Link>
          <Button type="submit" loading={pending}>
            Suivant →
          </Button>
        </div>
      </form>
    </div>
  )
}
