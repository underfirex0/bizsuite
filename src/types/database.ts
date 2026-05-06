export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          country: string
          currency: string
          tax_number: string | null
          invoice_prefix: string
          quote_prefix: string
          next_invoice_number: number
          next_quote_number: number
          plan: 'free' | 'pro' | 'enterprise'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      clients: {
        Row: {
          id: string
          organization_id: string
          type: 'company' | 'individual'
          status: 'active' | 'inactive' | 'prospect' | 'archived'
          name: string
          email: string | null
          phone: string | null
          website: string | null
          address: string | null
          city: string | null
          country: string | null
          tax_number: string | null
          notes: string | null
          tags: string[]
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      contacts: {
        Row: {
          id: string
          organization_id: string
          client_id: string | null
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          job_title: string | null
          notes: string | null
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['contacts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['contacts']['Insert']>
      }
      deals: {
        Row: {
          id: string
          organization_id: string
          client_id: string | null
          contact_id: string | null
          title: string
          stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
          value: number
          probability: number
          expected_close_date: string | null
          notes: string | null
          assigned_to: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['deals']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['deals']['Insert']>
      }
      quotes: {
        Row: {
          id: string
          organization_id: string
          client_id: string | null
          contact_id: string | null
          quote_number: string
          status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
          title: string | null
          notes: string | null
          terms: string | null
          issue_date: string
          expiry_date: string | null
          subtotal: number
          tax_amount: number
          discount_amount: number
          total: number
          currency: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['quotes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['quotes']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          organization_id: string
          client_id: string | null
          contact_id: string | null
          quote_id: string | null
          invoice_number: string
          status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled'
          title: string | null
          notes: string | null
          terms: string | null
          issue_date: string
          due_date: string | null
          subtotal: number
          tax_amount: number
          discount_amount: number
          total: number
          amount_paid: number
          currency: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
      payments: {
        Row: {
          id: string
          organization_id: string
          invoice_id: string
          amount: number
          method: 'cash' | 'bank_transfer' | 'check' | 'card' | 'other'
          reference: string | null
          notes: string | null
          payment_date: string
          created_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
    }
  }
}

// Convenience types
export type Organization = Database['public']['Tables']['organizations']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Contact = Database['public']['Tables']['contacts']['Row']
export type Deal = Database['public']['Tables']['deals']['Row']
export type Quote = Database['public']['Tables']['quotes']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
