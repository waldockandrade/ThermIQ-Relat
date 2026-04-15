import React from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Search, Calendar } from 'lucide-react'
import './Topbar.css'

const ROUTE_LABELS = {
  '/variaveis':            { label: 'Variáveis de Processo',  sub: 'Tela 1' },
  '/relatorio/novo':       { label: 'Novo Relatório',         sub: 'Tela 2' },
  '/relatorio/lancamento': { label: 'Lançamento de Dados',    sub: 'Tela 3' },
  '/dashboard':            { label: 'Dashboard',              sub: 'Tela 4' },
  '/paradas':              { label: 'Paradas de Processo',    sub: 'Tela 5' },
  '/manutencao':           { label: 'Notas de Manutenção',   sub: 'Tela 6' },
  '/banco':                { label: 'Banco de Relatórios',   sub: 'Tela 7' },
  '/usuarios':             { label: 'Gestão de Usuários',    sub: 'Tela 8' },
}

function nowLabel() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  })
}

export default function Topbar() {
  const location = useLocation()
  const route    = ROUTE_LABELS[location.pathname] || { label: 'ThermIQ Relat', sub: '' }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-sub">{route.sub}</span>
        <h1 className="topbar-title">{route.label}</h1>
      </div>

      <div className="topbar-right">
        <div className="topbar-date">
          <Calendar size={14} />
          <span>{nowLabel()}</span>
        </div>
        <div className="topbar-divider" />
        <button className="topbar-icon-btn" title="Notificações">
          <Bell size={18} />
        </button>
      </div>
    </header>
  )
}
