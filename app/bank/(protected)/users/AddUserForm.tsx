'use client'

import { useActionState, useRef, useEffect } from 'react'
import { addUserAction, AddUserState } from './actions'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const initialState: AddUserState = {}

const roleOptions = [
  { value: 'agent', label: 'Agent de crédit' },
  { value: 'supervisor', label: 'Superviseur' },
  { value: 'admin', label: 'Administrateur' },
]

export function AddUserForm() {
  const [state, formAction, pending] = useActionState(addUserAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
    }
  }, [state.success])

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      {state.message && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</div>
      )}
      {state.success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">Utilisateur créé avec succès.</div>
      )}

      <Input
        label="Nom complet"
        name="full_name"
        required
        placeholder="Marie Dupont"
        error={state.errors?.full_name?.[0]}
      />
      <Input
        label="Email professionnel"
        name="email"
        type="email"
        required
        placeholder="marie@creditpro.com"
        error={state.errors?.email?.[0]}
      />
      <Input
        label="Mot de passe temporaire"
        name="password"
        type="password"
        required
        placeholder="8 caractères minimum"
        error={state.errors?.password?.[0]}
      />
      <Select
        label="Rôle"
        name="role"
        required
        options={roleOptions}
        error={state.errors?.role?.[0]}
      />

      <Button type="submit" loading={pending} className="w-full">
        Créer l&apos;utilisateur
      </Button>
    </form>
  )
}
