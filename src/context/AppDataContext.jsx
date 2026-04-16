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
  const [categories, setCategories]   = useState(() => load('thermiq_categories', DEFAULT_CATEGORIES))
  const [reports, setReports]         = useState(() => load('thermiq_reports', []))
  const [downtimes, setDowntimes]     = useState(() => load('thermiq_downtimes', []))
  const [maintenances, setMaintenances] = useState(() => load('thermiq_maintenances', []))
  const [dashboardConfig, setDashboardConfig] = useState(() => {
    const stored = load('thermiq_dashboard_config', null)
    
    // Migração de estado dos Dashboards antigos baseados em dict "quantMaxes" e "kpiMetas"
    if (stored && !stored.customQuantitatives) {
       stored.customQuantitatives = [
         { id: 'q-1', varId: 'v-7', label: 'Água de Alimentação', max: stored.quantMaxes?.agua || 5000, color: '#3b82f6', iconName: 'Droplets', factor: 1, unitOverride: 'ton' },
         { id: 'q-2', varId: 'v-6', label: 'Vapor Gerado', max: stored.quantMaxes?.vapor || 2000, color: '#22c55e', iconName: 'Wind', factor: 1, unitOverride: 'ton' },
         { id: 'q-3', varId: 'v-9', label: 'Energia Gerada', max: stored.quantMaxes?.energiaGerada || 50000, color: '#f97316', iconName: 'Zap', factor: 1000, unitOverride: 'kW' },
         { id: 'q-4', varId: 'v-10', label: 'Energia Consumida', max: stored.quantMaxes?.energiaConsumida || 20000, color: '#a855f7', iconName: 'Activity', factor: 1, unitOverride: 'kWh' },
         { id: 'q-5', varId: 'v-8', label: 'Combustível (Cavaco)', max: stored.quantMaxes?.combustivel || 3000, color: '#eab308', iconName: 'Flame', factor: 1, unitOverride: 'm³' }
       ]
    }
    if (stored && !stored.customKPIs) {
       stored.customKPIs = [
         { id: 'k-1', label: 'kW Gerado / ton Vapor', numVarId: 'v-9', numFactor: 1000, denVarId: 'v-6', denFactor: 1, unit: 'kW/ton', meta: stored.kpiMetas?.kwhGer || null, inverse: false, color: '#f97316' },
         { id: 'k-2', label: 'kWh Consumido / ton Vapor', numVarId: 'v-10', numFactor: 1, denVarId: 'v-6', denFactor: 1, unit: 'kWh/ton', meta: stored.kpiMetas?.kwhCon || null, inverse: true, color: '#a855f7' },
         { id: 'k-3', label: 'kg Vapor / m³ Cavaco', numVarId: 'v-6', numFactor: 1000, denVarId: 'v-8', denFactor: 1, unit: 'kg/m³', meta: stored.kpiMetas?.vaporCavaco || null, inverse: false, color: '#22c55e' }
       ]
    }

    return {
      customQuantitatives: stored?.customQuantitatives || DEFAULT_DASHBOARD_CONFIG.customQuantitatives,
      customKPIs:          stored?.customKPIs || DEFAULT_DASHBOARD_CONFIG.customKPIs,
      qualMetas:           { ...DEFAULT_DASHBOARD_CONFIG.qualMetas, ...stored?.qualMetas }
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
    if (key === null || key === undefined) {
      setDashboardConfig(prev => ({ ...prev, [section]: value }))
    } else {
      setDashboardConfig(prev => ({
        ...prev,
        [section]: { ...prev[section], [key]: value },
      }))
    }
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
