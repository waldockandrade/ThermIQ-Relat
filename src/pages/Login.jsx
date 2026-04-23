import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import logoSrc from '../assets/logo.svg'
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
            <img
              src={logoSrc}
              alt="ThermIQ Energy"
              style={{ width: 180, height: 'auto', display: 'block', margin: '0 auto' }}
            />
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

