'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { registerAction, AuthState } from '../actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

const initialState: AuthState = {}

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState)

  return (
    <Card>
      <h2 className="mb-6 text-xl font-semibold text-gray-900">Créer un compte</h2>

      {state.message && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <Input
          label="Nom complet"
          name="full_name"
          placeholder="Jean Dupont"
          required
          error={state.errors?.full_name?.[0]}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="jean@exemple.com"
          required
          error={state.errors?.email?.[0]}
        />
        <Input
          label="Téléphone"
          name="phone"
          type="tel"
          placeholder="+33 6 12 34 56 78"
          required
          error={state.errors?.phone?.[0]}
        />
        <Input
          label="Mot de passe"
          name="password"
          type="password"
          placeholder="8 caractères minimum"
          required
          error={state.errors?.password?.[0]}
        />

        <Button type="submit" loading={pending} size="lg" className="mt-2 w-full">
          Créer mon compte
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Déjà un compte ?{' '}
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
          Se connecter
        </Link>
      </p>
    </Card>
  )
}
