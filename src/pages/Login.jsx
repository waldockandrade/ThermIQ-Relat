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
      <div className="login-container">
        {/* Lado Esquerdo — Branding */}
        <div className="login-brand">
          <div className="brand-logo-framed">
            <svg width="60" height="60" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Rounded Square Frame — Sharper for formal industrial look */}
              <rect x="2" y="2" width="36" height="36" rx="2" stroke="currentColor" strokeWidth="2.5" className="logo-frame" />
              
              {/* Flame Shape */}
              <path d="M16 8 C16 8 8 16 8 24 C8 30 11.5 34 16 34 C20.5 34 24 30 24 24 C24 19 20 14 18 11 C18 11 18 17 15 19 C12 21 10 24 12 27 C12 27 9 25 9 21 C9 17 16 8 16 8Z"
                fill="url(#flameGradLogin)" />
              
              {/* Leaf Shape */}
              <path d="M18 26 C18 26 15 21 21 17 C27 13 31 16 31 16 C31 16 28 26 18 26Z"
                fill="url(#leafGradLogin)" />
                
              <defs>
                <linearGradient id="flameGradLogin" x1="16" y1="8" x2="16" y2="34" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#f97316"/>
                  <stop offset="100%" stopColor="#ea6c10"/>
                </linearGradient>
                <linearGradient id="leafGradLogin" x1="18" y1="28" x2="31" y2="15" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#4ade80"/>
                  <stop offset="100%" stopColor="#16a34a"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1>Therm<span>IQ</span></h1>
          <p>Plataforma técnica de gestão e monitoramento de ativos térmicos industriais.</p>

          <div className="brand-stats">
            <div className="brand-stat">
              <span className="bs-val">Local</span>
              <span className="bs-lbl">Armazenamento</span>
            </div>
            <div className="brand-stat">
              <span className="bs-val">100%</span>
              <span className="bs-lbl">Offline</span>
            </div>
          </div>
        </div>

        {/* Lado Direito — Formulário */}
        <div className="login-form-box">
          <div className="login-form-header">
            <h2>Acesso Restrito</h2>
            <p>Identifique-se para gerenciar o sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>E-MAIL CORPORATIVO</label>
              <input
                type="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label>CHAVE DE ACESSO</label>
              <div className="pw-wrapper">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
              {loading ? (
                <>Verificando Credenciais...</>
              ) : (
                <>Entrar no Dashboard</>
              )}
            </button>
          </form>
          
          <p style={{ marginTop: 32, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
            &copy; 2026 ThermIQ Industrial. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}

