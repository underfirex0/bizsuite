import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Receipt, Plus } from 'lucide-react'
import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = { draft: 'Brouillon', sent: 'Envoyée', viewed: 'Consultée', partial: 'Partielle', paid: 'Payée', overdue: 'En retard', cancelled: 'Annulée' }
const STATUS_COLOR: Record<string, string> = { draft: 'badge-gray', sent: 'badge-blue', viewed: 'badge-blue', partial: 'badge-yellow', paid: 'badge-green', overdue: 'badge-red', cancelled: 'badge-gray' }

export default async function FacturationPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: m } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle()
  const orgId = (m as any)?.organization_id

  const { data: invoices } = orgId ? await supabase.from('invoices').select('*, clients(name)').eq('organization_id', orgId).order('created_at', { ascending: false }) : { data: [] }

  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n)
  const totalUnpaid = (invoices ?? []).filter((i: any) => ['sent', 'overdue', 'partial'].includes(i.status)).reduce((s: number, i: any) => s + (i.total - i.amount_paid), 0)

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Facturation</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{invoices?.length ?? 0} factures · <span className="text-amber-600 font-medium">{fmt(totalUnpaid)} à encaisser</span></p>
        </div>
        <Link href="/dashboard/facturation/new" className="btn-primary"><Plus className="w-4 h-4" /> Nouvelle facture</Link>
      </div>

      {(!invoices || invoices.length === 0) ? (
        <div className="card">
          <div className="empty-state">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-4"><Receipt className="w-7 h-7 text-green-400" /></div>
            <h3 className="font-semibold text-zinc-900 mb-1">Aucune facture encore</h3>
            <p className="text-sm text-zinc-500 mb-4">Créez votre première facture en quelques clics</p>
            <Link href="/dashboard/facturation/new" className="btn-primary"><Plus className="w-4 h-4" /> Créer une facture</Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead><tr><th>N° Facture</th><th>Client</th><th>Date</th><th>Échéance</th><th>Montant</th><th>Payé</th><th>Statut</th></tr></thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id}>
                    <td><span className="font-mono text-sm font-medium text-zinc-800">{inv.invoice_number}</span></td>
                    <td className="font-medium text-zinc-800">{inv.clients?.name ?? '—'}</td>
                    <td className="text-zinc-500 text-xs">{new Date(inv.issue_date).toLocaleDateString('fr-FR')}</td>
                    <td className="text-zinc-500 text-xs">{inv.due_date ? new Date(inv.due_date).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="font-medium text-zinc-900">{fmt(inv.total)}</td>
                    <td className="text-green-600 font-medium">{fmt(inv.amount_paid)}</td>
                    <td><span className={`badge ${STATUS_COLOR[inv.status]}`}>{STATUS_LABEL[inv.status]}</span></td>
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
