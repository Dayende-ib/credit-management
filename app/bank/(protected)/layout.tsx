import { verifyBankSession } from '@/lib/auth/dal'
import { BankSidebar } from '@/components/layout/BankSidebar'
import { AppFooter } from '@/components/layout/AppFooter'

export default async function BankLayout({ children }: { children: React.ReactNode }) {
  const session = await verifyBankSession()

  return (
    <div className="flex h-screen bg-gray-50">
      <BankSidebar session={session} />
      <main className="flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col">
          <div className="flex-1">{children}</div>
          <AppFooter />
        </div>
      </main>
    </div>
  )
}
