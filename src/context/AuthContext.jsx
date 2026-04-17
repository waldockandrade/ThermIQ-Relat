import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

/* ── SHA-256 via WebCrypto API ── */
export async function hashPassword(plain) {
  const enc = new TextEncoder()
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(plain))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
}

const DEFAULT_USERS_PLAIN = [
  { id: '1', name: 'Administrador',  email: 'admin@thermigenergy.com', password: 'admin', role: 'admin',  contact: '' },
  { id: '2', name: 'Operador Staff', email: 'staff@thermigenergy.com', password: 'staff', role: 'staff',  contact: '' },
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      // 1. Restore session from localStorage (session only, not the database)
      const session = localStorage.getItem('thermiq_session')
      if (session) {
        try { setUser(JSON.parse(session)) } catch { /* ignore */ }
      }

      // 2. Fetch users database from Supabase
      if (!supabase) {
        console.warn("AuthContext: Supabase não inicializado. Verifique VITE_SUPABASE keys.")
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase.from('app_data').select('*').eq('id', 'thermiq_users').single()
        
        if (error && error.code !== 'PGRST116') {
           console.error("AuthContext Init Error:", error.message)
        }

        let storedUsers = data?.data
        
        let shouldSeed = !storedUsers || !Array.isArray(storedUsers) || storedUsers.length === 0

        if (shouldSeed) {
          console.log("AuthContext: Semeando usuários padrão no banco...")
          const seeded = await Promise.all(
            DEFAULT_USERS_PLAIN.map(async u => ({
              ...u,
              password: await hashPassword(u.password),
            }))
          )
          await supabase.from('app_data').upsert({ id: 'thermiq_users', data: seeded })
        }
      } catch (err) {
        console.error("AuthContext Critical Init Error:", err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  async function login(email, password) {
    if (!supabase) return { ok: false, error: 'Banco de dados inacessível. Verifique chaves VITE.' }

    // Busca banco de usuários atualizado do Supabase
    const { data, error } = await supabase.from('app_data').select('*').eq('id', 'thermiq_users').single()
    if (error) {
       console.error("Erro ao buscar usuários para login:", error)
       return { ok: false, error: 'Erro de conexão com o banco de dados.' }
    }

    const users = data?.data || []
    const hashed = await hashPassword(password)
    const cleanEmail = email.trim().toLowerCase()
    
    // DEBUG LOGS (Visualizar no F12 do navegador)
    console.log("--- DIAGNÓSTICO DE LOGIN ---")
    console.log("Email tentado:", cleanEmail)
    console.log("Hash gerado (local):", hashed)
    
    const found = users.find(
      u => u.email.trim().toLowerCase() === cleanEmail && u.password === hashed
    )

    if (found) {
      console.log("Login autorizado para:", found.name)
      const { password: _p, ...safe } = found
      setUser(safe)
      localStorage.setItem('thermiq_session', JSON.stringify(safe))
      return { ok: true }
    }

    console.warn("Login falhou. Verifique se o e-mail ou senha estão corretos.")
    return { ok: false, error: 'E-mail ou senha inválidos.' }
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('thermiq_session')
  }

  function isAdmin() {
    return user?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
