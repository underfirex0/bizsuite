'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Car, User } from 'lucide-react'
import Link from 'next/link'

export default function NewRentalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orgId, setOrgId] = useState('')
  const [userId, setUserId] = useState('')
  const [vehicles, setVehicles] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [form, setForm] = useState({
    vehicle_id: '', client_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    pickup_km: '', pickup_location: '', return_location: '',
    deposit_amount: '', extra_charges: '0', extra_charges_note: '', discount: '0', notes: '',
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

      const [vRes, cRes] = await Promise.all([
        supabase.from('vehicles').select('*').eq('organization_id', oid).eq('status', 'available'),
        supabase.from('clients').select('id, name, phone').eq('organization_id', oid).order('name'),
      ])
      setVehicles(vRes.data ?? [])
      setClients(cRes.data ?? [])
    }
    load()
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    if (k === 'vehicle_id') {
      const v = vehicles.find(v => v.id === e.target.value)
      setSelectedVehicle(v)
      if (v) setForm(f => ({ ...f, vehicle_id: e.target.value, deposit_amount: String(v.deposit_amount || ''), pickup_km: String(v.current_km || '') }))
    }
  }

  // Calculate totals
  const days = Math.max(1, Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 86400000))
  const dailyRate = selectedVehicle?.daily_rate || 0
  const subtotal = days * dailyRate
  const extra = parseFloat(form.extra_charges) || 0
  const discount = parseFloat(form.discount) || 0
  const total = subtotal + extra - discount

  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2 }).format(n)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId || !form.vehicle_id) { setError('Sélectionnez un véhicule.'); return }
    setLoading(true)
    const supabase = createClient()

    // Get next rental number
    const { data: org } = await supabase.from('organizations').select('next_invoice_number').eq('id', orgId).single()
    const rentalNumber = `LOC-${String((org as any)?.next_invoice_number || 1).padStart(4, '0')}`

    const { error: err } = await supabase.from('rentals').insert({
      organization_id: orgId,
      rental_number: rentalNumber,
      vehicle_id: form.vehicle_id,
      client_id: form.client_id || null,
      status: 'active',
      start_date: form.start_date,
      end_date: form.end_date,
      pickup_km: parseInt(form.pickup_km) || null,
      pickup_location: form.pickup_location || null,
      return_location: form.return_location || null,
      daily_rate: dailyRate,
      total_days: days,
      subtotal,
      extra_charges: extra,
      extra_charges_note: form.extra_charges_note || null,
      discount,
      total_amount: total,
      deposit_amount: parseFloat(form.deposit_amount) || 0,
      notes: form.notes || null,
      created_by: userId,
    } as any)

    if (err) { setError(err.message); setLoading(false); return }

    // Update vehicle status to rented
    await supabase.from('vehicles').update({ status: 'rented' } as any).eq('id', form.vehicle_id)
    await supabase.from('organizations').update({ next_invoice_number: ((org as any)?.next_invoice_number || 1) + 1 } as any).eq('id', orgId)

    router.push('/dashboard/location/rentals')
  }

  return (
    <div className="animate-in max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/location" className="btn-ghost px-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="page-title">Nouveau contrat de location</h1>
          <p className="text-sm text-zinc-500">Créez un contrat en quelques secondes</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Vehicle + Client */}
        <div className="card p-6 space-y-4">
          <h2 className="font-medium text-zinc-900">Véhicule & Client</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Véhicule *</label>
              <select className="select" value={form.vehicle_id} onChange={set('vehicle_id')} required>
                <option value="">Sélectionner un véhicule</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.make} {v.model} — {v.plate_number} ({v.daily_rate} MAD/j)</option>
                ))}
              </select>
              {vehicles.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Aucun véhicule disponible. <Link href="/dashboard/location/vehicles/new" className="underline">Ajouter un véhicule</Link></p>
              )}
            </div>
            <div>
              <label className="input-label">Client</label>
              <select className="select" value={form.client_id} onChange={set('client_id')}>
                <option value="">Sélectionner un client</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.phone ? `— ${c.phone}` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedVehicle && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-3">
              <Car className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="text-sm text-amber-800">
                <span className="font-medium">{selectedVehicle.make} {selectedVehicle.model}</span>
                {' · '}{selectedVehicle.year} · {selectedVehicle.plate_number} · {selectedVehicle.fuel_type}
                {' · '}<span className="font-medium">{selectedVehicle.daily_rate} MAD/jour</span>
              </div>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="card p-6 space-y-4">
          <h2 className="font-medium text-zinc-900">Période de location</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Date de départ *</label>
              <input className="input" type="date" value={form.start_date} onChange={set('start_date')} required />
            </div>
            <div>
              <label className="input-label">Date de retour *</label>
              <input className="input" type="date" value={form.end_date} onChange={set('end_date')} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Lieu de départ</label>
              <input className="input" placeholder="Casablanca aéroport..." value={form.pickup_location} onChange={set('pickup_location')} />
            </div>
            <div>
              <label className="input-label">Lieu de retour</label>
              <input className="input" placeholder="Casablanca centre..." value={form.return_location} onChange={set('return_location')} />
            </div>
          </div>
          <div>
            <label className="input-label">Kilométrage départ</label>
            <input className="input" type="number" min="0" value={form.pickup_km} onChange={set('pickup_km')} />
          </div>

          {/* Duration summary */}
          <div className="bg-zinc-50 rounded-xl p-3 text-sm text-zinc-600">
            Durée : <span className="font-semibold text-zinc-900">{days} jour{days > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Pricing */}
        <div className="card p-6 space-y-4">
          <h2 className="font-medium text-zinc-900">Tarification</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Frais supplémentaires (MAD)</label>
              <input className="input" type="number" min="0" step="0.01" value={form.extra_charges} onChange={set('extra_charges')} />
            </div>
            <div>
              <label className="input-label">Motif des frais</label>
              <input className="input" placeholder="Livraison, carburant..." value={form.extra_charges_note} onChange={set('extra_charges_note')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Remise (MAD)</label>
              <input className="input" type="number" min="0" step="0.01" value={form.discount} onChange={set('discount')} />
            </div>
            <div>
              <label className="input-label">Caution (MAD)</label>
              <input className="input" type="number" min="0" step="0.01" value={form.deposit_amount} onChange={set('deposit_amount')} />
            </div>
          </div>

          {/* Total breakdown */}
          <div className="border-t border-zinc-100 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-zinc-600">
              <span>{days} j × {fmt(dailyRate)} MAD</span>
              <span>{fmt(subtotal)} MAD</span>
            </div>
            {extra > 0 && <div className="flex justify-between text-sm text-zinc-600"><span>Frais supplémentaires</span><span>+{fmt(extra)} MAD</span></div>}
            {discount > 0 && <div className="flex justify-between text-sm text-zinc-600"><span>Remise</span><span>-{fmt(discount)} MAD</span></div>}
            <div className="flex justify-between text-base font-semibold text-zinc-900 pt-2 border-t border-zinc-100">
              <span>Total TTC</span>
              <span>{fmt(total)} MAD</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-6">
          <label className="input-label">Notes</label>
          <textarea className="input resize-none h-20" placeholder="Conditions particulières, remarques..." value={form.notes} onChange={set('notes')} />
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>}

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Création…' : `Créer le contrat — ${fmt(total)} MAD`}
          </button>
          <Link href="/dashboard/location" className="btn-secondary">Annuler</Link>
        </div>
      </form>
    </div>
  )
}
