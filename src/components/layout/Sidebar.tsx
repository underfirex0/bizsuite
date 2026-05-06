'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, FileText, Receipt, BarChart3,
  Settings, LogOut, ChevronDown, Building2
} from 'lucide-react'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/crm', label: 'CRM', icon: Users },
  { href: '/dashboard/devis', label: 'Devis', icon: FileText },
  { href: '/dashboard/facturation', label: 'Facturation', icon: Receipt },
  { href: '/dashboard/rapports', label: 'Rapports', icon: BarChart3 },
]

interface SidebarProps {
  orgName: string
  userEmail: string
  userName: string
}

export function Sidebar({ orgName, userEmail, userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col bg-white border-r border-surface-100">
      {/* Logo + Org */}
      <div className="px-4 pt-5 pb-4 border-b border-surface-100">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="font-semibold text-surface-900 text-sm">BizSuite</span>
        </div>
        <div className="flex items-center gap-2 mt-3 px-2 py-2 rounded-xl hover:bg-surface-50 cursor-pointer group">
          <div className="w-7 h-7 bg-brand-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5 text-brand-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-surface-800 truncate">{orgName}</div>
            <div className="text-xs text-surface-400">Free plan</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-surface-400 group-hover:text-surface-600 shrink-0" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={clsx('nav-item', isActive && 'active')}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-surface-100 pt-3">
        <Link href="/dashboard/settings" className={clsx('nav-item', pathname.startsWith('/dashboard/settings') && 'active')}>
          <Settings className="w-4 h-4" />
          Paramètres
        </Link>
        <button onClick={handleLogout} className="nav-item w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
        <div className="px-3 pt-3 pb-1">
          <div className="text-xs font-medium text-surface-700 truncate">{userName}</div>
          <div className="text-xs text-surface-400 truncate">{userEmail}</div>
        </div>
      </div>
    </aside>
  )
}
