import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText, Plus } from 'lucide-react'
import Link from 'next/link'

const FREQ: Record<string, string> = { monthly: 'Mensuel', quarterly: 'Trimestriel', biannual: 'Semestriel', annual: 'Annuel' }
const STATUS_COLOR: Record<string, string> = { active: 'badge-green', expired: 'badge-red', cancelled: 'badge-gray', pending: 'badge-yellow' }
const STATUS_LABEL: Record<string, string> = { active: 'Actif', expired: 'Expiré', cancelled: 'Annulé', pending: 'En attente' }

export default async function ContratsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: m } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle()
  const orgId = (m as any)?.organization_id

  const { data: contracts } = orgId
    ? await supabase.from('maintenance_contracts').select('*, clients(name)').eq('organization_id', orgId).order('created_at', { ascending: false })
    : { data: [] }

  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Contrats de maintenance</h1>
          <p className="text-sm text-zinc-500">{contracts?.length ?? 0} contrats</p>
        </div>
        <Link href="/dashboard/interventions/contrats/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Nouveau contrat
        </Link>
      </div>

      {(!contracts || contracts.length === 0) ? (
        <div className="card">
          <div className="empty-state">
            <FileText className="w-8 h-8 text-zinc-300 mb-2" />
            <p className="text-sm text-zinc-400 mb-3">Aucun contrat encore</p>
            <Link href="/dashboard/interventions/contrats/new" className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> Nouveau contrat
            </Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>N°</th><th>Client</th><th>Titre</th><th>Fréquence</th><th>Montant</th><th>Début</th><th>Fin</th><th>Prochain RDV</th><th>Statut</th></tr>
              </thead>
              <tbody>
                {contracts.map((c: any) => (
                  <tr key={c.id}>
                    <td><span className="font-mono text-sm text-zinc-700">{c.contract_number}</span></td>
                    <td className="font-medium text-zinc-800">{(c.clients as any)?.name ?? '—'}</td>
                    <td className="text-zinc-600">{c.title}</td>
                    <td><span className="badge badge-blue">{FREQ[c.frequency]}</span></td>
                    <td className="font-medium text-zinc-800">{fmt(c.amount)}</td>
                    <td className="text-zinc-500 text-xs">{new Date(c.start_date).toLocaleDateString('fr-FR')}</td>
                    <td className="text-zinc-500 text-xs">{c.end_date ? new Date(c.end_date).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className={`text-xs font-medium ${c.next_intervention_date && new Date(c.next_intervention_date) <= new Date(Date.now() + 7 * 86400000) ? 'text-red-600' : 'text-zinc-500'}`}>
                      {c.next_intervention_date ? new Date(c.next_intervention_date).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td><span className={`badge ${STATUS_COLOR[c.status]}`}>{STATUS_LABEL[c.status]}</span></td>
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
