// Bridge file: re-exports the new env-based client for backward compatibility.
// TODO: Remove this file once all imports are migrated to @/lib/supabase/client
import { createClient } from '@/lib/supabase/client'

export const supabase = createClient()