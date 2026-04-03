import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Public client — used for guest-facing RSVP operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client — used for admin dashboard operations only
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
