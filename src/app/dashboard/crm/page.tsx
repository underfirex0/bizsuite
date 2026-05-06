import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Plus, Search, Building2, User } from 'lucide-react'
import Link from 'next/link'

export default async function CRMPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('organization_members').select('organization_id').eq('user_id', user.id).single()
  if (!membership) redirect('/auth/register')

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', membership.organization_id)
    .order('created_at', { ascending: false })

  const statusColors: Record<string, string> = {
    active: 'badge-green',
    prospect: 'badge-blue',
    inactive: 'badge-gray',
    archived: 'badge-gray',
  }
  const statusLabels: Record<string, string> = {
    active: 'Actif',
    prospect: 'Prospect',
    inactive: 'Inactif',
    archived: 'Archivé',
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">CRM — Clients</h1>
          <p className="text-sm text-surface-500 mt-0.5">{clients?.length ?? 0} clients</p>
        </div>
        <Link href="/dashboard/crm/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Nouveau client
        </Link>
      </div>

      {(!clients || clients.length === 0) ? (
        <div className="card">
          <div className="empty-state">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="font-semibold text-surface-900 mb-1">Aucun client encore</h3>
            <p className="text-sm text-surface-500 mb-4">Commencez par ajouter votre premier client</p>
            <Link href="/dashboard/crm/new" className="btn-primary">
              <Plus className="w-4 h-4" /> Ajouter un client
            </Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Statut</th>
                  <th>Créé le</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client.id} className="cursor-pointer">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center shrink-0">
                          {client.type === 'company'
                            ? <Building2 className="w-4 h-4 text-brand-500" />
                            : <User className="w-4 h-4 text-brand-500" />}
                        </div>
                        <div>
                          <div className="font-medium text-surface-900">{client.name}</div>
                          {client.city && <div className="text-xs text-surface-400">{client.city}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-surface-600 capitalize">
                        {client.type === 'company' ? 'Entreprise' : 'Particulier'}
                      </span>
                    </td>
                    <td className="text-surface-600">{client.email ?? '—'}</td>
                    <td className="text-surface-600">{client.phone ?? '—'}</td>
                    <td>
                      <span className={`badge ${statusColors[client.status]}`}>
                        {statusLabels[client.status]}
                      </span>
                    </td>
                    <td className="text-surface-400 text-xs">
                      {new Date(client.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
