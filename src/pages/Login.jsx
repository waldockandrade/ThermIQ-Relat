import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Flame, Eye, EyeOff, AlertCircle } from 'lucide-react'
import './Login.css'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login }               = useAuth()
  const navigate                = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    const result = await login(email, password)
    setLoading(false)
    if (result.ok) {
      navigate('/variaveis')
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="login-page">
      {/* Background grid */}
      <div className="login-bg">
        <div className="bg-grid" />
        <div className="bg-glow" />
      </div>

      <div className="login-container">
        {/* Left — Branding */}
        <div className="login-brand">
          <div className="brand-logo">
            <svg width="48" height="48" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 4 C18 4 10 12 10 20 C10 26 13.5 30 18 30 C22.5 30 26 26 26 20 C26 15 22 10 20 7 C20 7 20 13 17 15 C14 17 12 20 14 23 C14 23 11 21 11 17 C11 13 18 4 18 4Z"
                fill="url(#flameGradL)" />
              <path d="M16 22 C16 22 14 18 18 15 C22 12 24 14 24 14 C24 14 22 22 16 22Z"
                fill="url(#leafGradL)" opacity="0.95"/>
              <defs>
                <linearGradient id="flameGradL" x1="18" y1="4" x2="18" y2="30" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#fb923c"/>
                  <stop offset="100%" stopColor="#ea6c10"/>
                </linearGradient>
                <linearGradient id="leafGradL" x1="16" y1="23" x2="24" y2="13" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#4ade80"/>
                  <stop offset="100%" stopColor="#16a34a"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1>ThermIQ<br /><span>RELAT</span></h1>
          <p>Monitoramento operacional de caldeiras a biomassa.</p>
          <div className="brand-stats">
            <div className="brand-stat">
              <span className="bs-val">8</span>
              <span className="bs-lbl">Módulos</span>
            </div>
            <div className="brand-stat">
              <span className="bs-val">PT-BR</span>
              <span className="bs-lbl">Idioma</span>
            </div>
            <div className="brand-stat">
              <span className="bs-val">MVP</span>
              <span className="bs-lbl">Versão</span>
            </div>
          </div>
        </div>

        {/* Right — Form */}
        <div className="login-form-box">
          <div className="login-form-header">
            <h2>Entrar no sistema</h2>
            <p>Use suas credenciais de acesso</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="login-email">E-mail</label>
              <input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Senha</label>
              <div className="pw-wrapper">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
              {loading ? <><span className="spinner" />Verificando...</> : 'Entrar'}
            </button>

            {/* login-hint removido — não exibir credenciais em produção */}
          </form>
        </div>
      </div>
    </div>
  )
}
