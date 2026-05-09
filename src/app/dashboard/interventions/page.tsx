import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Wrench, Plus, Clock, CheckCircle, AlertCircle, Users, FileText, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const STATUS_COLOR: Record<string, string> = {
  pending: 'badge-yellow', scheduled: 'badge-blue', in_progress: 'badge-purple',
  completed: 'badge-green', cancelled: 'badge-gray'
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente', scheduled: 'Planifiée', in_progress: 'En cours',
  completed: 'Terminée', cancelled: 'Annulée'
}
const TYPE_LABEL: Record<string, string> = {
  installation: 'Installation', maintenance: 'Maintenance', repair: 'Réparation',
  diagnosis: 'Diagnostic', emergency: '🚨 Urgence', other: 'Autre'
}

export default async function InterventionsDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: m } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle()
  const orgId = (m as any)?.organization_id
  if (!orgId) redirect('/dashboard')

  const [intRes, techRes, contractRes] = await Promise.all([
    supabase.from('interventions').select('*, clients(name, phone), techniciens(first_name, last_name)').eq('organization_id', orgId).order('created_at', { ascending: false }),
    supabase.from('techniciens').select('*').eq('organization_id', orgId).eq('is_active', true),
    supabase.from('maintenance_contracts').select('*, clients(name)').eq('organization_id', orgId).eq('status', 'active'),
  ])

  const interventions = intRes.data ?? []
  const techniciens = techRes.data ?? []
  const contracts = contractRes.data ?? []

  const pending = interventions.filter((i: any) => i.status === 'pending').length
  const inProgress = interventions.filter((i: any) => i.status === 'in_progress').length
  const completedToday = interventions.filter((i: any) => {
    if (i.status !== 'completed') return false
    const today = new Date().toDateString()
    return i.completed_at && new Date(i.completed_at).toDateString() === today
  }).length
  const totalRevenue = interventions.filter((i: any) => i.status === 'completed').reduce((s: number, i: any) => s + (i.total_cost || 0), 0)

  // Contracts expiring in 30 days
  const in30 = new Date(Date.now() + 30 * 86400000)
  const expiringContracts = contracts.filter((c: any) => c.end_date && new Date(c.end_date) <= in30)

  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Climatisation & Interventions</h1>
          <p className="text-sm text-zinc-500">{interventions.length} interventions · {techniciens.length} techniciens</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/interventions/techniciens" className="btn-secondary">
            <Users className="w-4 h-4" /> Techniciens
          </Link>
          <Link href="/dashboard/interventions/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Nouvelle intervention
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center mb-3">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-zinc-900">{pending}</div>
          <div className="text-sm font-medium text-zinc-700">En attente</div>
          <div className="text-xs text-zinc-400 mt-0.5">à planifier</div>
        </div>
        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Wrench className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-zinc-900">{inProgress}</div>
          <div className="text-sm font-medium text-zinc-700">En cours</div>
          <div className="text-xs text-zinc-400 mt-0.5">techniciens actifs</div>
        </div>
        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-3">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-zinc-900">{contracts.length}</div>
          <div className="text-sm font-medium text-zinc-700">Contrats actifs</div>
          <div className="text-xs text-zinc-400 mt-0.5">{expiringContracts.length} expirent bientôt</div>
        </div>
        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-zinc-900">{fmt(totalRevenue)}</div>
          <div className="text-sm font-medium text-zinc-700">CA interventions</div>
          <div className="text-xs text-zinc-400 mt-0.5">terminées</div>
        </div>
      </div>

      {/* Expiring contracts alert */}
      {expiringContracts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Contrats de maintenance à renouveler</p>
            <div className="mt-1 space-y-0.5">
              {expiringContracts.map((c: any) => (
                <p key={c.id} className="text-xs text-amber-700">
                  {(c.clients as any)?.name} — {c.title} · expire le {new Date(c.end_date).toLocaleDateString('fr-FR')}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent interventions */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-900">Interventions récentes</h2>
            <Link href="/dashboard/interventions/list" className="text-xs text-indigo-600 hover:underline">Voir tout →</Link>
          </div>
          {interventions.length === 0 ? (
            <div className="empty-state py-8">
              <Wrench className="w-8 h-8 text-zinc-300 mb-2" />
              <p className="text-sm text-zinc-400 mb-3">Aucune intervention encore</p>
              <Link href="/dashboard/interventions/new" className="btn-primary text-xs px-3 py-1.5">
                <Plus className="w-3.5 h-3.5" /> Créer une intervention
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {interventions.slice(0, 7).map((i: any) => {
                const tech = i.techniciens as any
                const client = i.clients as any
                return (
                  <div key={i.id} className="flex items-start justify-between py-2 border-b border-zinc-50 last:border-0">
                    <div className="flex items-start gap-2.5">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        i.status === 'completed' ? 'bg-green-500' :
                        i.status === 'in_progress' ? 'bg-indigo-500' :
                        i.status === 'pending' ? 'bg-yellow-500' : 'bg-zinc-300'
                      }`} />
                      <div>
                        <div className="text-sm font-medium text-zinc-800">{i.title}</div>
                        <div className="text-xs text-zinc-400">
                          {client?.name ?? '—'}
                          {tech && ` · ${tech.first_name} ${tech.last_name}`}
                          {i.scheduled_date && ` · ${new Date(i.scheduled_date).toLocaleDateString('fr-FR')}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className={`badge ${STATUS_COLOR[i.status]}`}>{STATUS_LABEL[i.status]}</span>
                      {i.total_cost > 0 && <div className="text-xs text-zinc-500 mt-0.5">{fmt(i.total_cost)}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Active contracts + Quick actions */}
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-zinc-900">Contrats de maintenance</h2>
              <Link href="/dashboard/interventions/contrats" className="text-xs text-indigo-600 hover:underline">Voir tout →</Link>
            </div>
            {contracts.length === 0 ? (
              <div className="empty-state py-6">
                <FileText className="w-7 h-7 text-zinc-300 mb-2" />
                <p className="text-sm text-zinc-400 mb-3">Aucun contrat actif</p>
                <Link href="/dashboard/interventions/contrats/new" className="btn-primary text-xs px-3 py-1.5">
                  <Plus className="w-3.5 h-3.5" /> Nouveau contrat
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {contracts.slice(0, 5).map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-zinc-800">{(c.clients as any)?.name}</div>
                      <div className="text-xs text-zinc-400">{c.title} · {c.frequency === 'annual' ? 'Annuel' : c.frequency === 'monthly' ? 'Mensuel' : 'Trimestriel'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-zinc-700">{fmt(c.amount)}</div>
                      {c.next_intervention_date && (
                        <div className="text-xs text-zinc-400">
                          Prochain: {new Date(c.next_intervention_date).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <h2 className="font-semibold text-zinc-900 mb-3">Actions rapides</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: '/dashboard/interventions/new', icon: Wrench, label: 'Intervention', color: 'text-indigo-600' },
                { href: '/dashboard/interventions/contrats/new', icon: FileText, label: 'Contrat maintenance', color: 'text-green-600' },
                { href: '/dashboard/interventions/equipements/new', icon: AlertCircle, label: 'Équipement client', color: 'text-amber-600' },
                { href: '/dashboard/interventions/techniciens/new', icon: Users, label: 'Technicien', color: 'text-blue-600' },
              ].map(({ href, icon: Icon, label, color }) => (
                <Link key={href} href={href} className="flex items-center gap-2 p-3 rounded-xl border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50 transition-all">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-xs font-medium text-zinc-700">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
