'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerAction, AuthState } from '../actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

const REDIRECT_DELAY = 8 // seconds

function ConfirmationScreen({ email }: { email: string }) {
  const [countdown, setCountdown] = useState(REDIRECT_DELAY)
  const router = useRouter()

  useEffect(() => {
    if (countdown <= 0) {
      router.push('/login')
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, router])

  return (
    <Card>
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        {/* Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Title */}
        <div>
          <h2 className="text-xl font-bold text-gray-900">Vérifiez votre boîte mail</h2>
          <p className="mt-1 text-sm text-gray-500">Un email de confirmation a été envoyé à</p>
          <p className="mt-1 font-semibold text-primary-600">{email}</p>
        </div>

        {/* Instructions */}
        <div className="w-full rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-left">
          <p className="mb-2 text-sm font-semibold text-blue-900">Que faire maintenant ?</p>
          <ol className="space-y-1.5 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-bold">1</span>
              Ouvrez l&apos;email reçu de CréditPro
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-bold">2</span>
              Cliquez sur le lien <strong>« Confirmer mon e-mail »</strong>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-bold">3</span>
              Revenez vous connecter sur cette page
            </li>
          </ol>
        </div>

        <p className="text-xs text-gray-400">
          Vérifiez aussi vos spams si vous ne recevez pas l&apos;email.
        </p>

        {/* Countdown + redirect */}
        <div className="w-full">
          {/* Progress bar */}
          <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-primary-500 transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / REDIRECT_DELAY) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">
            Redirection vers la connexion dans{' '}
            <span className="font-semibold text-gray-600">{countdown}s</span>…
          </p>
        </div>

        <Link href="/login" className="text-sm font-medium text-primary-600 hover:text-primary-700">
          Aller à la connexion →
        </Link>
      </div>
    </Card>
  )
}

const initialState: AuthState = {}

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState)

  if (state.success && state.email) {
    return <ConfirmationScreen email={state.email} />
  }

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
          placeholder="+226 70 00 00 00"
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
        <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700">
          Se connecter
        </Link>
      </p>
    </Card>
  )
}
