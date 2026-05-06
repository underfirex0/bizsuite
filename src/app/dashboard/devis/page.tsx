import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText, Plus } from 'lucide-react'
import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = { draft: 'Brouillon', sent: 'Envoyé', viewed: 'Consulté', accepted: 'Accepté', rejected: 'Refusé', expired: 'Expiré' }
const STATUS_COLOR: Record<string, string> = { draft: 'badge-gray', sent: 'badge-blue', viewed: 'badge-purple', accepted: 'badge-green', rejected: 'badge-red', expired: 'badge-orange' }

export default async function DevisPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: m } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle()
  const orgId = (m as any)?.organization_id

  const { data: quotes } = orgId ? await supabase.from('quotes').select('*, clients(name)').eq('organization_id', orgId).order('created_at', { ascending: false }) : { data: [] }

  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Devis</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{quotes?.length ?? 0} devis</p>
        </div>
        <Link href="/dashboard/devis/new" className="btn-primary"><Plus className="w-4 h-4" /> Nouveau devis</Link>
      </div>

      {(!quotes || quotes.length === 0) ? (
        <div className="card">
          <div className="empty-state">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4"><FileText className="w-7 h-7 text-amber-400" /></div>
            <h3 className="font-semibold text-zinc-900 mb-1">Aucun devis encore</h3>
            <p className="text-sm text-zinc-500 mb-4">Créez votre premier devis professionnel</p>
            <Link href="/dashboard/devis/new" className="btn-primary"><Plus className="w-4 h-4" /> Créer un devis</Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead><tr><th>N° Devis</th><th>Client</th><th>Titre</th><th>Date</th><th>Expiration</th><th>Montant</th><th>Statut</th><th></th></tr></thead>
              <tbody>
                {quotes.map((q: any) => {
                  const isExpired = q.expiry_date && new Date(q.expiry_date) < new Date() && q.status === 'sent'
                  const status = isExpired ? 'expired' : q.status
                  return (
                    <tr key={q.id}>
                      <td><span className="font-mono text-sm font-medium text-zinc-800">{q.quote_number}</span></td>
                      <td className="font-medium text-zinc-800">{q.clients?.name ?? '—'}</td>
                      <td className="text-zinc-600">{q.title ?? '—'}</td>
                      <td className="text-zinc-500 text-xs">{new Date(q.issue_date).toLocaleDateString('fr-FR')}</td>
                      <td className={`text-xs ${isExpired ? 'text-red-500 font-medium' : 'text-zinc-500'}`}>{q.expiry_date ? new Date(q.expiry_date).toLocaleDateString('fr-FR') : '—'}</td>
                      <td className="font-medium text-zinc-900">{fmt(q.total)}</td>
                      <td><span className={`badge ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</span></td>
                      <td>{q.status === 'accepted' && <Link href={`/dashboard/facturation/new?from_quote=${q.id}`} className="text-xs text-indigo-600 hover:underline font-medium">→ Facturer</Link>}</td>
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
