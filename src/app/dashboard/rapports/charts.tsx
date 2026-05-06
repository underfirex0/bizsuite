'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { TrendingUp, DollarSign, Clock, Percent } from 'lucide-react'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6']

const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n)

interface Props {
  monthlyRevenue: { month: string; facturé: number; encaissé: number }[]
  invoiceStatus: { name: string; value: number }[]
  pipeline: { stage: string; count: number; value: number }[]
  stats: { totalRevenue: number; totalPending: number; totalClients: number; conversionRate: number }
}

export function RapportsCharts({ monthlyRevenue, invoiceStatus, pipeline, stats }: Props) {
  const kpis = [
    { label: 'Revenus encaissés', value: fmt(stats.totalRevenue), icon: DollarSign, color: 'text-green-600 bg-green-50' },
    { label: 'En attente', value: fmt(stats.totalPending), icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Clients actifs', value: stats.totalClients.toString(), icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
    { label: 'Taux conversion devis', value: `${stats.conversionRate}%`, icon: Percent, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rapports & KPIs</h1>
          <p className="text-sm text-surface-500 mt-0.5">Vue analytique de votre activité</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
            <div className="text-2xl font-bold text-surface-900 tracking-tight mb-0.5">{value}</div>
            <div className="text-sm text-surface-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Monthly revenue */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="font-semibold text-surface-900 mb-4">Chiffre d'affaires mensuel</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyRevenue} barGap={4}>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [fmt(v)]} contentStyle={{ borderRadius: 12, border: '1px solid #e4e4e7', fontSize: 12 }} />
              <Bar dataKey="facturé" fill="#6366f1" radius={[4, 4, 0, 0]} name="Facturé" />
              <Bar dataKey="encaissé" fill="#10b981" radius={[4, 4, 0, 0]} name="Encaissé" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-brand-500" /><span className="text-xs text-surface-500">Facturé</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-500" /><span className="text-xs text-surface-500">Encaissé</span></div>
          </div>
        </div>

        {/* Invoice status pie */}
        <div className="card p-6">
          <h2 className="font-semibold text-surface-900 mb-4">Statuts factures</h2>
          {invoiceStatus.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-surface-400 text-sm">Aucune donnée</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={invoiceStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {invoiceStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e4e4e7', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Pipeline */}
      <div className="card p-6">
        <h2 className="font-semibold text-surface-900 mb-4">Pipeline CRM</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {pipeline.map(({ stage, count, value }) => (
            <div key={stage} className="text-center p-4 bg-surface-50 rounded-xl">
              <div className="text-2xl font-bold text-surface-900 mb-0.5">{count}</div>
              <div className="text-xs font-medium text-surface-600 mb-1">{stage}</div>
              <div className="text-xs text-surface-400">{fmt(value)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
