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

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const navigate   = useNavigate()
  const location   = useLocation()
  const { user, logout, isAdmin } = useAuth()

  function handleNav(path) {
    navigate(path)
    if (onMobileClose) onMobileClose()
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin())

  return (
    <>
      <div className={`sidebar-overlay${mobileOpen ? ' show' : ''}`} onClick={onMobileClose} />
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        {/* Flame + Leaf logo */}
        <div className="logo-icon">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Rounded Square Frame */}
            <rect x="2" y="2" width="36" height="36" rx="8" stroke="currentColor" strokeWidth="2.5" className="logo-frame" />
            
            {/* Flame Shape — Adjusted to match image closer */}
            <path d="M16 8 C16 8 8 16 8 24 C8 30 11.5 34 16 34 C20.5 34 24 30 24 24 C24 19 20 14 18 11 C18 11 18 17 15 19 C12 21 10 24 12 27 C12 27 9 25 9 21 C9 17 16 8 16 8Z"
              fill="url(#flameGrad)" className="logo-flame" />
            
            {/* Leaf Shape — Adjusted to overlap like the image */}
            <path d="M18 26 C18 26 15 21 21 17 C27 13 31 16 31 16 C31 16 28 26 18 26Z"
              fill="url(#leafGrad)" />
              
            <defs>
              <linearGradient id="flameGrad" x1="16" y1="8" x2="16" y2="34" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#f97316"/>
                <stop offset="100%" stopColor="#ea6c10"/>
              </linearGradient>
              <linearGradient id="leafGrad" x1="18" y1="28" x2="31" y2="15" gradientUnits="userSpaceOnUse">
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
    </>
  )
}
