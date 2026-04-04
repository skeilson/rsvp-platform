import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Admin client — server-side only, never import this in a client component
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
