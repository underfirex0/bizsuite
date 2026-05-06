import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RapportsCharts } from './charts'

export default async function RapportsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: m } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle()
  const orgId = (m as any)?.organization_id

  if (!orgId) return (
    <div className="animate-in">
      <h1 className="page-title mb-4">Rapports & KPIs</h1>
      <div className="card p-8 text-center text-zinc-500 text-sm">Aucune donnée disponible.</div>
    </div>
  )

  const [invoicesRes, quotesRes, clientsRes, dealsRes] = await Promise.all([
    supabase.from('invoices').select('total, amount_paid, status, issue_date').eq('organization_id', orgId),
    supabase.from('quotes').select('total, status').eq('organization_id', orgId),
    supabase.from('clients').select('id', { count: 'exact' }).eq('organization_id', orgId),
    supabase.from('deals').select('value, stage').eq('organization_id', orgId),
  ])

  const invoices = invoicesRes.data ?? []
  const quotes = quotesRes.data ?? []
  const deals = dealsRes.data ?? []

  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('fr-FR', { month: 'short' }) }
  })

  const monthlyRevenue = months.map(m => ({
    month: m.label,
    facturé: invoices.filter((i: any) => i.issue_date?.startsWith(m.key)).reduce((s: number, i: any) => s + (i.total || 0), 0),
    encaissé: invoices.filter((i: any) => i.issue_date?.startsWith(m.key)).reduce((s: number, i: any) => s + (i.amount_paid || 0), 0),
  }))

  const invoiceStatus = ['draft', 'sent', 'paid', 'overdue', 'partial'].map(s => ({
    name: { draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', overdue: 'En retard', partial: 'Partielle' }[s] ?? s,
    value: invoices.filter((i: any) => i.status === s).length,
  })).filter(s => s.value > 0)

  const pipeline = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].map(stage => ({
    stage: { lead: 'Lead', qualified: 'Qualifié', proposal: 'Proposition', negotiation: 'Négo.', won: 'Gagné', lost: 'Perdu' }[stage] ?? stage,
    count: deals.filter((d: any) => d.stage === stage).length,
    value: deals.filter((d: any) => d.stage === stage).reduce((s: number, d: any) => s + (d.value || 0), 0),
  }))

  const totalRevenue = invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + (i.total || 0), 0)
  const totalPending = invoices.filter((i: any) => ['sent', 'partial', 'overdue'].includes(i.status)).reduce((s: number, i: any) => s + (i.total - i.amount_paid), 0)
  const conversionRate = quotes.length > 0 ? Math.round(quotes.filter((q: any) => q.status === 'accepted').length / quotes.length * 100) : 0

  return <RapportsCharts monthlyRevenue={monthlyRevenue} invoiceStatus={invoiceStatus} pipeline={pipeline} stats={{ totalRevenue, totalPending, totalClients: clientsRes.count ?? 0, conversionRate }} />
}
