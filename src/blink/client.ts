import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mtfwljhcxjvjhnfgrhqo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10ZndsamhjeGp2amhuZmdyaHFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NDEwMzEsImV4cCI6MjA2ODMxNzAzMX0.HbYvzkkz_4Xk26otBFIMSTg20aXCr_2YcDsnPZeosrY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase