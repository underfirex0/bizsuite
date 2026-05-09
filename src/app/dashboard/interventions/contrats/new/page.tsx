'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewContratPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orgId, setOrgId] = useState('')
  const [userId, setUserId] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [form, setForm] = useState({
    title: '', client_id: '', description: '', frequency: 'annual',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    amount: '', next_intervention_date: '', auto_renew: false, notes: '',
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data: m } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle()
      if (!m) return
      const oid = (m as any).organization_id
      setOrgId(oid)
      const { data: c } = await supabase.from('clients').select('id, name').eq('organization_id', oid).order('name')
      setClients(c ?? [])
    }
    load()
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId) { setError('Organisation introuvable.'); return }
    setLoading(true)
    const supabase = createClient()
    const { data: org } = await supabase.from('organizations').select('next_invoice_number').eq('id', orgId).single()
    const contractNumber = `CTR-${String((org as any)?.next_invoice_number || 1).padStart(4, '0')}`

    const { error: err } = await supabase.from('maintenance_contracts').insert({
      organization_id: orgId,
      contract_number: contractNumber,
      title: form.title,
      client_id: form.client_id || null,
      description: form.description || null,
      frequency: form.frequency,
      start_date: form.start_date,
      end_date: form.end_date || null,
      amount: parseFloat(form.amount) || 0,
      next_intervention_date: form.next_intervention_date || null,
      auto_renew: form.auto_renew,
      notes: form.notes || null,
      status: 'active',
      created_by: userId,
    } as any)

    if (err) { setError(err.message); setLoading(false); return }
    await supabase.from('organizations').update({ next_invoice_number: ((org as any)?.next_invoice_number || 1) + 1 } as any).eq('id', orgId)
    router.push('/dashboard/interventions/contrats')
  }

  return (
    <div className="animate-in max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/interventions/contrats" className="btn-ghost px-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="page-title">Nouveau contrat de maintenance</h1>
          <p className="text-sm text-zinc-500">Contrat récurrent avec un client</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-6 space-y-4">
          <div>
            <label className="input-label">Titre du contrat *</label>
            <input className="input" placeholder="Maintenance annuelle climatisation" value={form.title} onChange={set('title')} required />
          </div>
          <div>
            <label className="input-label">Client</label>
            <select className="select" value={form.client_id} onChange={set('client_id')}>
              <option value="">Sélectionner un client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Description</label>
            <textarea className="input resize-none h-20" placeholder="Détail des prestations incluses..." value={form.description} onChange={set('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Fréquence</label>
              <select className="select" value={form.frequency} onChange={set('frequency')}>
                <option value="monthly">Mensuel</option>
                <option value="quarterly">Trimestriel</option>
                <option value="biannual">Semestriel</option>
                <option value="annual">Annuel</option>
              </select>
            </div>
            <div>
              <label className="input-label">Montant (MAD)</label>
              <input className="input" type="number" min="0" step="0.01" placeholder="2500" value={form.amount} onChange={set('amount')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Date début</label>
              <input className="input" type="date" value={form.start_date} onChange={set('start_date')} />
            </div>
            <div>
              <label className="input-label">Date fin</label>
              <input className="input" type="date" value={form.end_date} onChange={set('end_date')} />
            </div>
          </div>
          <div>
            <label className="input-label">Prochaine intervention</label>
            <input className="input" type="date" value={form.next_intervention_date} onChange={set('next_intervention_date')} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.auto_renew} onChange={set('auto_renew')} className="w-4 h-4 rounded" />
            <span className="text-sm text-zinc-700">Renouvellement automatique</span>
          </label>
          <div>
            <label className="input-label">Notes</label>
            <textarea className="input resize-none h-16" value={form.notes} onChange={set('notes')} />
          </div>
        </div>
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>}
        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Création…' : 'Créer le contrat'}
          </button>
          <Link href="/dashboard/interventions/contrats" className="btn-secondary">Annuler</Link>
        </div>
      </form>
    </div>
  )
}
