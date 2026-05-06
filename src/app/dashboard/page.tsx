import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, FileText, Receipt, TrendingUp, AlertCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/auth/register')
  const orgId = membership.organization_id

  // Fetch stats in parallel
  const [clients, invoices, quotes, deals] = await Promise.all([
    supabase.from('clients').select('id, status', { count: 'exact' }).eq('organization_id', orgId),
    supabase.from('invoices').select('id, status, total, amount_paid').eq('organization_id', orgId),
    supabase.from('quotes').select('id, status, total').eq('organization_id', orgId),
    supabase.from('deals').select('id, stage, value').eq('organization_id', orgId),
  ])

  const totalClients = clients.count ?? 0
  const totalInvoiced = (invoices.data ?? []).reduce((s, i) => s + (i.total || 0), 0)
  const totalPaid = (invoices.data ?? []).reduce((s, i) => s + (i.amount_paid || 0), 0)
  const unpaidCount = (invoices.data ?? []).filter(i => ['sent', 'overdue', 'partial'].includes(i.status)).length
  const totalQuotes = quotes.count ?? 0
  const pipelineValue = (deals.data ?? [])
    .filter(d => !['won', 'lost'].includes(d.stage))
    .reduce((s, d) => s + (d.value || 0), 0)

  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n)

  const stats = [
    { label: 'Clients', value: totalClients.toString(), icon: Users, color: 'bg-blue-50 text-blue-600', href: '/dashboard/crm', sub: 'total actifs' },
    { label: 'Chiffre facturé', value: fmt(totalInvoiced), icon: Receipt, color: 'bg-green-50 text-green-600', href: '/dashboard/facturation', sub: `${fmt(totalPaid)} encaissé` },
    { label: 'Devis en cours', value: totalQuotes.toString(), icon: FileText, color: 'bg-amber-50 text-amber-600', href: '/dashboard/devis', sub: 'total créés' },
    { label: 'Pipeline CRM', value: fmt(pipelineValue), icon: TrendingUp, color: 'bg-purple-50 text-purple-600', href: '/dashboard/crm', sub: 'opportunités ouvertes' },
  ]

  const recentInvoices = (invoices.data ?? []).slice(0, 5)

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="text-sm text-surface-500 mt-0.5">Vue d'ensemble de votre activité</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/devis" className="btn-secondary">
            <FileText className="w-4 h-4" /> Nouveau devis
          </Link>
          <Link href="/dashboard/facturation" className="btn-primary">
            <Receipt className="w-4 h-4" /> Nouvelle facture
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, href, sub }) => (
          <Link key={label} href={href} className="stat-card hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-surface-900 tracking-tight mb-0.5">{value}</div>
            <div className="text-sm font-medium text-surface-700">{label}</div>
            <div className="text-xs text-surface-400 mt-0.5">{sub}</div>
          </Link>
        ))}
      </div>

      {/* Alerts */}
      {unpaidCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-sm text-amber-800">
            <span className="font-medium">{unpaidCount} facture{unpaidCount > 1 ? 's' : ''} en attente de paiement.</span>{' '}
            <Link href="/dashboard/facturation" className="underline">Voir les factures →</Link>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent invoices */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-surface-900">Factures récentes</h2>
            <Link href="/dashboard/facturation" className="text-xs text-brand-600 hover:underline">Voir tout</Link>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="empty-state py-8">
              <Clock className="w-8 h-8 text-surface-300 mb-2" />
              <p className="text-sm text-surface-400">Aucune facture pour l'instant</p>
              <Link href="/dashboard/facturation" className="btn-primary mt-3 text-xs px-3 py-1.5">
                Créer ma première facture
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentInvoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b border-surface-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      inv.status === 'paid' ? 'bg-green-500' :
                      inv.status === 'overdue' ? 'bg-red-500' : 'bg-amber-500'
                    }`} />
                    <span className="text-sm text-surface-700">{fmt(inv.total)}</span>
                  </div>
                  <span className={`badge ${
                    inv.status === 'paid' ? 'badge-green' :
                    inv.status === 'overdue' ? 'badge-red' :
                    inv.status === 'draft' ? 'badge-gray' : 'badge-yellow'
                  }`}>
                    {inv.status === 'paid' ? 'Payée' :
                     inv.status === 'overdue' ? 'En retard' :
                     inv.status === 'draft' ? 'Brouillon' : 'Envoyée'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="card p-6">
          <h2 className="font-semibold text-surface-900 mb-4">Actions rapides</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/dashboard/crm', icon: Users, label: 'Ajouter un client', color: 'text-blue-600' },
              { href: '/dashboard/devis', icon: FileText, label: 'Créer un devis', color: 'text-amber-600' },
              { href: '/dashboard/facturation', icon: Receipt, label: 'Émettre une facture', color: 'text-green-600' },
              { href: '/dashboard/rapports', icon: TrendingUp, label: 'Voir les rapports', color: 'text-purple-600' },
            ].map(({ href, icon: Icon, label, color }) => (
              <Link key={href} href={href} className="flex items-center gap-3 p-3 rounded-xl border border-surface-100 hover:border-surface-200 hover:bg-surface-50 transition-all">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm font-medium text-surface-700">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
