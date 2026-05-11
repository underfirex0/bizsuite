'use client'

import { useEffect } from 'react'

interface Props {
  quote: any
  org: any
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Brouillon', sent: 'Envoyé', viewed: 'Consulté',
  accepted: 'Accepté', rejected: 'Refusé', expired: 'Expiré'
}
const STATUS_STYLE: Record<string, string> = {
  accepted: 'background:#f0fdf4;color:#166534;border:1px solid #bbf7d0',
  rejected: 'background:#fef2f2;color:#991b1b;border:1px solid #fecaca',
  expired: 'background:#fff7ed;color:#9a3412;border:1px solid #fed7aa',
  draft: 'background:#f4f4f5;color:#52525b;border:1px solid #e4e4e7',
  sent: 'background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe',
  viewed: 'background:#faf5ff;color:#6b21a8;border:1px solid #e9d5ff',
}

export function PrintQuote({ quote, org }: Props) {
  const client = quote.clients
  const items = quote.quote_items ?? []

  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(n || 0)

  useEffect(() => {
    const timer = setTimeout(() => window.print(), 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #18181b; background: white; }
        .page { max-width: 794px; margin: 0 auto; padding: 48px 56px; min-height: 1123px; position: relative; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .logo-box { width: 48px; height: 48px; background: #f59e0b; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 20px; }
        .org-name { font-size: 20px; font-weight: 700; color: #18181b; margin-top: 8px; }
        .org-info { font-size: 11px; color: #71717a; line-height: 1.7; margin-top: 4px; }
        .doc-title { font-size: 28px; font-weight: 700; color: #f59e0b; letter-spacing: -0.5px; text-align: right; }
        .doc-number { font-size: 14px; color: #71717a; text-align: right; margin-top: 4px; }
        .status-badge { display: inline-block; margin-top: 8px; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .divider { height: 1px; background: #e4e4e7; margin: 24px 0; }
        .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 32px; }
        .party-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #a1a1aa; margin-bottom: 8px; }
        .party-name { font-size: 15px; font-weight: 600; color: #18181b; margin-bottom: 4px; }
        .party-info { font-size: 12px; color: #52525b; line-height: 1.8; }
        .dates { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 16px; margin-bottom: 32px; }
        .date-item .label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #92400e; margin-bottom: 4px; }
        .date-item .value { font-size: 13px; font-weight: 500; color: #18181b; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .table thead tr { background: #18181b; color: white; }
        .table thead th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
        .table thead th:last-child, .table thead th:nth-child(3), .table thead th:nth-child(4) { text-align: right; }
        .table tbody tr { border-bottom: 1px solid #f4f4f5; }
        .table tbody tr:last-child { border-bottom: none; }
        .table tbody td { padding: 12px 14px; font-size: 13px; color: #3f3f46; }
        .table tbody td:nth-child(3), .table tbody td:nth-child(4), .table tbody td:last-child { text-align: right; }
        .table tbody td.desc { color: #18181b; font-weight: 500; }
        .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
        .totals-box { width: 280px; }
        .total-row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 13px; color: #52525b; }
        .total-row.grand { border-top: 2px solid #18181b; padding-top: 10px; margin-top: 4px; font-size: 16px; font-weight: 700; color: #18181b; }
        .validity-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px; font-size: 12px; color: #92400e; }
        .validity-box strong { font-weight: 600; }
        .notes-section { margin-bottom: 24px; }
        .notes-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #a1a1aa; margin-bottom: 6px; }
        .notes-text { font-size: 12px; color: #52525b; line-height: 1.7; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 12px; }
        .signature-area { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 24px; }
        .sig-box { border: 1px dashed #d4d4d8; border-radius: 8px; padding: 16px; height: 80px; }
        .sig-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #a1a1aa; margin-bottom: 6px; }
        .footer { position: absolute; bottom: 40px; left: 56px; right: 56px; }
        .footer-divider { height: 1px; background: #e4e4e7; margin-bottom: 16px; }
        .footer-content { display: flex; justify-content: space-between; font-size: 10px; color: #a1a1aa; }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page { padding: 32px 40px; }
        }
        .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #18181b; color: white; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; z-index: 100; }
        .print-bar-left { font-size: 13px; color: #a1a1aa; }
        .print-bar-left strong { color: white; }
        .btn-print { background: #f59e0b; color: white; border: none; padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .btn-back { background: transparent; color: #a1a1aa; border: 1px solid #3f3f46; padding: 8px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; margin-right: 8px; }
        @media print { .print-bar { display: none; } body { padding-top: 0; } }
      `}</style>

      <div className="print-bar no-print">
        <div className="print-bar-left">
          <strong>{quote.quote_number}</strong> · {client?.name ?? 'Client'}
          {quote.title && ` · ${quote.title}`}
        </div>
        <div>
          <button className="btn-back" onClick={() => window.history.back()}>← Retour</button>
          <button className="btn-print" onClick={() => window.print()}>⬇ Télécharger PDF</button>
        </div>
      </div>

      <div style={{ paddingTop: '52px' }} className="no-print" />

      <div className="page">
        <div className="header">
          <div>
            <div className="logo-box">B</div>
            <div className="org-name">{org?.name}</div>
            <div className="org-info">
              {org?.address && <>{org.address}<br /></>}
              {org?.city && <>{org.city}, {org?.country || 'Maroc'}<br /></>}
              {org?.phone && <>Tél: {org.phone}<br /></>}
              {org?.email && <>{org.email}<br /></>}
              {org?.tax_number && <>ICE: {org.tax_number}</>}
            </div>
          </div>
          <div>
            <div className="doc-title">DEVIS</div>
            <div className="doc-number">{quote.quote_number}</div>
            {quote.title && <div style={{ fontSize: '12px', color: '#71717a', textAlign: 'right', marginTop: '4px' }}>{quote.title}</div>}
            <div style={{ textAlign: 'right' }}>
              <span className="status-badge" style={{ [STATUS_STYLE[quote.status] || '']: STATUS_STYLE[quote.status] }}>
                {STATUS_LABEL[quote.status] ?? quote.status}
              </span>
            </div>
          </div>
        </div>

        <div className="divider" />

        <div className="parties">
          <div>
            <div className="party-label">De</div>
            <div className="party-name">{org?.name}</div>
            <div className="party-info">
              {org?.address && <>{org.address}<br /></>}
              {org?.city}<br />
              {org?.tax_number && <>ICE: {org.tax_number}</>}
            </div>
          </div>
          <div>
            <div className="party-label">Proposé à</div>
            <div className="party-name">{client?.name ?? '—'}</div>
            <div className="party-info">
              {client?.address && <>{client.address}<br /></>}
              {client?.city && <>{client.city}<br /></>}
              {client?.email && <>{client.email}<br /></>}
              {client?.phone && <>{client.phone}<br /></>}
              {client?.tax_number && <>ICE: {client.tax_number}</>}
            </div>
          </div>
        </div>

        <div className="dates">
          <div className="date-item">
            <div className="label">Date d'émission</div>
            <div className="value">{new Date(quote.issue_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
          </div>
          <div className="date-item">
            <div className="label">Valable jusqu'au</div>
            <div className="value">{quote.expiry_date ? new Date(quote.expiry_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</div>
          </div>
          <div className="date-item">
            <div className="label">Devise</div>
            <div className="value">{quote.currency || 'MAD'}</div>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Description</th>
              <th style={{ width: '10%' }}>Qté</th>
              <th style={{ width: '15%' }}>P.U.</th>
              <th style={{ width: '10%' }}>TVA</th>
              <th style={{ width: '10%' }}>Remise</th>
              <th style={{ width: '15%' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? items.map((item: any, i: number) => {
              const base = item.quantity * item.unit_price
              const disc = base * ((item.discount_percent || 0) / 100)
              const sub = base - disc
              const tax = sub * ((item.tax_rate || 0) / 100)
              const total = sub + tax
              return (
                <tr key={i}>
                  <td className="desc">{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{fmt(item.unit_price)}</td>
                  <td>{item.tax_rate || 0}%</td>
                  <td>{item.discount_percent || 0}%</td>
                  <td>{fmt(total)}</td>
                </tr>
              )
            }) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#a1a1aa', padding: '24px' }}>Aucune ligne</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="totals">
          <div className="totals-box">
            <div className="total-row">
              <span>Sous-total HT</span>
              <span>{fmt(quote.subtotal)} {quote.currency || 'MAD'}</span>
            </div>
            <div className="total-row">
              <span>TVA</span>
              <span>{fmt(quote.tax_amount)} {quote.currency || 'MAD'}</span>
            </div>
            {(quote.discount_amount || 0) > 0 && (
              <div className="total-row">
                <span>Remise</span>
                <span>-{fmt(quote.discount_amount)} {quote.currency || 'MAD'}</span>
              </div>
            )}
            <div className="total-row grand">
              <span>Total TTC</span>
              <span>{fmt(quote.total)} {quote.currency || 'MAD'}</span>
            </div>
          </div>
        </div>

        {quote.notes && (
          <div className="notes-section">
            <div className="notes-label">Notes</div>
            <div className="notes-text">{quote.notes}</div>
          </div>
        )}

        {quote.terms && (
          <div className="notes-section">
            <div className="notes-label">Conditions</div>
            <div className="notes-text">{quote.terms}</div>
          </div>
        )}

        <div className="signature-area">
          <div>
            <div className="sig-label">Bon pour accord — Signature client</div>
            <div className="sig-box" />
          </div>
          <div>
            <div className="sig-label">Cachet & Signature</div>
            <div className="sig-box" />
          </div>
        </div>

        <div className="footer">
          <div className="footer-divider" />
          <div className="footer-content">
            <span>{org?.name} {org?.tax_number ? `· ICE: ${org.tax_number}` : ''}</span>
            <span>Document généré par BizSuite</span>
            <span>{quote.quote_number}</span>
          </div>
        </div>
      </div>
    </>
  )
}
