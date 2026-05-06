import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'BizSuite — Gestion d\'entreprise',
    template: '%s | BizSuite',
  },
  description: 'CRM, Facturation, Devis et Rapports pour votre entreprise',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
