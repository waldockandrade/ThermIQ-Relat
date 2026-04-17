import { createClient } from '@supabase/supabase-js'

let client = null

const rawUrl = import.meta.env.VITE_SUPABASE_URL
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabaseUrl = rawUrl?.trim()
const supabaseAnonKey = rawKey?.trim()

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === '' || supabaseAnonKey === '') {
  console.error("ERRO CRÍTICO: Chaves do Supabase não encontradas no ambiente (Vercel/Local).")
} else {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey)
  } catch (e) {
    console.error("ERRO FATAL ao inicializar Supabase Client:", e)
  }
}

export const supabase = client
