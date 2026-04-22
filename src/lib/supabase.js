import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase: variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não encontradas.')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
