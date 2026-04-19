import React, { useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppDataProvider } from './context/AppDataContext'
import Sidebar from './components/Sidebar'
import Topbar  from './components/Topbar'

// --- Lazy Loads (Performance) ---
const Login           = lazy(() => import('./pages/Login'))
const Variaveis       = lazy(() => import('./pages/Variaveis'))
const NovoRelatorio   = lazy(() => import('./pages/NovoRelatorio'))
const Lancamento      = lazy(() => import('./pages/Lancamento'))
const Dashboard       = lazy(() => import('./pages/Dashboard'))
const Paradas         = lazy(() => import('./pages/Paradas'))
const Manutencao      = lazy(() => import('./pages/Manutencao'))
const BancoRelatorios = lazy(() => import('./pages/BancoRelatorios'))
const BancoDados      = lazy(() => import('./pages/BancoDados'))
const Usuarios        = lazy(() => import('./pages/Usuarios'))

const PageLoading = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'50vh', flexDirection: 'column', gap: 12 }}>
    <div className="spinner" style={{ width:32, height:32 }} />
    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Carregando módulo...</span>
  </div>
)

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <div className="spinner" style={{ width:32, height:32 }} />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar 
        collapsed={collapsed} 
        onToggle={() => setCollapsed(v => !v)} 
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={`app-main${collapsed ? ' sidebar-collapsed' : ''}`}>
        <Topbar onMobileToggle={() => setMobileOpen(v => !v)} />
        <main className="page-content">
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route path="/"                      element={<Navigate to="/variaveis" replace />} />
              <Route path="/variaveis"             element={<Variaveis />} />
              <Route path="/relatorio/novo"        element={<NovoRelatorio />} />
              <Route path="/relatorio/lancamento"  element={<Lancamento />} />
              <Route path="/dashboard"             element={<Dashboard />} />
              <Route path="/paradas"               element={<Paradas />} />
              <Route path="/manutencao"            element={<Manutencao />} />
              <Route path="/banco"                 element={<BancoRelatorios />} />
              <Route path="/banco/dados"           element={<BancoDados />} />
              <Route path="/usuarios"              element={<Usuarios />} />
              <Route path="*"                      element={<Navigate to="/variaveis" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppDataProvider>
          <Suspense fallback={<div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><div className="spinner"></div></div>}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
