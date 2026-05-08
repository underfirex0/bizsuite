import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Car, Plus, AlertTriangle, Calendar, TrendingUp, Key } from 'lucide-react'
import Link from 'next/link'

export default async function LocationDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: m } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle()
  const orgId = (m as any)?.organization_id
  if (!orgId) redirect('/dashboard')

  const [vehiclesRes, rentalsRes] = await Promise.all([
    supabase.from('vehicles').select('*').eq('organization_id', orgId),
    supabase.from('rentals').select('*, vehicles(make, model, plate_number), clients(name, phone)').eq('organization_id', orgId).order('created_at', { ascending: false }),
  ])

  const vehicles = vehiclesRes.data ?? []
  const rentals = rentalsRes.data ?? []

  const available = vehicles.filter((v: any) => v.status === 'available').length
  const rented = vehicles.filter((v: any) => v.status === 'rented').length
  const maintenance = vehicles.filter((v: any) => v.status === 'maintenance').length
  const activeRentals = rentals.filter((r: any) => r.status === 'active')
  const totalRevenue = rentals.filter((r: any) => r.status === 'completed').reduce((s: number, r: any) => s + (r.total_amount || 0), 0)

  // Expiring documents in next 30 days
  const today = new Date()
  const in30 = new Date(today.getTime() + 30 * 86400000)
  const expiring = vehicles.filter((v: any) => {
    const dates = [v.insurance_expiry, v.vignette_expiry, v.visite_technique_expiry].filter(Boolean)
    return dates.some(d => new Date(d) <= in30)
  })

  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n)

  const STATUS_COLOR: Record<string, string> = {
    reserved: 'badge-blue', active: 'badge-green', completed: 'badge-gray', cancelled: 'badge-red'
  }
  const STATUS_LABEL: Record<string, string> = {
    reserved: 'Réservé', active: 'En cours', completed: 'Terminé', cancelled: 'Annulé'
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Location de Voitures</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{vehicles.length} véhicules · {rented} en location</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/location/vehicles/new" className="btn-secondary">
            <Car className="w-4 h-4" /> Ajouter véhicule
          </Link>
          <Link href="/dashboard/location/new-rental" className="btn-primary">
            <Plus className="w-4 h-4" /> Nouvelle location
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-3">
            <Car className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-zinc-900">{available}</div>
          <div className="text-sm font-medium text-zinc-700">Disponibles</div>
          <div className="text-xs text-zinc-400 mt-0.5">sur {vehicles.length} véhicules</div>
        </div>
        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Key className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-zinc-900">{rented}</div>
          <div className="text-sm font-medium text-zinc-700">En location</div>
          <div className="text-xs text-zinc-400 mt-0.5">{activeRentals.length} contrats actifs</div>
        </div>
        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-zinc-900">{fmt(totalRevenue)}</div>
          <div className="text-sm font-medium text-zinc-700">Revenus totaux</div>
          <div className="text-xs text-zinc-400 mt-0.5">locations terminées</div>
        </div>
        <div className="stat-card">
          <div className={`w-9 h-9 rounded-xl ${expiring.length > 0 ? 'bg-red-50 text-red-600' : 'bg-zinc-50 text-zinc-400'} flex items-center justify-center mb-3`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-zinc-900">{expiring.length}</div>
          <div className="text-sm font-medium text-zinc-700">Documents expirant</div>
          <div className="text-xs text-zinc-400 mt-0.5">dans les 30 jours</div>
        </div>
      </div>

      {/* Alerts */}
      {expiring.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Documents à renouveler</p>
            <div className="mt-1 space-y-0.5">
              {expiring.map((v: any) => (
                <p key={v.id} className="text-xs text-red-700">
                  {v.make} {v.model} ({v.plate_number})
                  {v.insurance_expiry && new Date(v.insurance_expiry) <= in30 && ` · Assurance: ${new Date(v.insurance_expiry).toLocaleDateString('fr-FR')}`}
                  {v.vignette_expiry && new Date(v.vignette_expiry) <= in30 && ` · Vignette: ${new Date(v.vignette_expiry).toLocaleDateString('fr-FR')}`}
                  {v.visite_technique_expiry && new Date(v.visite_technique_expiry) <= in30 && ` · Visite tech: ${new Date(v.visite_technique_expiry).toLocaleDateString('fr-FR')}`}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fleet status */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-900">Flotte</h2>
            <Link href="/dashboard/location/vehicles" className="text-xs text-indigo-600 hover:underline">Voir tout →</Link>
          </div>
          {vehicles.length === 0 ? (
            <div className="empty-state py-8">
              <Car className="w-8 h-8 text-zinc-300 mb-2" />
              <p className="text-sm text-zinc-400 mb-3">Aucun véhicule encore</p>
              <Link href="/dashboard/location/vehicles/new" className="btn-primary text-xs px-3 py-1.5">
                <Plus className="w-3.5 h-3.5" /> Ajouter un véhicule
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {vehicles.slice(0, 6).map((v: any) => (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${v.status === 'available' ? 'bg-green-500' : v.status === 'rented' ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                    <div>
                      <div className="text-sm font-medium text-zinc-800">{v.make} {v.model}</div>
                      <div className="text-xs text-zinc-400">{v.plate_number} · {v.year}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-zinc-700">{fmt(v.daily_rate)}/j</div>
                    <div className={`text-xs ${v.status === 'available' ? 'text-green-600' : v.status === 'rented' ? 'text-indigo-600' : 'text-amber-600'}`}>
                      {v.status === 'available' ? 'Disponible' : v.status === 'rented' ? 'Loué' : 'Maintenance'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active rentals */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-900">Locations récentes</h2>
            <Link href="/dashboard/location/rentals" className="text-xs text-indigo-600 hover:underline">Voir tout →</Link>
          </div>
          {rentals.length === 0 ? (
            <div className="empty-state py-8">
              <Calendar className="w-8 h-8 text-zinc-300 mb-2" />
              <p className="text-sm text-zinc-400 mb-3">Aucune location encore</p>
              <Link href="/dashboard/location/new-rental" className="btn-primary text-xs px-3 py-1.5">
                <Plus className="w-3.5 h-3.5" /> Nouvelle location
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {rentals.slice(0, 6).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-zinc-800">{(r.clients as any)?.name ?? 'Client inconnu'}</div>
                    <div className="text-xs text-zinc-400">
                      {(r.vehicles as any)?.make} {(r.vehicles as any)?.model} · {new Date(r.start_date).toLocaleDateString('fr-FR')} → {new Date(r.end_date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-zinc-700">{fmt(r.total_amount)}</div>
                    <span className={`badge ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
