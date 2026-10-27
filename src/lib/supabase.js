import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Without these the app runs in local mode: films stay in this browser.
export const supabase = url && anonKey ? createClient(url, anonKey) : null
export const isCloud = Boolean(supabase)
