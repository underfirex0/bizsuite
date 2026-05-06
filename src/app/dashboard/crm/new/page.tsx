'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orgId, setOrgId] = useState('')
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState({
    name: '', type: 'company', status: 'prospect', email: '',
    phone: '', website: '', address: '', city: '', country: 'MA',
    tax_number: '', notes: '',
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) setOrgId((data as any).organization_id)
    }
    load()
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId) { setError('Organisation introuvable. Rechargez la page.'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('clients').insert({
      ...form,
      organization_id: orgId,
      created_by: userId,
      tags: [],
    } as any)
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/dashboard/crm')
  }

  return (
    <div className="animate-in max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/crm" className="btn-ghost px-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="page-title">Nouveau client</h1>
          <p className="text-sm text-zinc-500">Remplissez les informations du client</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="font-medium text-zinc-900">Informations générales</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Type</label>
              <select className="select" value={form.type} onChange={set('type')}>
                <option value="company">Entreprise</option>
                <option value="individual">Particulier</option>
              </select>
            </div>
            <div>
              <label className="input-label">Statut</label>
              <select className="select" value={form.status} onChange={set('status')}>
                <option value="prospect">Prospect</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          </div>
          <div>
            <label className="input-label">Nom *</label>
            <input className="input" placeholder="Nom de l'entreprise" value={form.name} onChange={set('name')} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Email</label>
              <input className="input" type="email" placeholder="contact@entreprise.com" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="input-label">Téléphone</label>
              <input className="input" placeholder="+212 6XX XXX XXX" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
          <div>
            <label className="input-label">Site web</label>
            <input className="input" placeholder="https://exemple.com" value={form.website} onChange={set('website')} />
          </div>
          <div>
            <label className="input-label">N° fiscal / ICE</label>
            <input className="input" placeholder="ICE ou numéro TVA" value={form.tax_number} onChange={set('tax_number')} />
          </div>
        </div>
        <div className="card p-6 space-y-4">
          <h2 className="font-medium text-zinc-900">Adresse</h2>
          <div>
            <label className="input-label">Adresse</label>
            <input className="input" placeholder="123 Rue Mohammed V" value={form.address} onChange={set('address')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Ville</label>
              <input className="input" placeholder="Casablanca" value={form.city} onChange={set('city')} />
            </div>
            <div>
              <label className="input-label">Pays</label>
              <select className="select" value={form.country} onChange={set('country')}>
                <option value="MA">Maroc</option>
                <option value="FR">France</option>
                <option value="BE">Belgique</option>
                <option value="ES">Espagne</option>
              </select>
            </div>
          </div>
        </div>
        <div className="card p-6 space-y-4">
          <h2 className="font-medium text-zinc-900">Notes</h2>
          <textarea className="input resize-none h-24" placeholder="Informations supplémentaires…" value={form.notes} onChange={set('notes')} />
        </div>
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>}
        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Enregistrement…' : 'Enregistrer le client'}
          </button>
          <Link href="/dashboard/crm" className="btn-secondary">Annuler</Link>
        </div>
      </form>
    </div>
  )
}
