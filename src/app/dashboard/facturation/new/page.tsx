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

export default function NewInvoicePage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [orgId, setOrgId] = useState('')
  const [form, setForm] = useState({
    client_id: '', status: 'draft', notes: '', terms: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  })
  const [items, setItems] = useState<LineItem[]>([defaultItem()])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: m } = await supabase
        .from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle()
      if (!m) return
      setOrgId(m.organization_id)

      const { data: c } = await supabase
        .from('clients').select('*').eq('organization_id', m.organization_id).eq('status', 'active')
      setClients(c ?? [])
    }
    load()
  }, [])

  const setItem = (i: number, k: keyof LineItem, v: string | number) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item))

  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))

  const subtotalItem = (item: LineItem) => {
    const base = item.quantity * item.unit_price
    const disc = base * (item.discount_percent / 100)
    return base - disc
  }

  const taxItem = (item: LineItem) => subtotalItem(item) * (item.tax_rate / 100)

  const subtotal = items.reduce((s, i) => s + subtotalItem(i), 0)
  const taxAmount = items.reduce((s, i) => s + taxItem(i), 0)
  const total = subtotal + taxAmount

  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

  const handleSubmit = async (status: 'draft' | 'sent') => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get next invoice number
    const { data: org } = await supabase
      .from('organizations').select('next_invoice_number, invoice_prefix').eq('id', orgId).single()

    const invoiceNumber = `${org?.invoice_prefix ?? 'INV'}-${String(org?.next_invoice_number ?? 1).padStart(4, '0')}`

    const { data: invoice, error } = await supabase.from('invoices').insert({
      ...form,
      status,
      organization_id: orgId,
      invoice_number: invoiceNumber,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: 0,
      total,
      amount_paid: 0,
      currency: 'MAD',
      created_by: user.id,
      client_id: form.client_id || null,
    } as any).select().single()

    if (error || !invoice) { setLoading(false); return }

    // Insert items
    await supabase.from('invoice_items').insert(
      items.map((item, i) => ({
        invoice_id: (invoice as any).id,
        ...item,
        subtotal: subtotalItem(item),
        position: i,
      })) as any
    )

    // Increment invoice number
    await supabase.from('organizations').update({
      next_invoice_number: (org?.next_invoice_number ?? 1) + 1
    }).eq('id', orgId)

    router.push('/dashboard/facturation')
  }

  return (
    <div className="animate-in max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/facturation" className="btn-ghost px-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="page-title">Nouvelle facture</h1>
          <p className="text-sm text-zinc-500">Remplissez les détails de la facture</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Header info */}
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
            <label className="input-label">Statut initial</label>
            <select className="select" value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="draft">Brouillon</option>
              <option value="sent">Envoyée directement</option>
            </select>
          </div>
          <div>
            <label className="input-label">Date d'émission</label>
            <input type="date" className="input" value={form.issue_date}
              onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
          </div>
          <div>
            <label className="input-label">Date d'échéance</label>
            <input type="date" className="input" value={form.due_date}
              onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
          </div>
        </div>

        {/* Line items */}
        <div className="card p-6">
          <h2 className="font-medium text-zinc-900 mb-4">Lignes de facturation</h2>
          <div className="space-y-3">
            {/* Header row */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-zinc-500 px-1">
              <div className="col-span-4">Description</div>
              <div className="col-span-2">Qté</div>
              <div className="col-span-2">P.U. (MAD)</div>
              <div className="col-span-1">TVA %</div>
              <div className="col-span-2">Sous-total</div>
              <div className="col-span-1"></div>
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <input className="input text-sm" placeholder="Description du service"
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
                <div className="col-span-2 text-sm font-medium text-zinc-700 text-right px-2">
                  {fmt(subtotalItem(item) + taxItem(item))}
                </div>
                <div className="col-span-1 flex justify-end">
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button onClick={() => setItems(p => [...p, defaultItem()])}
              className="btn-ghost text-indigo-600 text-sm mt-1">
              <Plus className="w-3.5 h-3.5" /> Ajouter une ligne
            </button>
          </div>

          {/* Totals */}
          <div className="mt-6 pt-5 border-t border-zinc-100 flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-zinc-600">
                <span>Sous-total HT</span>
                <span>{fmt(subtotal)} MAD</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-600">
                <span>TVA</span>
                <span>{fmt(taxAmount)} MAD</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-zinc-900 pt-2 border-t border-zinc-100">
                <span>Total TTC</span>
                <span>{fmt(total)} MAD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-6 grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Notes</label>
            <textarea className="input resize-none h-24 text-sm" placeholder="Notes pour le client…"
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div>
            <label className="input-label">Conditions de paiement</label>
            <textarea className="input resize-none h-24 text-sm" placeholder="Paiement à 30 jours…"
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
          <Link href="/dashboard/facturation" className="btn-ghost">Annuler</Link>
        </div>
      </div>
    </div>
  )
}
