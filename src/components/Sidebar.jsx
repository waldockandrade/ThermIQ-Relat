import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Table2,
  BarChart3,
  PauseCircle,
  Wrench,
  Database,
  Users,
  ChevronLeft,
  ChevronRight,
  Flame,
  LogOut,
} from 'lucide-react'
import './Sidebar.css'

const NAV_ITEMS = [
  { path: '/variaveis',    label: 'Variáveis de Processo', icon: Table2,          adminOnly: true },
  { path: '/relatorio/novo', label: 'Novo Relatório',      icon: ClipboardList,   adminOnly: false },
  { path: '/relatorio/lancamento', label: 'Lançamento',   icon: FileText,        adminOnly: false },
  { path: '/dashboard',   label: 'Dashboard',              icon: LayoutDashboard, adminOnly: false },
  { path: '/paradas',     label: 'Paradas de Processo',    icon: PauseCircle,     adminOnly: false },
  { path: '/manutencao',  label: 'Notas de Manutenção',   icon: Wrench,          adminOnly: false },
  { path: '/banco',       label: 'Banco de Relatórios',   icon: Database,        adminOnly: false },
  { path: '/usuarios',    label: 'Gestão de Usuários',    icon: Users,           adminOnly: true  },
]

export default function Sidebar({ collapsed, onToggle }) {
  const navigate   = useNavigate()
  const location   = useLocation()
  const { user, logout, isAdmin } = useAuth()

  function handleNav(path) {
    navigate(path)
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin())

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        {/* Flame + Leaf logo */}
        <div className="logo-icon">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Flame */}
            <path d="M18 4 C18 4 10 12 10 20 C10 26 13.5 30 18 30 C22.5 30 26 26 26 20 C26 15 22 10 20 7 C20 7 20 13 17 15 C14 17 12 20 14 23 C14 23 11 21 11 17 C11 13 18 4 18 4Z"
              fill="url(#flameGrad)" />
            {/* Leaf */}
            <path d="M16 22 C16 22 14 18 18 15 C22 12 24 14 24 14 C24 14 22 22 16 22Z"
              fill="url(#leafGrad)" opacity="0.95"/>
            <defs>
              <linearGradient id="flameGrad" x1="18" y1="4" x2="18" y2="30" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#fb923c"/>
                <stop offset="100%" stopColor="#ea6c10"/>
              </linearGradient>
              <linearGradient id="leafGrad" x1="16" y1="23" x2="24" y2="13" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4ade80"/>
                <stop offset="100%" stopColor="#16a34a"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        {!collapsed && (
          <div className="logo-text">
            <span className="logo-title">ThermIQ</span>
            <span className="logo-sub">RELAT</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {visibleItems.map((item, idx) => {
          const Icon    = item.icon
          const isActive = location.pathname === item.path ||
                           (item.path !== '/' && location.pathname.startsWith(item.path))
          return (
            <button
              key={idx}
              className={`nav-item${isActive ? ' active' : ''}`}
              onClick={() => handleNav(item.path)}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
              {isActive && <div className="nav-indicator" />}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {!collapsed && user && (
          <div className="user-info">
            <div className="user-avatar">{user.name?.charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role === 'admin' ? 'Administrador' : 'Staff'}</span>
            </div>
          </div>
        )}
        <button className="logout-btn" onClick={handleLogout} title="Sair">
          <LogOut size={16} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button className="collapse-btn" onClick={onToggle}>
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  )
}
