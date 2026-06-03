'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { bankLogoutAction } from '@/app/bank/login/actions'
import { BankSessionPayload } from '@/lib/auth/bank-session'

function NavLink({ href, label, icon, exact = false }: { href: string; label: string; icon: React.ReactNode; exact?: boolean }) {
  const pathname = usePathname()
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={[
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-primary-50 text-primary-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
      ].join(' ')}
    >
      {icon}
      {label}
    </Link>
  )
}

export function BankSidebar({ session }: { session: BankSessionPayload }) {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-5">
        <Image src="/logo.webp" alt="BPBF" width={100} height={36} className="object-contain" style={{ height: 'auto' }} priority />
      </div>

      {/* App name strip */}
      <div className="bg-primary-600 px-5 py-2">
        <p className="text-xs font-semibold tracking-widest text-accent-400 uppercase">CréditPro</p>
        <p className="text-xs text-primary-200">Espace banque</p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        <NavLink
          href="/bank/dashboard"
          exact
          label="Tableau de bord"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <NavLink
          href="/bank/applications"
          label="Demandes"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        {session.role === 'admin' && (
          <NavLink
            href="/bank/users"
            label="Utilisateurs"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
        )}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="mb-3 flex items-center gap-3 px-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
            {session.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{session.full_name}</p>
            <p className="text-xs capitalize text-gray-500">{session.role}</p>
          </div>
        </div>
        <form action={bankLogoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Se déconnecter
          </button>
        </form>
      </div>
    </aside>
  )
}
