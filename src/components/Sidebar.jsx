import React, { useState } from 'react'
import logoSrc from '../assets/logo.svg'
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
  { path: '/banco',       label: 'Banco de Relatórios',   icon: FileText,        adminOnly: false },
  { path: '/banco/dados', label: 'Dados Operacionais',    icon: BarChart3,       adminOnly: false },
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
        <div className="logo-icon">
          <img
            src={logoSrc}
            alt="ThermIQ Energy"
            className="logo-img"
            style={{ width: collapsed ? 36 : 48, height: 'auto', display: 'block' }}
          />
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
