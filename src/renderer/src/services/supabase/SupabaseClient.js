import { createClient } from '@supabase/supabase-js'
const SUPABASE_URL = 'https://zfxnatzrqjulpuuuirzp.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmeG5hdHpycWp1bHB1dXVpcnpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MTE2MTksImV4cCI6MjA2NzA4NzYxOX0.bQaxZUSFPvKaUS5t2Ji8xKtlmpN8BH1NR3tIqYoIEdE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
