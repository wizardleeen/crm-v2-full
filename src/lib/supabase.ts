import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://voyxrzvueadloyzcpebk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZveXhyenZ1ZWFkbG95emNwZWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NDc0MzIsImV4cCI6MjA4NzUyMzQzMn0.i85WF9oeT2hkncXjELuFfNonYxN7Gz73UzseopZkP3M'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库表类型
export interface Customer {
  id: number
  name: string
  email: string
  phone: string
  company: string
  industry: string
  status: 'lead' | 'prospect' | 'customer' | 'inactive'
  source: string
  notes: string
  created_at: string
  updated_at: string
}

export interface Contact {
  id: number
  customer_id: number
  name: string
  email: string
  phone: string
  position: string
  is_primary: boolean
  created_at: string
}

export interface Opportunity {
  id: number
  customer_id: number
  title: string
  value: number
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost'
  probability: number
  expected_close_date: string
  notes: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: number
  title: string
  description: string
  type: 'call' | 'meeting' | 'email' | 'follow_up' | 'other'
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  due_date: string
  related_customer_id?: number
  related_opportunity_id?: number
  created_at: string
  updated_at: string
}

export interface Activity {
  id: number
  type: string
  description: string
  customer_id?: number
  opportunity_id?: number
  task_id?: number
  created_at: string
}
