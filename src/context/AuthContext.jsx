import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

/* ── SHA-256 via WebCrypto API ── */
async function hashPassword(plain) {
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
      // Seed default users with hashed passwords if not present
      let stored = localStorage.getItem('thermiq_users')
      let shouldSeed = !stored
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          // Check if any user has a non-hashed password (SHA-256 hash is 64 characters)
          if (parsed.some(u => u.password && u.password.length < 60)) {
            shouldSeed = true
          }
        } catch (e) {
          shouldSeed = true
        }
      }

      if (shouldSeed) {
        const seeded = await Promise.all(
          DEFAULT_USERS_PLAIN.map(async u => ({
            ...u,
            password: await hashPassword(u.password),
          }))
        )
        localStorage.setItem('thermiq_users', JSON.stringify(seeded))
      }
      // Restore session
      const session = localStorage.getItem('thermiq_session')
      if (session) {
        try { setUser(JSON.parse(session)) } catch { /* ignore */ }
      }
      setLoading(false)
    }
    init()
  }, [])

  async function login(email, password) {
    const users = JSON.parse(localStorage.getItem('thermiq_users') || '[]')
    const hashed = await hashPassword(password)
    const found = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === hashed
    )
    if (found) {
      const { password: _p, ...safe } = found
      setUser(safe)
      localStorage.setItem('thermiq_session', JSON.stringify(safe))
      return { ok: true }
    }
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
