import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Car, Plus } from 'lucide-react'
import Link from 'next/link'

const STATUS_COLOR: Record<string, string> = {
  available: 'badge-green', rented: 'badge-blue', maintenance: 'badge-yellow', inactive: 'badge-gray'
}
const STATUS_LABEL: Record<string, string> = {
  available: 'Disponible', rented: 'En location', maintenance: 'Maintenance', inactive: 'Inactif'
}

export default async function VehiclesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: m } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle()
  const orgId = (m as any)?.organization_id

  const { data: vehicles } = orgId
    ? await supabase.from('vehicles').select('*').eq('organization_id', orgId).order('created_at', { ascending: false })
    : { data: [] }

  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Flotte de véhicules</h1>
          <p className="text-sm text-zinc-500">{vehicles?.length ?? 0} véhicules</p>
        </div>
        <Link href="/dashboard/location/vehicles/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Ajouter un véhicule
        </Link>
      </div>

      {(!vehicles || vehicles.length === 0) ? (
        <div className="card">
          <div className="empty-state">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
              <Car className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="font-semibold text-zinc-900 mb-1">Aucun véhicule encore</h3>
            <p className="text-sm text-zinc-500 mb-4">Ajoutez votre premier véhicule à la flotte</p>
            <Link href="/dashboard/location/vehicles/new" className="btn-primary">
              <Plus className="w-4 h-4" /> Ajouter un véhicule
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v: any) => (
            <Link key={v.id} href={`/dashboard/location/vehicles/${v.id}`} className="card p-5 hover:shadow-md transition-shadow cursor-pointer block">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Car className="w-5 h-5 text-amber-600" />
                </div>
                <span className={`badge ${STATUS_COLOR[v.status]}`}>{STATUS_LABEL[v.status]}</span>
              </div>
              <h3 className="font-semibold text-zinc-900 text-base">{v.make} {v.model}</h3>
              <p className="text-sm text-zinc-500 mt-0.5">{v.year} · {v.color} · {v.plate_number}</p>
              <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-400">Tarif journalier</div>
                  <div className="text-sm font-semibold text-zinc-900">{fmt(v.daily_rate)}/j</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-400">Kilométrage</div>
                  <div className="text-sm font-medium text-zinc-700">{v.current_km?.toLocaleString()} km</div>
                </div>
              </div>
              {/* Document warnings */}
              {[
                { label: 'Assurance', date: v.insurance_expiry },
                { label: 'Vignette', date: v.vignette_expiry },
                { label: 'Visite tech', date: v.visite_technique_expiry },
              ].filter(d => d.date && new Date(d.date) <= new Date(Date.now() + 30 * 86400000)).map(d => (
                <div key={d.label} className="mt-2 text-xs text-red-600 flex items-center gap-1">
                  ⚠️ {d.label} expire le {new Date(d.date).toLocaleDateString('fr-FR')}
                </div>
              ))}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
