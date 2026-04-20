import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Allowed users — update with real Google emails
export const ALLOWED_USERS = [
  'pablo@onesevenia.com',
  'alberto@onesevenia.com',
  // add gmail addresses too if needed
]

export const USERS_CONFIG = {
  pablo: {
    name: 'Pablo',
    avatar: 'P',
    color: '#6366f1',
  },
  alberto: {
    name: 'Alberto',
    avatar: 'A',
    color: '#10b981',
  },
}
