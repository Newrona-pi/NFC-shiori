import { createClient as createBareClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

/** Service-role client for all DB/Storage operations. */
export function createServiceClient() {
  return createBareClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
