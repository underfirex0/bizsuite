'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, FileText, Receipt, BarChart3,
  Settings, LogOut, ChevronDown, Building2, Car, ChevronRight, Wrench
} from 'lucide-react'
import { clsx } from 'clsx'
import { useState } from 'react'

const CORE_NAV = [
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
  activeModules?: string[]
}

export function Sidebar({ orgName, userEmail, userName, activeModules = [] }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [locationOpen, setLocationOpen] = useState(pathname.startsWith('/dashboard/location'))
  const [interventionsOpen, setInterventionsOpen] = useState(pathname.startsWith('/dashboard/interventions'))

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col bg-white border-r border-zinc-100">
      <div className="px-4 pt-5 pb-4 border-b border-zinc-100">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="font-semibold text-zinc-900 text-sm">BizSuite</span>
        </div>
        <div className="flex items-center gap-2 mt-3 px-2 py-2 rounded-xl hover:bg-zinc-50 cursor-pointer">
          <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-zinc-800 truncate">{orgName}</div>
            <div className="text-xs text-zinc-400">Free plan</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {CORE_NAV.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : (pathname.startsWith(href) && href !== '/dashboard')
          return (
            <Link key={href} href={href} className={clsx('nav-item', isActive && 'active')}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}

        {/* Modules section */}
        <div className="mt-3">
          <div className="px-2 mb-2 mt-1">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Modules</span>
          </div>

          {/* Location Voitures */}
          <button
            onClick={() => setLocationOpen(o => !o)}
            className={clsx('nav-item w-full text-left', pathname.startsWith('/dashboard/location') && 'active')}
          >
            <Car className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">Location Voitures</span>
            <ChevronRight className={clsx('w-3.5 h-3.5 transition-transform duration-150', locationOpen && 'rotate-90')} />
          </button>

          {locationOpen && (
            <div className="ml-6 mt-1 space-y-0.5 pl-3 border-l border-zinc-100">
              {[
                { href: '/dashboard/location', label: "Vue d'ensemble" },
                { href: '/dashboard/location/vehicles', label: 'Flotte' },
                { href: '/dashboard/location/rentals', label: 'Contrats' },
                { href: '/dashboard/location/new-rental', label: '+ Nouvelle location' },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className={clsx(
                    'block px-2 py-1.5 text-xs rounded-lg transition-colors',
                    pathname === item.href
                      ? 'text-indigo-700 bg-indigo-50 font-medium'
                      : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
                  )}>
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          {/* Interventions */}
          <button
            onClick={() => setInterventionsOpen(o => !o)}
            className={clsx('nav-item w-full text-left', pathname.startsWith('/dashboard/interventions') && 'active')}
          >
            <Wrench className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">Interventions</span>
            <ChevronRight className={clsx('w-3.5 h-3.5 transition-transform duration-150', interventionsOpen && 'rotate-90')} />
          </button>

          {interventionsOpen && (
            <div className="ml-6 mt-1 space-y-0.5 pl-3 border-l border-zinc-100">
              {[
                { href: '/dashboard/interventions', label: "Vue d'ensemble" },
                { href: '/dashboard/interventions/list', label: 'Interventions' },
                { href: '/dashboard/interventions/contrats', label: 'Contrats' },
                { href: '/dashboard/interventions/techniciens', label: 'Techniciens' },
                { href: '/dashboard/interventions/new', label: '+ Nouvelle' },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className={clsx(
                    'block px-2 py-1.5 text-xs rounded-lg transition-colors',
                    pathname === item.href
                      ? 'text-indigo-700 bg-indigo-50 font-medium'
                      : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
                  )}>
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="px-3 pb-4 space-y-0.5 border-t border-zinc-100 pt-3">
        <Link href="/dashboard/settings" className={clsx('nav-item', pathname.startsWith('/dashboard/settings') && 'active')}>
          <Settings className="w-4 h-4" />
          Paramètres
        </Link>
        <button onClick={handleLogout} className="nav-item w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
        <div className="px-3 pt-3 pb-1">
          <div className="text-xs font-medium text-zinc-700 truncate">{userName}</div>
          <div className="text-xs text-zinc-400 truncate">{userEmail}</div>
        </div>
      </div>
    </aside>
  )
}
