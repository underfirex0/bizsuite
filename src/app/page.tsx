import Link from 'next/link'
import { ArrowRight, BarChart3, FileText, Users, Receipt } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="font-semibold text-surface-900 text-lg">BizSuite</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn-ghost text-surface-600">Se connecter</Link>
          <Link href="/auth/register" className="btn-primary">Commencer gratuitement</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-8 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-full px-4 py-1.5 text-sm text-brand-700 font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse-slow"></span>
          Gestion d'entreprise tout-en-un
        </div>
        <h1 className="text-5xl font-bold text-surface-900 tracking-tight mb-6 leading-tight">
          Gérez votre business<br />
          <span className="text-brand-600">sans friction</span>
        </h1>
        <p className="text-lg text-surface-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          CRM, devis, factures et tableaux de bord — tout en un seul endroit.
          Conçu pour les entreprises marocaines et internationales.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/auth/register" className="btn-primary text-base px-6 py-3">
            Démarrer gratuitement <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/auth/login" className="btn-secondary text-base px-6 py-3">
            Se connecter
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-8 pb-24 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'CRM', desc: 'Clients & pipeline', color: 'text-blue-600 bg-blue-50' },
          { icon: FileText, label: 'Devis', desc: 'Propositions pro', color: 'text-amber-600 bg-amber-50' },
          { icon: Receipt, label: 'Facturation', desc: 'Invoices & paiements', color: 'text-green-600 bg-green-50' },
          { icon: BarChart3, label: 'Rapports', desc: 'KPIs en temps réel', color: 'text-purple-600 bg-purple-50' },
        ].map(({ icon: Icon, label, desc, color }) => (
          <div key={label} className="card p-5 text-center hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mx-auto mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="font-semibold text-surface-900 mb-1">{label}</div>
            <div className="text-sm text-surface-500">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
