'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { Client } from '@/types/database'

interface LineItem {
  description: string
  quantity: number
  unit_price: number
  tax_rate: number
  discount_percent: number
}

const defaultItem = (): LineItem => ({
  description: '', quantity: 1, unit_price: 0, tax_rate: 20, discount_percent: 0
})

export default function NewDevisPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [orgId, setOrgId] = useState('')
  const [form, setForm] = useState({
    client_id: '', title: '', notes: '', terms: '',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
  })
  const [items, setItems] = useState<LineItem[]>([defaultItem()])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: m } = await supabase
        .from('organization_members').select('organization_id').eq('user_id', user.id).single()
      if (!m) return
      setOrgId(m.organization_id)
      const { data: c } = await supabase
        .from('clients').select('*').eq('organization_id', m.organization_id)
      setClients(c ?? [])
    }
    load()
  }, [])

  const setItem = (i: number, k: keyof LineItem, v: string | number) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item))

  const subtotalItem = (item: LineItem) => {
    const base = item.quantity * item.unit_price
    return base - base * (item.discount_percent / 100)
  }
  const taxItem = (item: LineItem) => subtotalItem(item) * (item.tax_rate / 100)
  const subtotal = items.reduce((s, i) => s + subtotalItem(i), 0)
  const taxAmount = items.reduce((s, i) => s + taxItem(i), 0)
  const total = subtotal + taxAmount
  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2 }).format(n)

  const handleSubmit = async (status: 'draft' | 'sent') => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: org } = await supabase
      .from('organizations').select('next_quote_number, quote_prefix').eq('id', orgId).single()

    const quoteNumber = `${org?.quote_prefix ?? 'DEV'}-${String(org?.next_quote_number ?? 1).padStart(4, '0')}`

    const { data: quote, error } = await supabase.from('quotes').insert({
      ...form,
      status,
      organization_id: orgId,
      quote_number: quoteNumber,
      subtotal, tax_amount: taxAmount, discount_amount: 0, total,
      currency: 'MAD',
      created_by: user.id,
      client_id: form.client_id || null,
    } as any).select().single()

    if (error || !quote) { setLoading(false); return }

    await supabase.from('quote_items').insert(
      items.map((item, i) => ({ quote_id: (quote as any).id, ...item, subtotal: subtotalItem(item), position: i })) as any
    )
    await supabase.from('organizations').update({
      next_quote_number: (org?.next_quote_number ?? 1) + 1
    }).eq('id', orgId)

    router.push('/dashboard/devis')
  }

  return (
    <div className="animate-in max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/devis" className="btn-ghost px-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="page-title">Nouveau devis</h1>
          <p className="text-sm text-zinc-500">Remplissez les détails du devis</p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="card p-6 grid grid-cols-2 gap-5">
          <div>
            <label className="input-label">Client</label>
            <select className="select" value={form.client_id}
              onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
              <option value="">Sélectionner un client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Titre du devis</label>
            <input className="input" placeholder="Ex: Développement site web" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="input-label">Date d'émission</label>
            <input type="date" className="input" value={form.issue_date}
              onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
          </div>
          <div>
            <label className="input-label">Date d'expiration</label>
            <input type="date" className="input" value={form.expiry_date}
              onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-medium text-zinc-900 mb-4">Prestations</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-zinc-500 px-1">
              <div className="col-span-4">Description</div>
              <div className="col-span-2">Qté</div>
              <div className="col-span-2">P.U.</div>
              <div className="col-span-1">TVA</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-1"></div>
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <input className="input text-sm" placeholder="Description"
                    value={item.description} onChange={e => setItem(i, 'description', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <input className="input text-sm" type="number" min="0" step="0.01"
                    value={item.quantity} onChange={e => setItem(i, 'quantity', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-2">
                  <input className="input text-sm" type="number" min="0" step="0.01"
                    value={item.unit_price} onChange={e => setItem(i, 'unit_price', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-1">
                  <input className="input text-sm" type="number" min="0" max="100"
                    value={item.tax_rate} onChange={e => setItem(i, 'tax_rate', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-2 text-sm font-medium text-right text-zinc-700 px-2">
                  {fmt(subtotalItem(item) + taxItem(item))}
                </div>
                <div className="col-span-1 flex justify-end">
                  {items.length > 1 && (
                    <button onClick={() => setItems(p => p.filter((_, idx) => idx !== i))}
                      className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button onClick={() => setItems(p => [...p, defaultItem()])} className="btn-ghost text-indigo-600 text-sm">
              <Plus className="w-3.5 h-3.5" /> Ajouter une ligne
            </button>
          </div>
          <div className="mt-6 pt-5 border-t border-zinc-100 flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-zinc-600">
                <span>Sous-total HT</span><span>{fmt(subtotal)} MAD</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-600">
                <span>TVA</span><span>{fmt(taxAmount)} MAD</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-zinc-900 pt-2 border-t border-zinc-100">
                <span>Total TTC</span><span>{fmt(total)} MAD</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6 grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Notes</label>
            <textarea className="input resize-none h-20 text-sm" placeholder="Notes…"
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div>
            <label className="input-label">Conditions</label>
            <textarea className="input resize-none h-20 text-sm" placeholder="Conditions de validité…"
              value={form.terms} onChange={e => setForm(f => ({ ...f, terms: e.target.value }))} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => handleSubmit('sent')} className="btn-primary" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Créer et envoyer
          </button>
          <button onClick={() => handleSubmit('draft')} className="btn-secondary" disabled={loading}>
            Sauvegarder en brouillon
          </button>
          <Link href="/dashboard/devis" className="btn-ghost">Annuler</Link>
        </div>
      </div>
    </div>
  )
}
