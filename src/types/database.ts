export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: { Row: any; Insert: any; Update: any }
      profiles: { Row: any; Insert: any; Update: any }
      organization_members: { Row: any; Insert: any; Update: any }
      clients: { Row: any; Insert: any; Update: any }
      contacts: { Row: any; Insert: any; Update: any }
      deals: { Row: any; Insert: any; Update: any }
      products: { Row: any; Insert: any; Update: any }
      quotes: { Row: any; Insert: any; Update: any }
      quote_items: { Row: any; Insert: any; Update: any }
      invoices: { Row: any; Insert: any; Update: any }
      invoice_items: { Row: any; Insert: any; Update: any }
      payments: { Row: any; Insert: any; Update: any }
      activity_logs: { Row: any; Insert: any; Update: any }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
  }
}

export type Organization = { id: string; name: string; slug: string; logo_url: string | null; email: string | null; phone: string | null; address: string | null; city: string | null; country: string; currency: string; tax_number: string | null; invoice_prefix: string; quote_prefix: string; next_invoice_number: number; next_quote_number: number; plan: string; created_at: string; updated_at: string }
export type Profile = { id: string; email: string; full_name: string | null; avatar_url: string | null; created_at: string; updated_at: string }
export type Client = { id: string; organization_id: string; type: string; status: string; name: string; email: string | null; phone: string | null; website: string | null; address: string | null; city: string | null; country: string | null; tax_number: string | null; notes: string | null; tags: string[]; created_by: string | null; created_at: string; updated_at: string }
export type Contact = { id: string; organization_id: string; client_id: string | null; first_name: string; last_name: string; email: string | null; phone: string | null; job_title: string | null; notes: string | null; is_primary: boolean; created_at: string; updated_at: string }
export type Deal = { id: string; organization_id: string; client_id: string | null; contact_id: string | null; title: string; stage: string; value: number; probability: number; expected_close_date: string | null; notes: string | null; assigned_to: string | null; created_by: string | null; created_at: string; updated_at: string }
export type Quote = { id: string; organization_id: string; client_id: string | null; contact_id: string | null; quote_number: string; status: string; title: string | null; notes: string | null; terms: string | null; issue_date: string; expiry_date: string | null; subtotal: number; tax_amount: number; discount_amount: number; total: number; currency: string; created_by: string | null; created_at: string; updated_at: string }
export type Invoice = { id: string; organization_id: string; client_id: string | null; contact_id: string | null; quote_id: string | null; invoice_number: string; status: string; title: string | null; notes: string | null; terms: string | null; issue_date: string; due_date: string | null; subtotal: number; tax_amount: number; discount_amount: number; total: number; amount_paid: number; currency: string; created_by: string | null; created_at: string; updated_at: string }
export type Payment = { id: string; organization_id: string; invoice_id: string; amount: number; method: string; reference: string | null; notes: string | null; payment_date: string; created_by: string | null; created_at: string }
