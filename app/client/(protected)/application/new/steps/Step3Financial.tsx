'use client'

import { useActionState } from 'react'
import { saveStep3, StepState } from '../actions'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

const initialState: StepState = {}

export function Step3Financial({ profile, applicationId }: { profile: Record<string, unknown> | null; applicationId: string }) {
  const [state, formAction, pending] = useActionState(saveStep3, initialState)

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-900">Situation financière</h2>
      <p className="mb-6 text-sm text-gray-500">Étape 3 sur 5 - Revenus et charges</p>

      {state.message && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="application_id" value={applicationId} />

        <Input
          label="Revenu mensuel net (FCFA)"
          name="monthly_income"
          type="number"
          min="0"
          step="1000"
          required
          placeholder="500 000"
          defaultValue={(profile?.monthly_income as number | null) ?? ''}
          error={state.errors?.monthly_income?.[0]}
        />

        <Input
          label="Charges mensuelles (FCFA)"
          name="monthly_expenses"
          type="number"
          min="0"
          step="1000"
          required
          placeholder="150 000"
          defaultValue={(profile?.monthly_expenses as number | null) ?? ''}
          error={state.errors?.monthly_expenses?.[0]}
        />

        <Input
          label="Autres crédits en cours (FCFA)"
          name="other_credits"
          type="number"
          min="0"
          step="1000"
          placeholder="0"
          defaultValue={(profile?.other_credits as number | null) ?? 0}
          hint="Montant total des remboursements mensuels d'autres crédits"
          error={state.errors?.other_credits?.[0]}
        />

        <div className="flex justify-between pt-2">
          <Link href={`/client/application/new?step=2&id=${applicationId}`}>
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
