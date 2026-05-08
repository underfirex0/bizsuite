'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewVehiclePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orgId, setOrgId] = useState('')
  const [form, setForm] = useState({
    make: '', model: '', year: new Date().getFullYear(), color: '', plate_number: '',
    fuel_type: 'essence', transmission: 'manuelle', seats: 5,
    daily_rate: '', weekly_rate: '', monthly_rate: '', deposit_amount: '',
    current_km: 0, status: 'available',
    insurance_expiry: '', vignette_expiry: '', visite_technique_expiry: '', notes: '',
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle()
      if (data) setOrgId((data as any).organization_id)
    }
    load()
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId) { setError('Organisation introuvable.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.from('vehicles').insert({
      ...form,
      organization_id: orgId,
      daily_rate: parseFloat(form.daily_rate) || 0,
      weekly_rate: form.weekly_rate ? parseFloat(form.weekly_rate) : null,
      monthly_rate: form.monthly_rate ? parseFloat(form.monthly_rate) : null,
      deposit_amount: parseFloat(form.deposit_amount) || 0,
      current_km: parseInt(String(form.current_km)) || 0,
      insurance_expiry: form.insurance_expiry || null,
      vignette_expiry: form.vignette_expiry || null,
      visite_technique_expiry: form.visite_technique_expiry || null,
    } as any)
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/dashboard/location/vehicles')
  }

  return (
    <div className="animate-in max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/location/vehicles" className="btn-ghost px-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="page-title">Nouveau véhicule</h1>
          <p className="text-sm text-zinc-500">Ajouter un véhicule à la flotte</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Infos véhicule */}
        <div className="card p-6 space-y-4">
          <h2 className="font-medium text-zinc-900">Informations du véhicule</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Marque *</label>
              <input className="input" placeholder="Dacia, Renault, Toyota..." value={form.make} onChange={set('make')} required />
            </div>
            <div>
              <label className="input-label">Modèle *</label>
              <input className="input" placeholder="Logan, Clio, Corolla..." value={form.model} onChange={set('model')} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="input-label">Année</label>
              <input className="input" type="number" min="1990" max="2030" value={form.year} onChange={set('year')} />
            </div>
            <div>
              <label className="input-label">Couleur</label>
              <input className="input" placeholder="Blanc, Gris..." value={form.color} onChange={set('color')} />
            </div>
            <div>
              <label className="input-label">Immatriculation *</label>
              <input className="input" placeholder="1234-A-50" value={form.plate_number} onChange={set('plate_number')} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="input-label">Carburant</label>
              <select className="select" value={form.fuel_type} onChange={set('fuel_type')}>
                <option value="essence">Essence</option>
                <option value="diesel">Diesel</option>
                <option value="electrique">Électrique</option>
                <option value="hybride">Hybride</option>
              </select>
            </div>
            <div>
              <label className="input-label">Transmission</label>
              <select className="select" value={form.transmission} onChange={set('transmission')}>
                <option value="manuelle">Manuelle</option>
                <option value="automatique">Automatique</option>
              </select>
            </div>
            <div>
              <label className="input-label">Places</label>
              <input className="input" type="number" min="1" max="50" value={form.seats} onChange={set('seats')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Kilométrage actuel</label>
              <input className="input" type="number" min="0" value={form.current_km} onChange={set('current_km')} />
            </div>
            <div>
              <label className="input-label">Statut initial</label>
              <select className="select" value={form.status} onChange={set('status')}>
                <option value="available">Disponible</option>
                <option value="maintenance">En maintenance</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tarifs */}
        <div className="card p-6 space-y-4">
          <h2 className="font-medium text-zinc-900">Tarifs</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="input-label">Tarif journalier (MAD) *</label>
              <input className="input" type="number" min="0" step="0.01" placeholder="350" value={form.daily_rate} onChange={set('daily_rate')} required />
            </div>
            <div>
              <label className="input-label">Tarif hebdomadaire</label>
              <input className="input" type="number" min="0" step="0.01" placeholder="2000" value={form.weekly_rate} onChange={set('weekly_rate')} />
            </div>
            <div>
              <label className="input-label">Tarif mensuel</label>
              <input className="input" type="number" min="0" step="0.01" placeholder="7000" value={form.monthly_rate} onChange={set('monthly_rate')} />
            </div>
          </div>
          <div>
            <label className="input-label">Caution (MAD)</label>
            <input className="input" type="number" min="0" step="0.01" placeholder="3000" value={form.deposit_amount} onChange={set('deposit_amount')} />
          </div>
        </div>

        {/* Documents */}
        <div className="card p-6 space-y-4">
          <h2 className="font-medium text-zinc-900">Documents & Validités</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="input-label">Expiration assurance</label>
              <input className="input" type="date" value={form.insurance_expiry} onChange={set('insurance_expiry')} />
            </div>
            <div>
              <label className="input-label">Expiration vignette</label>
              <input className="input" type="date" value={form.vignette_expiry} onChange={set('vignette_expiry')} />
            </div>
            <div>
              <label className="input-label">Visite technique</label>
              <input className="input" type="date" value={form.visite_technique_expiry} onChange={set('visite_technique_expiry')} />
            </div>
          </div>
          <div>
            <label className="input-label">Notes</label>
            <textarea className="input resize-none h-20" placeholder="Informations supplémentaires..." value={form.notes} onChange={set('notes')} />
          </div>
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>}

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Enregistrement…' : 'Ajouter le véhicule'}
          </button>
          <Link href="/dashboard/location/vehicles" className="btn-secondary">Annuler</Link>
        </div>
      </form>
    </div>
  )
}
