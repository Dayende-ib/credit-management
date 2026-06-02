'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { bankLoginAction, BankLoginState } from './actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

const initialState: BankLoginState = {}

export default function BankLoginPage() {
  const [state, formAction, pending] = useActionState(bankLoginAction, initialState)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-800 to-blue-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 shadow-lg">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Espace Banque</h1>
          <p className="text-sm text-blue-200">Accès réservé aux agents et superviseurs</p>
        </div>

        <Card>
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Connexion</h2>

          {state.message && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</div>
          )}

          <form action={formAction} className="flex flex-col gap-4">
            <Input
              label="Email professionnel"
              name="email"
              type="email"
              placeholder="agent@creditpro.com"
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
              Accéder au tableau de bord
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/login" className="text-xs text-gray-400 hover:text-gray-600">
              ← Espace client
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
