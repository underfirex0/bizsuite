'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Part { name: string; reference: string; quantity: number; unit_price: number }

export default function NewInterventionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orgId, setOrgId] = useState('')
  const [userId, setUserId] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [techniciens, setTechniciens] = useState<any[]>([])
  const [equipment, setEquipment] = useState<any[]>([])
  const [parts, setParts] = useState<Part[]>([])
  const [form, setForm] = useState({
    title: '', type: 'maintenance', priority: 'normal', status: 'pending',
    client_id: '', technicien_id: '', equipment_id: '',
    scheduled_date: '', address: '', description: '',
    labor_cost: '0', travel_cost: '0', diagnostic: '', work_done: '', notes: '',
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
      const [cRes, tRes] = await Promise.all([
        supabase.from('clients').select('id, name, phone, address').eq('organization_id', oid).order('name'),
        supabase.from('techniciens').select('*').eq('organization_id', oid).eq('is_active', true),
      ])
      setClients(cRes.data ?? [])
      setTechniciens(tRes.data ?? [])
    }
    load()
  }, [])

  // Load equipment when client changes
  useEffect(() => {
    if (!form.client_id || !orgId) return
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('client_equipment').select('*').eq('organization_id', orgId).eq('client_id', form.client_id)
      setEquipment(data ?? [])
    }
    load()
    // Auto-fill address from client
    const client = clients.find(c => c.id === form.client_id)
    if (client?.address) setForm(f => ({ ...f, address: client.address }))
  }, [form.client_id, orgId])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const addPart = () => setParts(p => [...p, { name: '', reference: '', quantity: 1, unit_price: 0 }])
  const setPart = (i: number, k: keyof Part, v: string | number) =>
    setParts(p => p.map((part, idx) => idx === i ? { ...part, [k]: v } : part))
  const removePart = (i: number) => setParts(p => p.filter((_, idx) => idx !== i))

  const partsCost = parts.reduce((s, p) => s + p.quantity * p.unit_price, 0)
  const totalCost = (parseFloat(form.labor_cost) || 0) + (parseFloat(form.travel_cost) || 0) + partsCost

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId) { setError('Organisation introuvable.'); return }
    setLoading(true)
    const supabase = createClient()

    const { data: org } = await supabase.from('organizations').select('next_invoice_number').eq('id', orgId).single()
    const intNumber = `INT-${String((org as any)?.next_invoice_number || 1).padStart(4, '0')}`

    const { data: intervention, error: err } = await supabase.from('interventions').insert({
      organization_id: orgId,
      intervention_number: intNumber,
      title: form.title,
      type: form.type,
      priority: form.priority,
      status: form.status,
      client_id: form.client_id || null,
      technicien_id: form.technicien_id || null,
      equipment_id: form.equipment_id || null,
      scheduled_date: form.scheduled_date || null,
      address: form.address || null,
      description: form.description || null,
      diagnostic: form.diagnostic || null,
      work_done: form.work_done || null,
      notes: form.notes || null,
      labor_cost: parseFloat(form.labor_cost) || 0,
      travel_cost: parseFloat(form.travel_cost) || 0,
      parts_cost: partsCost,
      total_cost: totalCost,
      created_by: userId,
    } as any).select().single()

    if (err || !intervention) { setError(err?.message ?? 'Erreur'); setLoading(false); return }

    // Insert parts
    if (parts.length > 0) {
      await supabase.from('intervention_parts').insert(
        parts.filter(p => p.name).map(p => ({
          intervention_id: (intervention as any).id,
          name: p.name,
          reference: p.reference || null,
          quantity: p.quantity,
          unit_price: p.unit_price,
          total_price: p.quantity * p.unit_price,
        })) as any
      )
    }

    await supabase.from('organizations').update({ next_invoice_number: ((org as any)?.next_invoice_number || 1) + 1 } as any).eq('id', orgId)
    router.push('/dashboard/interventions/list')
  }

  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2 }).format(n)

  return (
    <div className="animate-in max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/interventions" className="btn-ghost px-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="page-title">Nouvelle intervention</h1>
          <p className="text-sm text-zinc-500">Bon d'intervention / Ordre de travail</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Infos principales */}
        <div className="card p-6 space-y-4">
          <h2 className="font-medium text-zinc-900">Informations générales</h2>
          <div>
            <label className="input-label">Titre / Objet *</label>
            <input className="input" placeholder="Ex: Maintenance climatisation split bureau" value={form.title} onChange={set('title')} required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="input-label">Type</label>
              <select className="select" value={form.type} onChange={set('type')}>
                <option value="maintenance">Maintenance</option>
                <option value="installation">Installation</option>
                <option value="repair">Réparation</option>
                <option value="diagnosis">Diagnostic</option>
                <option value="emergency">Urgence</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className="input-label">Priorité</label>
              <select className="select" value={form.priority} onChange={set('priority')}>
                <option value="low">Faible</option>
                <option value="normal">Normale</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <div>
              <label className="input-label">Statut</label>
              <select className="select" value={form.status} onChange={set('status')}>
                <option value="pending">En attente</option>
                <option value="scheduled">Planifiée</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminée</option>
              </select>
            </div>
          </div>
        </div>

        {/* Client + Tech */}
        <div className="card p-6 space-y-4">
          <h2 className="font-medium text-zinc-900">Client & Technicien</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Client</label>
              <select className="select" value={form.client_id} onChange={set('client_id')}>
                <option value="">Sélectionner un client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Technicien</label>
              <select className="select" value={form.technicien_id} onChange={set('technicien_id')}>
                <option value="">Non assigné</option>
                {techniciens.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
              </select>
            </div>
          </div>
          {equipment.length > 0 && (
            <div>
              <label className="input-label">Équipement concerné</label>
              <select className="select" value={form.equipment_id} onChange={set('equipment_id')}>
                <option value="">Sélectionner un équipement</option>
                {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name} {eq.brand} {eq.model}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Date planifiée</label>
              <input className="input" type="datetime-local" value={form.scheduled_date} onChange={set('scheduled_date')} />
            </div>
            <div>
              <label className="input-label">Adresse d'intervention</label>
              <input className="input" placeholder="Adresse du site" value={form.address} onChange={set('address')} />
            </div>
          </div>
          <div>
            <label className="input-label">Description du problème</label>
            <textarea className="input resize-none h-20" placeholder="Décrire la demande ou le problème signalé..." value={form.description} onChange={set('description')} />
          </div>
        </div>

        {/* Rapport technique */}
        <div className="card p-6 space-y-4">
          <h2 className="font-medium text-zinc-900">Rapport technique</h2>
          <div>
            <label className="input-label">Diagnostic</label>
            <textarea className="input resize-none h-20" placeholder="Diagnostic effectué sur site..." value={form.diagnostic} onChange={set('diagnostic')} />
          </div>
          <div>
            <label className="input-label">Travaux effectués</label>
            <textarea className="input resize-none h-20" placeholder="Détail des travaux réalisés..." value={form.work_done} onChange={set('work_done')} />
          </div>
        </div>

        {/* Pièces utilisées */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-zinc-900">Pièces & Matériaux</h2>
            <button type="button" onClick={addPart} className="btn-ghost text-indigo-600 text-sm">
              <Plus className="w-3.5 h-3.5" /> Ajouter une pièce
            </button>
          </div>
          {parts.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-zinc-500 px-1">
                <div className="col-span-4">Désignation</div>
                <div className="col-span-2">Réf.</div>
                <div className="col-span-2">Qté</div>
                <div className="col-span-2">P.U.</div>
                <div className="col-span-1 text-right">Total</div>
                <div className="col-span-1"></div>
              </div>
              {parts.map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <input className="input text-sm" placeholder="Filtre, courroie..." value={p.name} onChange={e => setPart(i, 'name', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <input className="input text-sm" placeholder="REF-001" value={p.reference} onChange={e => setPart(i, 'reference', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <input className="input text-sm" type="number" min="0" step="0.01" value={p.quantity} onChange={e => setPart(i, 'quantity', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-2">
                    <input className="input text-sm" type="number" min="0" step="0.01" value={p.unit_price} onChange={e => setPart(i, 'unit_price', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-1 text-sm text-zinc-600 text-right">{fmt(p.quantity * p.unit_price)}</div>
                  <div className="col-span-1 flex justify-end">
                    <button type="button" onClick={() => removePart(i)} className="p-1 text-zinc-400 hover:text-red-500 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coûts & Total */}
        <div className="card p-6 space-y-4">
          <h2 className="font-medium text-zinc-900">Facturation</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Main d'oeuvre (MAD)</label>
              <input className="input" type="number" min="0" step="0.01" value={form.labor_cost} onChange={set('labor_cost')} />
            </div>
            <div>
              <label className="input-label">Déplacement (MAD)</label>
              <input className="input" type="number" min="0" step="0.01" value={form.travel_cost} onChange={set('travel_cost')} />
            </div>
          </div>
          <div className="border-t border-zinc-100 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-zinc-600"><span>Main d'oeuvre</span><span>{fmt(parseFloat(form.labor_cost) || 0)} MAD</span></div>
            <div className="flex justify-between text-sm text-zinc-600"><span>Pièces</span><span>{fmt(partsCost)} MAD</span></div>
            <div className="flex justify-between text-sm text-zinc-600"><span>Déplacement</span><span>{fmt(parseFloat(form.travel_cost) || 0)} MAD</span></div>
            <div className="flex justify-between text-base font-semibold text-zinc-900 pt-2 border-t border-zinc-100">
              <span>Total</span><span>{fmt(totalCost)} MAD</span>
            </div>
          </div>
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>}

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Création…' : `Créer l'intervention`}
          </button>
          <Link href="/dashboard/interventions" className="btn-secondary">Annuler</Link>
        </div>
      </form>
    </div>
  )
}
