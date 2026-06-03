'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { bankLoginAction, BankLoginState } from './actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

const initialState: BankLoginState = {}

export default function BankLoginPage() {
  const [state, formAction, pending] = useActionState(bankLoginAction, initialState)

  return (
    <div className="flex min-h-screen">
      {/* Left — dark brand panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-primary-900 p-12">
        <div className="mb-8 rounded-2xl bg-white/10 p-6">
          <Image src="/logo.webp" alt="BPBF" width={180} height={66} className="object-contain" style={{ height: 'auto' }} priority />
        </div>
        <h2 className="text-2xl font-bold text-white text-center">Espace Administration</h2>
        <p className="mt-3 text-primary-300 text-center max-w-xs text-sm">
          Gérez les demandes de crédit, analysez les dossiers et prenez vos décisions en toute sécurité.
        </p>
        <div className="mt-10 w-full max-w-xs space-y-3">
          {['Agent crédit', 'Superviseur', 'Administrateur'].map((role) => (
            <div key={role} className="flex items-center gap-3 rounded-lg bg-primary-800/50 px-4 py-2.5">
              <div className="h-2 w-2 rounded-full bg-accent-400" />
              <span className="text-sm text-primary-100">{role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-gray-50 p-8">
        <div className="mb-6 lg:hidden">
          <Image src="/logo.webp" alt="BPBF" width={140} height={50} className="object-contain" style={{ height: 'auto' }} priority />
        </div>

        <div className="w-full max-w-md">
          <Card>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Connexion</h2>
              <p className="text-sm text-gray-500 mt-1">Accès réservé au personnel autorisé</p>
            </div>

            {state.message && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</div>
            )}

            <form action={formAction} className="flex flex-col gap-4">
              <Input
                label="Email professionnel"
                name="email"
                type="email"
                placeholder="agent@bpbf.bf"
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
    </div>
  )
}
