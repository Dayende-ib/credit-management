'use client'

import { useActionState } from 'react'
import { saveStep2, StepState } from '../actions'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

const initialState: StepState = {}

const contractOptions = [
  { value: 'cdi', label: 'CDI' },
  { value: 'cdd', label: 'CDD' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'retired', label: 'Retraité' },
  { value: 'other', label: 'Autre' },
]

export function Step2Professional({ profile, applicationId }: { profile: Record<string, unknown> | null; applicationId: string }) {
  const [state, formAction, pending] = useActionState(saveStep2, initialState)

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-900">Situation professionnelle</h2>
      <p className="mb-6 text-sm text-gray-500">Étape 2 sur 5 - Emploi et contrat</p>

      {state.message && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="application_id" value={applicationId} />

        <Input
          label="Profession"
          name="profession"
          required
          placeholder="Ingénieur, Médecin, Commerçant..."
          defaultValue={(profile?.profession as string | null) ?? ''}
          error={state.errors?.profession?.[0]}
        />

        <Input
          label="Employeur"
          name="employer"
          placeholder="Nom de votre entreprise"
          defaultValue={(profile?.employer as string | null) ?? ''}
        />

        <Input
          label="Ancienneté (années)"
          name="seniority_years"
          type="number"
          min="0"
          placeholder="5"
          defaultValue={(profile?.seniority_years as number | null) ?? ''}
          error={state.errors?.seniority_years?.[0]}
        />

        <Select
          label="Type de contrat"
          name="contract_type"
          required
          options={contractOptions}
          defaultValue={(profile?.contract_type as string | null) ?? ''}
          error={state.errors?.contract_type?.[0]}
        />

        <div className="flex justify-between pt-2">
          <Link href={`/client/application/new?step=1&id=${applicationId}`}>
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
