import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PrintQuote } from './PrintQuote'

export default async function QuotePrintPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: quote } = await supabase
    .from('quotes')
    .select('*, clients(*), quote_items(*)')
    .eq('id', params.id)
    .single()

  if (!quote) notFound()

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', quote.organization_id)
    .single()

  return <PrintQuote quote={quote} org={org} />
}
