import React, { createContext, useContext, useState, useEffect } from 'react'

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

function load(key, fallback) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch { return fallback }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

/* ---- Default Dashboard Config ---- */
const DEFAULT_DASHBOARD_CONFIG = {
  // Referenciais das variáveis quantitativas (valor máximo esperado — base da barra de progresso)
  quantMaxes: {
    agua:            5000,
    vapor:           2000,
    energiaGerada:   50000,
    energiaConsumida:20000,
    combustivel:     3000,
  },
  // Metas dos KPIs de eficiência
  kpiMetas: {
    kwhGer:      null,  // kWh Gerado / t Vapor
    kwhCon:      null,  // kWh Consumido / t Vapor
    vaporCavaco: null,  // t Vapor / m³ Cavaco
  },
  // A-04: Metas das variáveis qualitativas (persistidas por varId)
  qualMetas: {},
}

export function AppDataProvider({ children }) {
  const [categories, setCategories]   = useState(() => load('thermiq_categories', DEFAULT_CATEGORIES))
  const [reports, setReports]         = useState(() => load('thermiq_reports', []))
  const [downtimes, setDowntimes]     = useState(() => load('thermiq_downtimes', []))
  const [maintenances, setMaintenances] = useState(() => load('thermiq_maintenances', []))
  const [dashboardConfig, setDashboardConfig] = useState(() => {
    const stored = load('thermiq_dashboard_config', DEFAULT_DASHBOARD_CONFIG)
    // Garante que chaves novas do default sejam mergeadas sem apagar configurações salvas
    return {
      quantMaxes: { ...DEFAULT_DASHBOARD_CONFIG.quantMaxes, ...stored?.quantMaxes },
      kpiMetas:   { ...DEFAULT_DASHBOARD_CONFIG.kpiMetas,   ...stored?.kpiMetas },
      qualMetas:  { ...DEFAULT_DASHBOARD_CONFIG.qualMetas,  ...stored?.qualMetas }, // A-04
    }
  })

  useEffect(() => { save('thermiq_categories',       categories)      }, [categories])
  useEffect(() => { save('thermiq_reports',          reports)         }, [reports])
  useEffect(() => { save('thermiq_downtimes',        downtimes)       }, [downtimes])
  useEffect(() => { save('thermiq_maintenances',     maintenances)    }, [maintenances])
  useEffect(() => { save('thermiq_dashboard_config', dashboardConfig) }, [dashboardConfig])

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
    setDashboardConfig(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }))
  }

  return (
    <AppDataContext.Provider value={{
      categories, reports, downtimes, maintenances, dashboardConfig,
      addCategory, updateCategory, deleteCategory,
      addVariable, updateVariable, deleteVariable,
      getAllVariables,
      addReport, updateReport, deleteReport,
      addDowntime, updateDowntime, deleteDowntime,
      addMaintenance, updateMaintenance, deleteMaintenance,
      updateDashboardConfig,
    }}>
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  return useContext(AppDataContext)
}
