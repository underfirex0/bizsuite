import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get user's organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organizations(id, name), profiles(full_name, email)')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/auth/register')

  const org = membership.organizations as { id: string; name: string } | null
  const profile = membership.profiles as { full_name: string | null; email: string } | null

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      <Sidebar
        orgName={org?.name ?? 'Mon Organisation'}
        userEmail={profile?.email ?? user.email ?? ''}
        userName={profile?.full_name ?? user.email?.split('@')[0] ?? 'Utilisateur'}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
