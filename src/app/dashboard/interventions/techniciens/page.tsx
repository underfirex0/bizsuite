import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function TechniciensPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: m } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle()
  const orgId = (m as any)?.organization_id

  const { data: techs } = orgId
    ? await supabase.from('techniciens').select('*').eq('organization_id', orgId).order('first_name')
    : { data: [] }

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Techniciens</h1>
          <p className="text-sm text-zinc-500">{techs?.length ?? 0} techniciens</p>
        </div>
        <Link href="/dashboard/interventions/techniciens/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Ajouter
        </Link>
      </div>

      {(!techs || techs.length === 0) ? (
        <div className="card">
          <div className="empty-state">
            <Users className="w-8 h-8 text-zinc-300 mb-2" />
            <p className="text-sm text-zinc-400 mb-3">Aucun technicien encore</p>
            <Link href="/dashboard/interventions/techniciens/new" className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> Ajouter un technicien
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {techs.map((t: any) => (
            <div key={t.id} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                  style={{ background: t.color || '#6366f1' }}>
                  {t.first_name[0]}{t.last_name[0]}
                </div>
                <div>
                  <div className="font-semibold text-zinc-900">{t.first_name} {t.last_name}</div>
                  {t.speciality && <div className="text-xs text-zinc-500">{t.speciality}</div>}
                </div>
                <span className={`badge ml-auto ${t.is_active ? 'badge-green' : 'badge-gray'}`}>
                  {t.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div className="space-y-1 text-sm text-zinc-500">
                {t.phone && <div>📞 {t.phone}</div>}
                {t.email && <div>✉️ {t.email}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
