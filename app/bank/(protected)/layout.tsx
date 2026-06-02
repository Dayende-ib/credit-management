import { verifyBankSession } from '@/lib/auth/dal'
import { BankSidebar } from '@/components/layout/BankSidebar'

export default async function BankLayout({ children }: { children: React.ReactNode }) {
  const session = await verifyBankSession()

  return (
    <div className="flex h-screen bg-gray-50">
      <BankSidebar session={session} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
