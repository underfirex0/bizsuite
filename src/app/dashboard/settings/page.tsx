'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save } from 'lucide-react'
import type { Organization } from '@/types/database'

export default function SettingsPage() {
  const [org, setOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', country: 'MA',
    currency: 'MAD', tax_number: '', invoice_prefix: 'INV', quote_prefix: 'DEV',
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: m } = await supabase
        .from('organization_members').select('organization_id').eq('user_id', user.id).single()
      if (!m) return
      const { data: o } = await supabase.from('organizations').select('*').eq('id', m.organization_id).single()
      if (o) {
        setOrg(o)
        setForm({
          name: o.name, email: o.email ?? '', phone: o.phone ?? '',
          address: o.address ?? '', city: o.city ?? '', country: o.country,
          currency: o.currency, tax_number: o.tax_number ?? '',
          invoice_prefix: o.invoice_prefix, quote_prefix: o.quote_prefix,
        })
      }
    }
    load()
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.from('organizations').update(form).eq('id', org!.id)
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!org) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-surface-400" />
    </div>
  )

  return (
    <div className="animate-in max-w-2xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Paramètres</h1>
          <p className="text-sm text-surface-500">Configuration de votre organisation</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="card p-6 space-y-4">
          <h2 className="font-medium text-surface-900">Informations générales</h2>
          <div>
            <label className="input-label">Nom de l'organisation</label>
            <input className="input" value={form.name} onChange={set('name')} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Email</label>
              <input className="input" type="email" placeholder="contact@entreprise.com" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="input-label">Téléphone</label>
              <input className="input" placeholder="+212 5XX XXX XXX" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
          <div>
            <label className="input-label">Adresse</label>
            <input className="input" value={form.address} onChange={set('address')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Ville</label>
              <input className="input" value={form.city} onChange={set('city')} />
            </div>
            <div>
              <label className="input-label">Pays</label>
              <select className="select" value={form.country} onChange={set('country')}>
                <option value="MA">Maroc</option>
                <option value="FR">France</option>
                <option value="BE">Belgique</option>
              </select>
            </div>
          </div>
          <div>
            <label className="input-label">N° fiscal / ICE</label>
            <input className="input" value={form.tax_number} onChange={set('tax_number')} />
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-medium text-surface-900">Facturation</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="input-label">Monnaie</label>
              <select className="select" value={form.currency} onChange={set('currency')}>
                <option value="MAD">MAD — Dirham</option>
                <option value="EUR">EUR — Euro</option>
                <option value="USD">USD — Dollar</option>
              </select>
            </div>
            <div>
              <label className="input-label">Préfixe factures</label>
              <input className="input" value={form.invoice_prefix} onChange={set('invoice_prefix')} maxLength={6} />
            </div>
            <div>
              <label className="input-label">Préfixe devis</label>
              <input className="input" value={form.quote_prefix} onChange={set('quote_prefix')} maxLength={6} />
            </div>
          </div>
          <div className="bg-surface-50 rounded-xl px-4 py-3 text-sm text-surface-600">
            Aperçu : <span className="font-mono font-medium">{form.invoice_prefix}-0001</span> · <span className="font-mono font-medium">{form.quote_prefix}-0001</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
          {saved && <span className="text-sm text-green-600 font-medium">✓ Sauvegardé !</span>}
        </div>
      </form>
    </div>
  )
}
