import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Calendar, Plus } from 'lucide-react'
import Link from 'next/link'

const STATUS_COLOR: Record<string, string> = {
  reserved: 'badge-blue', active: 'badge-green', completed: 'badge-gray', cancelled: 'badge-red'
}
const STATUS_LABEL: Record<string, string> = {
  reserved: 'Réservé', active: 'En cours', completed: 'Terminé', cancelled: 'Annulé'
}

export default async function RentalsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: m } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle()
  const orgId = (m as any)?.organization_id

  const { data: rentals } = orgId
    ? await supabase.from('rentals').select('*, vehicles(make, model, plate_number), clients(name, phone)').eq('organization_id', orgId).order('created_at', { ascending: false })
    : { data: [] }

  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Contrats de location</h1>
          <p className="text-sm text-zinc-500">{rentals?.length ?? 0} contrats</p>
        </div>
        <Link href="/dashboard/location/new-rental" className="btn-primary">
          <Plus className="w-4 h-4" /> Nouvelle location
        </Link>
      </div>

      {(!rentals || rentals.length === 0) ? (
        <div className="card">
          <div className="empty-state">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="font-semibold text-zinc-900 mb-1">Aucun contrat encore</h3>
            <p className="text-sm text-zinc-500 mb-4">Créez votre premier contrat de location</p>
            <Link href="/dashboard/location/new-rental" className="btn-primary">
              <Plus className="w-4 h-4" /> Nouvelle location
            </Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>N° Contrat</th>
                  <th>Client</th>
                  <th>Véhicule</th>
                  <th>Période</th>
                  <th>Jours</th>
                  <th>Montant</th>
                  <th>Payé</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map((r: any) => {
                  const v = r.vehicles as any
                  const c = r.clients as any
                  return (
                    <tr key={r.id}>
                      <td><span className="font-mono text-sm font-medium text-zinc-800">{r.rental_number}</span></td>
                      <td>
                        <div className="font-medium text-zinc-800">{c?.name ?? '—'}</div>
                        {c?.phone && <div className="text-xs text-zinc-400">{c.phone}</div>}
                      </td>
                      <td>
                        <div className="font-medium text-zinc-800">{v?.make} {v?.model}</div>
                        <div className="text-xs text-zinc-400">{v?.plate_number}</div>
                      </td>
                      <td className="text-zinc-600 text-xs">
                        {new Date(r.start_date).toLocaleDateString('fr-FR')}
                        <span className="text-zinc-400"> → </span>
                        {new Date(r.end_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="text-zinc-600">{r.total_days}j</td>
                      <td className="font-medium text-zinc-900">{fmt(r.total_amount)}</td>
                      <td className="text-green-600 font-medium">{fmt(r.amount_paid)}</td>
                      <td><span className={`badge ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
