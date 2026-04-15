import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppDataProvider } from './context/AppDataContext'
import Sidebar from './components/Sidebar'
import Topbar  from './components/Topbar'
import Login         from './pages/Login'
import Variaveis     from './pages/Variaveis'
import NovoRelatorio from './pages/NovoRelatorio'
import Lancamento    from './pages/Lancamento'
import Dashboard     from './pages/Dashboard'
import Paradas       from './pages/Paradas'
import Manutencao    from './pages/Manutencao'
import BancoRelatorios from './pages/BancoRelatorios'
import Usuarios      from './pages/Usuarios'

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

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <div className={`app-main${collapsed ? ' sidebar-collapsed' : ''}`}>
        <Topbar />
        <main className="page-content">
          <Routes>
            <Route path="/"                      element={<Navigate to="/variaveis" replace />} />
            <Route path="/variaveis"             element={<Variaveis />} />
            <Route path="/relatorio/novo"        element={<NovoRelatorio />} />
            <Route path="/relatorio/lancamento"  element={<Lancamento />} />
            <Route path="/dashboard"             element={<Dashboard />} />
            <Route path="/paradas"               element={<Paradas />} />
            <Route path="/manutencao"            element={<Manutencao />} />
            <Route path="/banco"                 element={<BancoRelatorios />} />
            <Route path="/usuarios"              element={<Usuarios />} />
            <Route path="*"                      element={<Navigate to="/variaveis" replace />} />
          </Routes>
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
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            } />
          </Routes>
        </AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
