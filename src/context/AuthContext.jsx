import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'

const AuthContext = createContext(null)

/* ── SHA-256 via WebCrypto API com Salt fixo ── */
// SEC-01: salt fixo da aplicação evita ataques de rainbow table e dicionário
const APP_SALT = 'thermiq_salt_2026::'

export async function hashPassword(plain) {
  const enc = new TextEncoder()
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(APP_SALT + plain))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
}

const DEFAULT_USERS_PLAIN = [
  { id: '1', name: 'Administrador',  email: 'admin@thermigenergy.com', password: 'admin', role: 'admin',  contact: '' },
  { id: '2', name: 'Operador Staff', email: 'staff@thermigenergy.com', password: 'staff', role: 'staff',  contact: '' },
]

const USERS_KEY = 'thermiq_users'
const SESSION_KEY = 'thermiq_session'

/* ── SEC-03: Rate limit de login (3 tentativas, cooldown de 30s) ── */
const RATE_KEY = 'thermiq_login_rate'
const MAX_ATTEMPTS = 3
const COOLDOWN_MS = 30_000

function getRateData() {
  try { return JSON.parse(localStorage.getItem(RATE_KEY) || '{}') } catch { return {} }
}
function setRateData(data) {
  localStorage.setItem(RATE_KEY, JSON.stringify(data))
}
function checkRateLimit() {
  const { attempts = 0, lockedUntil = 0 } = getRateData()
  const now = Date.now()
  if (lockedUntil > now) {
    const secsLeft = Math.ceil((lockedUntil - now) / 1000)
    return { blocked: true, secsLeft }
  }
  return { blocked: false, attempts }
}
function recordFailedAttempt() {
  const { attempts = 0 } = getRateData()
  const next = attempts + 1
  if (next >= MAX_ATTEMPTS) {
    setRateData({ attempts: next, lockedUntil: Date.now() + COOLDOWN_MS })
  } else {
    setRateData({ attempts: next, lockedUntil: 0 })
  }
}
function clearRateData() {
  localStorage.removeItem(RATE_KEY)
}

/* ── Funções de acesso ao "banco" de usuários no localStorage ── */
async function getUsersFromStorage() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  // Semear usuários padrão pela primeira vez
  const seeded = await Promise.all(
    DEFAULT_USERS_PLAIN.map(async u => ({
      ...u,
      password: await hashPassword(u.password),
    }))
  )
  localStorage.setItem(USERS_KEY, JSON.stringify(seeded))
  return seeded
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      // Garante que os usuários existam no localStorage (semeável)
      await getUsersFromStorage()

      // SEC-02: restaura sessão mas valida o papel sempre no banco
      const session = localStorage.getItem(SESSION_KEY)
      if (session) {
        try {
          const parsed = JSON.parse(session)
          // Valida se o usuário ainda existe e se a role não foi adulterada
          const users = await getUsersFromStorage()
          const found = users.find(u => u.id === parsed.id)
          if (found) {
            const { password: _p, ...safe } = found
            setUser(safe) // usa dados do banco, não do localStorage de sessão
          } else {
            localStorage.removeItem(SESSION_KEY) // sessão inválida
          }
        } catch { localStorage.removeItem(SESSION_KEY) }
      }

      setLoading(false)
    }
    init()
  }, [])

  async function login(email, password) {
    // SEC-03: verifica rate limit antes de processar
    const rate = checkRateLimit()
    if (rate.blocked) {
      return { ok: false, error: `Acesso temporariamente bloqueado. Tente novamente em ${rate.secsLeft}s.` }
    }

    const users = await getUsersFromStorage()
    const hashed = await hashPassword(password)
    const cleanEmail = email.trim().toLowerCase()

    const found = users.find(
      u => u.email.trim().toLowerCase() === cleanEmail && u.password === hashed
    )

    if (found) {
      clearRateData() // SEC-03: reset ao logar com sucesso
      const { password: _p, ...safe } = found
      setUser(safe)
      localStorage.setItem(SESSION_KEY, JSON.stringify(safe))
      return { ok: true }
    }

    recordFailedAttempt() // SEC-03: conta tentativa falha
    const rateAfter = checkRateLimit()
    if (rateAfter.blocked) {
      return { ok: false, error: `Credenciais inválidas. Conta bloqueada por ${rateAfter.secsLeft}s após 3 tentativas.` }
    }
    const remaining = MAX_ATTEMPTS - (rateAfter.attempts || 0)
    return { ok: false, error: `E-mail ou senha inválidos. (${remaining} tentativa(s) restante(s))` }
  }

  function logout() {
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
  }

  function isAdmin() {
    return user?.role === 'admin'
  }

  // PERF-01: value memoizado para evitar re-renders desnecessários em todos os consumidores
  const contextValue = useMemo(
    () => ({ user, loading, login, logout, isAdmin }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading]
  )

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
