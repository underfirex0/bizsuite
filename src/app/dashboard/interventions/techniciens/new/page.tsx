'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6']

export default function NewTechnicienPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orgId, setOrgId] = useState('')
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', email: '', speciality: '', color: '#6366f1' })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: m } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle()
      if (m) setOrgId((m as any).organization_id)
    }
    load()
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId) { setError('Organisation introuvable.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.from('techniciens').insert({ ...form, organization_id: orgId } as any)
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/dashboard/interventions/techniciens')
  }

  return (
    <div className="animate-in max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/interventions/techniciens" className="btn-ghost px-2"><ArrowLeft className="w-4 h-4" /></Link>
        <h1 className="page-title">Nouveau technicien</h1>
      </div>
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Prénom *</label>
            <input className="input" value={form.first_name} onChange={set('first_name')} required />
          </div>
          <div>
            <label className="input-label">Nom *</label>
            <input className="input" value={form.last_name} onChange={set('last_name')} required />
          </div>
        </div>
        <div>
          <label className="input-label">Téléphone</label>
          <input className="input" placeholder="+212 6XX XXX XXX" value={form.phone} onChange={set('phone')} />
        </div>
        <div>
          <label className="input-label">Email</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} />
        </div>
        <div>
          <label className="input-label">Spécialité</label>
          <input className="input" placeholder="Climatisation, Plomberie, Électricité..." value={form.speciality} onChange={set('speciality')} />
        </div>
        <div>
          <label className="input-label">Couleur planning</label>
          <div className="flex gap-2 mt-1">
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-zinc-400 scale-110' : ''}`}
                style={{ background: c }} />
            ))}
          </div>
        </div>
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>}
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Enregistrement…' : 'Ajouter le technicien'}
          </button>
          <Link href="/dashboard/interventions/techniciens" className="btn-secondary">Annuler</Link>
        </div>
      </form>
    </div>
  )
}
