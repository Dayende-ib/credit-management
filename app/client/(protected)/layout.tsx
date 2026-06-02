import { verifyClientSession } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { ClientSidebar } from '@/components/layout/ClientSidebar'
import { redirect } from 'next/navigation'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await verifyClientSession()

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ClientSidebar fullName={profile.full_name} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
