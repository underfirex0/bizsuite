'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', company: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    // 1. Create user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName },
      },
    })

    if (authError || !authData.user) {
      setError(authError?.message || 'Erreur lors de la création du compte.')
      setLoading(false)
      return
    }

    // 2. Create organization
    const slug = form.company
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40) + '-' + Date.now().toString(36)

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: form.company, slug } as any)
      .select()
      .single()

    if (orgError || !org) {
      setError('Erreur lors de la création de l\'organisation.')
      setLoading(false)
      return
    }

    // 3. Add user as owner
    await supabase.from('organization_members').insert({
      organization_id: org.id,
      user_id: authData.user.id,
      role: 'owner',
    } as any)

    router.push('/dashboard')
    router.refresh()
  }

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Créer votre espace</h1>
          <p className="text-surface-500 text-sm mt-1">Gratuit, sans carte bancaire</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="input-label">Nom complet</label>
              <input
                type="text"
                className="input"
                placeholder="Mohammed Alami"
                value={form.fullName}
                onChange={update('fullName')}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="input-label">Nom de l'entreprise</label>
              <input
                type="text"
                className="input"
                placeholder="Alami & Associés"
                value={form.company}
                onChange={update('company')}
                required
              />
            </div>

            <div>
              <label className="input-label">Email professionnel</label>
              <input
                type="email"
                className="input"
                placeholder="vous@entreprise.com"
                value={form.email}
                onChange={update('email')}
                required
              />
            </div>

            <div>
              <label className="input-label">Mot de passe</label>
              <input
                type="password"
                className="input"
                placeholder="Minimum 8 caractères"
                value={form.password}
                onChange={update('password')}
                required
                minLength={8}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Création…' : 'Créer mon espace gratuitement'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-surface-500 mt-5">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="text-brand-600 font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
