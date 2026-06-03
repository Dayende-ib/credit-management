'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { loginAction, AuthState } from '../actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

const initialState: AuthState = {}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState)

  return (
    <Card>
      <h2 className="mb-6 text-xl font-semibold text-gray-900">Connexion client</h2>

      {state.message && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="jean@exemple.com"
          required
          error={state.errors?.email?.[0]}
        />
        <Input
          label="Mot de passe"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          error={state.errors?.password?.[0]}
        />

        <Button type="submit" loading={pending} size="lg" className="mt-2 w-full">
          Se connecter
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Pas encore de compte ?{' '}
        <Link href="/register" className="font-medium text-primary-600 hover:text-primary-700">
          S&apos;inscrire
        </Link>
      </p>

      <div className="mt-6 border-t border-gray-200 pt-4 text-center">
        <Link href="/bank/login" className="text-xs text-gray-400 hover:text-gray-600">
          Accès espace banque →
        </Link>
      </div>
    </Card>
  )
}
