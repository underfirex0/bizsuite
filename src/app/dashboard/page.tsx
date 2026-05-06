import { createClient } from '@/lib/supabase/server'
import { Users, FileText, Receipt, TrendingUp, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Not logged in</div>

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle()

    const orgId = (membership as any)?.organization_id ?? '2b72ef87-94c1-4d9e-b649-92eb3a560e15'

    if (!orgId) {
      return (
        <div className="animate-in">
          <div className="page-header">
            <h1 className="page-title">Tableau de bord</h1>
          </div>
          <div className="card p-8 text-center">
            <h2 className="font-semibold text-zinc-900 mb-2">Organisation non configurée</h2>
            <p className="text-zinc-500 text-sm">Contactez le support pour configurer votre organisation.</p>
          </div>
        </div>
      )
    }

    const [invoicesRes, quotesRes, clientsRes, dealsRes] = await Promise.all([
      supabase.from('invoices').select('id, status, total, amount_paid').eq('organization_id', orgId),
      supabase.from('quotes').select('id, status').eq('organization_id', orgId),
      supabase.from('clients').select('id', { count: 'exact' }).eq('organization_id', orgId),
      supabase.from('deals').select('id, stage, value').eq('organization_id', orgId),
    ])

    const invoices = invoicesRes.data ?? []
    const quotes = quotesRes.data ?? []
    const totalClients = clientsRes.count ?? 0
    const deals = dealsRes.data ?? []

    const totalInvoiced = invoices.reduce((s: number, i: any) => s + (i.total || 0), 0)
    const totalPaid = invoices.reduce((s: number, i: any) => s + (i.amount_paid || 0), 0)
    const unpaidCount = invoices.filter((i: any) => ['sent', 'overdue', 'partial'].includes(i.status)).length
    const pipelineValue = deals.filter((d: any) => !['won', 'lost'].includes(d.stage)).reduce((s: number, d: any) => s + (d.value || 0), 0)

    const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n)

    const stats = [
      { label: 'Clients', value: totalClients.toString(), icon: Users, color: 'bg-blue-50 text-blue-600', href: '/dashboard/crm', sub: 'total' },
      { label: 'Chiffre facturé', value: fmt(totalInvoiced), icon: Receipt, color: 'bg-green-50 text-green-600', href: '/dashboard/facturation', sub: fmt(totalPaid) + ' encaissé' },
      { label: 'Devis', value: quotes.length.toString(), icon: FileText, color: 'bg-amber-50 text-amber-600', href: '/dashboard/devis', sub: 'total créés' },
      { label: 'Pipeline', value: fmt(pipelineValue), icon: TrendingUp, color: 'bg-purple-50 text-purple-600', href: '/dashboard/crm', sub: 'opportunités' },
    ]

    return (
      <div className="animate-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Tableau de bord</h1>
            <p className="text-sm text-zinc-500 mt-0.5">Vue d'ensemble de votre activité</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/devis/new" className="btn-secondary">
              <FileText className="w-4 h-4" /> Nouveau devis
            </Link>
            <Link href="/dashboard/facturation/new" className="btn-primary">
              <Receipt className="w-4 h-4" /> Nouvelle facture
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color, href, sub }) => (
            <Link key={label} href={href} className="stat-card hover:shadow-md transition-shadow">
              <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-zinc-900 tracking-tight mb-0.5">{value}</div>
              <div className="text-sm font-medium text-zinc-700">{label}</div>
              <div className="text-xs text-zinc-400 mt-0.5">{sub}</div>
            </Link>
          ))}
        </div>

        {unpaidCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <div className="text-sm text-amber-800">
              <span className="font-medium">{unpaidCount} facture{unpaidCount > 1 ? 's' : ''} en attente.</span>{' '}
              <Link href="/dashboard/facturation" className="underline">Voir →</Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {[
            { href: '/dashboard/crm/new', icon: Users, label: 'Ajouter un client', color: 'text-blue-600' },
            { href: '/dashboard/devis/new', icon: FileText, label: 'Créer un devis', color: 'text-amber-600' },
            { href: '/dashboard/facturation/new', icon: Receipt, label: 'Émettre une facture', color: 'text-green-600' },
            { href: '/dashboard/rapports', icon: TrendingUp, label: 'Voir les rapports', color: 'text-purple-600' },
          ].map(({ href, icon: Icon, label, color }) => (
            <Link key={href} href={href} className="flex items-center gap-3 p-4 card hover:shadow-md transition-shadow">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-sm font-medium text-zinc-700">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    )
  } catch (e) {
    return (
      <div className="animate-in">
        <div className="page-title mb-4">Tableau de bord</div>
        <div className="card p-6 text-red-500 text-sm">Erreur de chargement. Veuillez rafraîchir la page.</div>
      </div>
    )
  }
}