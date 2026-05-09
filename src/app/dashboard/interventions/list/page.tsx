import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Wrench, Plus } from 'lucide-react'
import Link from 'next/link'

const STATUS_COLOR: Record<string, string> = {
  pending: 'badge-yellow', scheduled: 'badge-blue', in_progress: 'badge-purple',
  completed: 'badge-green', cancelled: 'badge-gray'
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente', scheduled: 'Planifiée', in_progress: 'En cours',
  completed: 'Terminée', cancelled: 'Annulée'
}
const TYPE_COLOR: Record<string, string> = {
  maintenance: 'bg-blue-50 text-blue-700', installation: 'bg-green-50 text-green-700',
  repair: 'bg-orange-50 text-orange-700', diagnosis: 'bg-purple-50 text-purple-700',
  emergency: 'bg-red-50 text-red-700', other: 'bg-zinc-100 text-zinc-600'
}
const TYPE_LABEL: Record<string, string> = {
  maintenance: 'Maintenance', installation: 'Installation', repair: 'Réparation',
  diagnosis: 'Diagnostic', emergency: '🚨 Urgence', other: 'Autre'
}

export default async function InterventionsListPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: m } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle()
  const orgId = (m as any)?.organization_id

  const { data: interventions } = orgId
    ? await supabase.from('interventions')
        .select('*, clients(name, phone), techniciens(first_name, last_name)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
    : { data: [] }

  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Toutes les interventions</h1>
          <p className="text-sm text-zinc-500">{interventions?.length ?? 0} interventions</p>
        </div>
        <Link href="/dashboard/interventions/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Nouvelle intervention
        </Link>
      </div>

      {(!interventions || interventions.length === 0) ? (
        <div className="card">
          <div className="empty-state">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
              <Wrench className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="font-semibold text-zinc-900 mb-1">Aucune intervention encore</h3>
            <p className="text-sm text-zinc-500 mb-4">Créez votre première intervention</p>
            <Link href="/dashboard/interventions/new" className="btn-primary">
              <Plus className="w-4 h-4" /> Nouvelle intervention
            </Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Titre</th>
                  <th>Client</th>
                  <th>Technicien</th>
                  <th>Type</th>
                  <th>Date planifiée</th>
                  <th>Total</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {interventions.map((i: any) => {
                  const tech = i.techniciens as any
                  const client = i.clients as any
                  return (
                    <tr key={i.id}>
                      <td><span className="font-mono text-sm font-medium text-zinc-700">{i.intervention_number}</span></td>
                      <td className="font-medium text-zinc-800 max-w-xs truncate">{i.title}</td>
                      <td>
                        <div className="text-sm text-zinc-700">{client?.name ?? '—'}</div>
                        {client?.phone && <div className="text-xs text-zinc-400">{client.phone}</div>}
                      </td>
                      <td className="text-zinc-600">
                        {tech ? `${tech.first_name} ${tech.last_name}` : <span className="text-zinc-400">Non assigné</span>}
                      </td>
                      <td>
                        <span className={`badge text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[i.type]}`}>
                          {TYPE_LABEL[i.type]}
                        </span>
                      </td>
                      <td className="text-zinc-500 text-xs">
                        {i.scheduled_date ? new Date(i.scheduled_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="font-medium text-zinc-800">{i.total_cost > 0 ? fmt(i.total_cost) : '—'}</td>
                      <td><span className={`badge ${STATUS_COLOR[i.status]}`}>{STATUS_LABEL[i.status]}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
