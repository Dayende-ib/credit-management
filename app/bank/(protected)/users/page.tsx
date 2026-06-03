import { requireRole } from '@/lib/auth/dal'
import { createServiceClient } from '@/lib/supabase/service'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { RoleBadge } from '@/components/ui/Badge'
import { AddUserForm } from './AddUserForm'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function UsersPage() {
  await requireRole('admin')
  const supabase = createServiceClient()

  const { data: users } = await supabase
    .from('internal_users')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
        <p className="text-sm text-gray-500">Gérez les agents, superviseurs et administrateurs</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card padding="none">
            <CardHeader className="px-6 pt-6">
              <CardTitle>{users?.length ?? 0} utilisateur(s)</CardTitle>
            </CardHeader>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-gray-500">
                  <th className="px-6 py-3 text-left">Nom</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Rôle</th>
                  <th className="px-6 py-3 text-left">Créé le</th>
                  <th className="px-6 py-3 text-left">Statut</th>
                </tr>
              </thead>
              <tbody>
                {(users ?? []).map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{user.full_name}</td>
                    <td className="px-6 py-3 text-gray-600">{user.email}</td>
                    <td className="px-6 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-3 text-gray-500">{formatDate(user.created_at)}</td>
                    <td className="px-6 py-3">
                      <span className={['inline-flex rounded-full px-2 py-0.5 text-xs font-medium', user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'].join(' ')}>
                        {user.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <div>
          <Card>
            <CardTitle className="mb-4">Ajouter un utilisateur</CardTitle>
            <AddUserForm />
          </Card>
        </div>
      </div>
    </div>
  )
}
