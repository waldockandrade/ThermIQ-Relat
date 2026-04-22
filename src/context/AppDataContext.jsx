import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react'

const AppDataContext = createContext(null)

/* ---- Default seed data ---- */
const DEFAULT_CATEGORIES = [
  {
    id: 'cat-1', name: 'Temperatura',
    variables: [
      { id: 'v-1', name: 'Temp. Vapor Saída Boiler',  unit: '°C',      categoryId: 'cat-1' },
      { id: 'v-2', name: 'Temp. Água de Alimentação', unit: '°C',      categoryId: 'cat-1' },
      { id: 'v-3', name: 'Temp. Saída Gases Chaminé', unit: '°C',      categoryId: 'cat-1' },
    ],
  },
  {
    id: 'cat-2', name: 'Pressão',
    variables: [
      { id: 'v-4', name: 'Pressão Vapor Caldeira',    unit: 'kgf/cm²', categoryId: 'cat-2' },
      { id: 'v-5', name: 'Pressão Água de Alimentação',unit: 'kgf/cm²',categoryId: 'cat-2' },
    ],
  },
  {
    id: 'cat-3', name: 'Vazão / Produção',
    variables: [
      { id: 'v-6', name: 'Vazão Vapor Gerado',        unit: 'ton',     categoryId: 'cat-3' },
      { id: 'v-7', name: 'Vazão Água de Alimentação', unit: 'ton',     categoryId: 'cat-3' },
      { id: 'v-8', name: 'Consumo de Cavaco',         unit: 'm³/h',    categoryId: 'cat-3' },
    ],
  },
  {
    id: 'cat-4', name: 'Energia',
    variables: [
      { id: 'v-9',  name: 'Energia Elétrica Gerada',  unit: 'MW',     categoryId: 'cat-4' },
      { id: 'v-10', name: 'Energia Elétrica Consumida',unit: 'kWh',   categoryId: 'cat-4' },
    ],
  },
  {
    id: 'cat-5', name: 'Qualidade',
    variables: [
      { id: 'v-11', name: 'Condutividade da Água',    unit: 'µS/cm',  categoryId: 'cat-5' },
      { id: 'v-12', name: 'pH da Água',               unit: 'pH',     categoryId: 'cat-5' }, // B-05: corrigido de '-' para 'pH'
    ],
  },
]

/* ---- Default Dashboard Config ---- */
const DEFAULT_DASHBOARD_CONFIG = {
  customQuantitatives: [
    { id: 'q-1', varId: 'v-7', label: 'Água de Alimentação', max: 5000, color: '#3b82f6', iconName: 'Droplets', factor: 1, unitOverride: 'ton' },
    { id: 'q-2', varId: 'v-6', label: 'Vapor Gerado', max: 2000, color: '#22c55e', iconName: 'Wind', factor: 1, unitOverride: 'ton' },
    { id: 'q-3', varId: 'v-9', label: 'Energia Gerada', max: 50000, color: '#f97316', iconName: 'Zap', factor: 1000, unitOverride: 'kW' },
    { id: 'q-4', varId: 'v-10', label: 'Energia Consumida', max: 20000, color: '#a855f7', iconName: 'Activity', factor: 1, unitOverride: 'kWh' },
    { id: 'q-5', varId: 'v-8', label: 'Combustível (Cavaco)', max: 3000, color: '#eab308', iconName: 'Flame', factor: 1, unitOverride: 'm³' }
  ],
  customKPIs: [
    { id: 'k-1', label: 'kW Gerado / ton Vapor', numVarId: 'v-9', numFactor: 1000, denVarId: 'v-6', denFactor: 1, unit: 'kW/ton', meta: null, inverse: false, color: '#f97316' },
    { id: 'k-2', label: 'kWh Consumido / ton Vapor', numVarId: 'v-10', numFactor: 1, denVarId: 'v-6', denFactor: 1, unit: 'kWh/ton', meta: null, inverse: true, color: '#a855f7' },
    { id: 'k-3', label: 'kg Vapor / m³ Cavaco', numVarId: 'v-6', numFactor: 1000, denVarId: 'v-8', denFactor: 1, unit: 'kg/m³', meta: null, inverse: false, color: '#22c55e' }
  ],
  qualMetas: {},
}

export function AppDataProvider({ children }) {
  const [categories, setCategories]   = useState(DEFAULT_CATEGORIES)
  const [reports, setReports]         = useState([])
  const [downtimes, setDowntimes]     = useState([])
  const [maintenances, setMaintenances] = useState([])
  const [dashboardConfig, setDashboardConfig] = useState(DEFAULT_DASHBOARD_CONFIG)

  const [isLoaded, setIsLoaded] = useState(false)

  // Initialization: Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('thermiq_categories')
      if (raw) setCategories(JSON.parse(raw))

      const rawR = localStorage.getItem('thermiq_reports')
      if (rawR) setReports(JSON.parse(rawR))

      const rawD = localStorage.getItem('thermiq_downtimes')
      if (rawD) setDowntimes(JSON.parse(rawD))

      const rawM = localStorage.getItem('thermiq_maintenances')
      if (rawM) setMaintenances(JSON.parse(rawM))

      const rawDash = localStorage.getItem('thermiq_dashboard_config')
      if (rawDash) {
        const storedDash = JSON.parse(rawDash)
        setDashboardConfig(prev => ({
          ...prev,
          ...storedDash,
          qualMetas: { ...DEFAULT_DASHBOARD_CONFIG.qualMetas, ...(storedDash.qualMetas || {}) }
        }))
      }
    } catch (e) {
      console.error('Erro ao carregar dados do localStorage:', e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // --- Unified Sync Engine (Debounce → localStorage) ---
  const syncTimerRef = useRef(null)
  const isInitialLoad = useRef(true)

  useEffect(() => {
    if (!isLoaded) return
    if (isInitialLoad.current) {
      isInitialLoad.current = false
      return
    }

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)

    syncTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem('thermiq_categories', JSON.stringify(categories))
        localStorage.setItem('thermiq_reports', JSON.stringify(reports))
        localStorage.setItem('thermiq_downtimes', JSON.stringify(downtimes))
        localStorage.setItem('thermiq_maintenances', JSON.stringify(maintenances))
        localStorage.setItem('thermiq_dashboard_config', JSON.stringify(dashboardConfig))
      } catch (err) {
        console.error('❌ Erro ao persistir dados no localStorage:', err)
      }
    }, 1500)

    return () => { if (syncTimerRef.current) clearTimeout(syncTimerRef.current) }
  }, [categories, reports, downtimes, maintenances, dashboardConfig, isLoaded])

  /* ---- CATEGORIES / VARIABLES ---- */
  function addCategory(name) {
    const c = { id: `cat-${crypto.randomUUID()}`, name, variables: [] } // B-04: UUID em vez de Date.now()
    setCategories(prev => [...prev, c])
    return c
  }

  function updateCategory(id, name) {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c))
  }

  function deleteCategory(id) {
    // C-04: verifica se relatórios referenciam variáveis dessa categoria
    const cat = categories.find(c => c.id === id)
    if (cat && cat.variables.length > 0) {
      const catVarIds = new Set(cat.variables.map(v => v.id))
      const refsInReports = reports.some(r =>
        (r.selectedVarIds || []).some(vid => catVarIds.has(vid))
      )
      if (refsInReports) {
        const ok = window.confirm(
          `A categoria "${cat.name}" possui variáveis referenciadas em relatórios existentes.\n\nDeletar esta categoria irá zerar silenciosamente os KPIs desses relatórios.\n\nDeseja continuar?`
        )
        if (!ok) return
      }
    }
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  function addVariable(categoryId, { name, unit }) {
    const v = { id: `v-${crypto.randomUUID()}`, name, unit, categoryId } // B-04: UUID
    setCategories(prev => prev.map(c =>
      c.id === categoryId ? { ...c, variables: [...c.variables, v] } : c
    ))
    return v
  }

  function updateVariable(categoryId, varId, { name, unit }) {
    setCategories(prev => prev.map(c =>
      c.id === categoryId
        ? { ...c, variables: c.variables.map(v => v.id === varId ? { ...v, name, unit } : v) }
        : c
    ))
  }

  function deleteVariable(categoryId, varId) {
    setCategories(prev => prev.map(c =>
      c.id === categoryId
        ? { ...c, variables: c.variables.filter(v => v.id !== varId) }
        : c
    ))
  }

  function getAllVariables() {
    return categories.flatMap(c => c.variables)
  }

  /* ---- REPORTS ---- */
  function addReport(report) {
    const r = { ...report, id: `rep-${crypto.randomUUID()}`, createdAt: new Date().toISOString(), status: 'salvo' } // B-04: UUID
    setReports(prev => [r, ...prev])
    return r
  }

  function updateReport(id, data) {
    setReports(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
  }

  function deleteReport(id) {
    setReports(prev => prev.filter(r => r.id !== id))
  }

  /* ---- DOWNTIMES ---- */
  function addDowntime(dt) {
    const d = { ...dt, id: `dt-${crypto.randomUUID()}` } // B-04: UUID
    setDowntimes(prev => [d, ...prev])
    return d
  }

  function updateDowntime(id, data) {
    setDowntimes(prev => prev.map(d => d.id === id ? { ...d, ...data } : d))
  }

  function deleteDowntime(id) {
    setDowntimes(prev => prev.filter(d => d.id !== id))
  }

  /* ---- MAINTENANCES ---- */
  function addMaintenance(m) {
    const entry = { ...m, id: `mnt-${crypto.randomUUID()}` } // B-04: UUID
    setMaintenances(prev => [entry, ...prev])
    return entry
  }

  function updateMaintenance(id, data) {
    setMaintenances(prev => prev.map(m => m.id === id ? { ...m, ...data } : m))
  }

  function deleteMaintenance(id) {
    setMaintenances(prev => prev.filter(m => m.id !== id))
  }

  /* ---- DASHBOARD CONFIG ---- */
  function updateDashboardConfig(section, key, value) {
    if (key === null || key === undefined) {
      setDashboardConfig(prev => ({ ...prev, [section]: value }))
    } else {
      setDashboardConfig(prev => ({
        ...prev,
        [section]: { ...prev[section], [key]: value },
      }))
    }
  }

  // PERF-01: value memoizado para evitar re-renders desnecessários em consumidores
  const contextValue = useMemo(() => ({
    categories, reports, downtimes, maintenances, dashboardConfig,
    addCategory, updateCategory, deleteCategory,
    addVariable, updateVariable, deleteVariable,
    getAllVariables,
    addReport, updateReport, deleteReport,
    addDowntime, updateDowntime, deleteDowntime,
    addMaintenance, updateMaintenance, deleteMaintenance,
    updateDashboardConfig,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [categories, reports, downtimes, maintenances, dashboardConfig])

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#09090b', color: '#fff', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '16px' }}>Carregando dados...</h2>
        <p style={{ opacity: 0.7 }}>Aguarde um momento.</p>
      </div>
    )
  }

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  return useContext(AppDataContext)
}
