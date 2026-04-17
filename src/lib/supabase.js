import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let client = null;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.trim() === '' || supabaseAnonKey.trim() === '') {
  console.error("Faltam as credenciais do Supabase. O banco de dados nao pode ser conectado.")
} else {
  // Tratamento de segurança, assegurar que url é válida
  try {
     client = createClient(supabaseUrl.trim(), supabaseAnonKey.trim())
  } catch(e) {
     console.error("Erro fatal ao carregar supabase:", e)
  }
}

export const supabase = client
