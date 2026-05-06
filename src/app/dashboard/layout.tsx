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
    .select('organization_id, organizations(id, name), profiles(full_name, email)')
    .eq('user_id', user.id)
    .maybeSingle()

  // If no org found, still show dashboard (don't redirect to register which causes loop)
  const org = (membership as any)?.organizations
  const profile = (membership as any)?.profiles

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
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