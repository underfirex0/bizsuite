import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RapportsCharts } from './charts'

export default async function RapportsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('organization_members').select('organization_id').eq('user_id', user.id).single()
  if (!membership) redirect('/auth/register')
  const orgId = membership.organization_id

  const [invoicesRes, quotesRes, clientsRes, dealsRes] = await Promise.all([
    supabase.from('invoices').select('total, amount_paid, status, created_at, issue_date').eq('organization_id', orgId),
    supabase.from('quotes').select('total, status, created_at').eq('organization_id', orgId),
    supabase.from('clients').select('id, status, created_at').eq('organization_id', orgId),
    supabase.from('deals').select('value, stage, created_at').eq('organization_id', orgId),
  ])

  const invoices = invoicesRes.data ?? []
  const quotes = quotesRes.data ?? []
  const clients = clientsRes.data ?? []
  const deals = dealsRes.data ?? []

  // Build monthly revenue (last 6 months)
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('fr-FR', { month: 'short' }) }
  })

  const monthlyRevenue = months.map(m => ({
    month: m.label,
    facturé: invoices.filter(i => i.issue_date?.startsWith(m.key)).reduce((s, i) => s + (i.total || 0), 0),
    encaissé: invoices.filter(i => i.issue_date?.startsWith(m.key)).reduce((s, i) => s + (i.amount_paid || 0), 0),
  }))

  // Invoice status breakdown
  const invoiceStatus = ['draft', 'sent', 'paid', 'overdue', 'partial'].map(s => ({
    name: { draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', overdue: 'En retard', partial: 'Partielle', cancelled: 'Annulée' }[s] ?? s,
    value: invoices.filter(i => i.status === s).length,
  })).filter(s => s.value > 0)

  // Deal pipeline
  const pipeline = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].map(stage => ({
    stage: { lead: 'Lead', qualified: 'Qualifié', proposal: 'Proposition', negotiation: 'Négo.', won: 'Gagné', lost: 'Perdu' }[stage] ?? stage,
    count: deals.filter(d => d.stage === stage).length,
    value: deals.filter(d => d.stage === stage).reduce((s, d) => s + (d.value || 0), 0),
  }))

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0)
  const totalPending = invoices.filter(i => ['sent', 'partial', 'overdue'].includes(i.status)).reduce((s, i) => s + (i.total - i.amount_paid), 0)
  const conversionRate = quotes.length > 0 ? Math.round(quotes.filter(q => q.status === 'accepted').length / quotes.length * 100) : 0

  return (
    <RapportsCharts
      monthlyRevenue={monthlyRevenue}
      invoiceStatus={invoiceStatus}
      pipeline={pipeline}
      stats={{ totalRevenue, totalPending, totalClients: clients.length, conversionRate }}
    />
  )
}
