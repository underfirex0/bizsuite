import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PrintInvoice } from './PrintInvoice'

export default async function InvoicePrintPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, clients(*), invoice_items(*)')
    .eq('id', params.id)
    .single()

  if (!invoice) notFound()

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', invoice.organization_id)
    .single()

  return <PrintInvoice invoice={invoice} org={org} />
}
