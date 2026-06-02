'use client'

import { useActionState } from 'react'
import { saveStep1, StepState } from '../actions'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const initialState: StepState = {}

const genderOptions = [
  { value: 'M', label: 'Masculin' },
  { value: 'F', label: 'Féminin' },
]

export function Step1Identity({ profile, applicationId }: { profile: Record<string, unknown> | null; applicationId: string | null }) {
  const [state, formAction, pending] = useActionState(saveStep1, initialState)

  const nameParts = (profile?.full_name as string | null)?.split(' ') ?? []
  const firstName = nameParts.slice(0, -1).join(' ')
  const lastName = nameParts.slice(-1)[0] ?? ''

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-900">Informations personnelles</h2>
      <p className="mb-6 text-sm text-gray-500">Étape 1 sur 5 - Identité et coordonnées</p>

      {state.message && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        {applicationId && <input type="hidden" name="application_id" value={applicationId} />}

        <div className="grid grid-cols-2 gap-4">
          <Input label="Prénom" name="first_name" required defaultValue={firstName} error={state.errors?.first_name?.[0]} />
          <Input label="Nom" name="last_name" required defaultValue={lastName} error={state.errors?.last_name?.[0]} />
        </div>

        <Input
          label="Date de naissance"
          name="date_of_birth"
          type="date"
          required
          defaultValue={(profile?.date_of_birth as string | null) ?? ''}
          error={state.errors?.date_of_birth?.[0]}
        />

        <Select
          label="Sexe"
          name="gender"
          required
          options={genderOptions}
          defaultValue={(profile?.gender as string | null) ?? ''}
          error={state.errors?.gender?.[0]}
        />

        <Input
          label="Nationalité"
          name="nationality"
          required
          placeholder="Française"
          defaultValue={(profile?.nationality as string | null) ?? ''}
          error={state.errors?.nationality?.[0]}
        />

        <Input
          label="Téléphone"
          name="phone"
          type="tel"
          required
          placeholder="+33 6 12 34 56 78"
          defaultValue={(profile?.phone as string | null) ?? ''}
          error={state.errors?.phone?.[0]}
        />

        <Input
          label="Adresse"
          name="address"
          required
          placeholder="12 rue de la Paix, 75001 Paris"
          defaultValue={(profile?.address as string | null) ?? ''}
          error={state.errors?.address?.[0]}
        />

        <div className="flex justify-end pt-2">
          <Button type="submit" loading={pending}>
            Suivant →
          </Button>
        </div>
      </form>
    </div>
  )
}
