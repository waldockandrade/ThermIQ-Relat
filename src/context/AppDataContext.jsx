import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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
  const [fatalError, setFatalError] = useState(false)

  // Initialization: Fetch from Supabase
  useEffect(() => {
    async function loadData() {
      if (!supabase) {
        setFatalError(true)
        return
      }
      try {
        const { data, error } = await supabase.from('app_data').select('*')
        if (error) {
          console.error("Erro ao buscar dados do Supabase:", error.message)
          setIsLoaded(true)
          return
        }

        const dict = {}
        if (data) {
          data.forEach(row => { dict[row.id] = row.data })
        }

        if (dict['thermiq_categories']) setCategories(dict['thermiq_categories'])
        if (dict['thermiq_reports']) setReports(dict['thermiq_reports'])
        if (dict['thermiq_downtimes']) setDowntimes(dict['thermiq_downtimes'])
        if (dict['thermiq_maintenances']) setMaintenances(dict['thermiq_maintenances'])

        let storedDash = dict['thermiq_dashboard_config']
        
        if (storedDash) {
          if (!storedDash.customQuantitatives) {
             storedDash.customQuantitatives = [
               { id: 'q-1', varId: 'v-7', label: 'Água de Alimentação', max: storedDash.quantMaxes?.agua || 5000, color: '#3b82f6', iconName: 'Droplets', factor: 1, unitOverride: 'ton' },
               { id: 'q-2', varId: 'v-6', label: 'Vapor Gerado', max: storedDash.quantMaxes?.vapor || 2000, color: '#22c55e', iconName: 'Wind', factor: 1, unitOverride: 'ton' },
               { id: 'q-3', varId: 'v-9', label: 'Energia Gerada', max: storedDash.quantMaxes?.energiaGerada || 50000, color: '#f97316', iconName: 'Zap', factor: 1000, unitOverride: 'kW' },
               { id: 'q-4', varId: 'v-10', label: 'Energia Consumida', max: storedDash.quantMaxes?.energiaConsumida || 20000, color: '#a855f7', iconName: 'Activity', factor: 1, unitOverride: 'kWh' },
               { id: 'q-5', varId: 'v-8', label: 'Combustível (Cavaco)', max: storedDash.quantMaxes?.combustivel || 3000, color: '#eab308', iconName: 'Flame', factor: 1, unitOverride: 'm³' }
             ]
          }
          if (!storedDash.customKPIs) {
             storedDash.customKPIs = [
               { id: 'k-1', label: 'kW Gerado / ton Vapor', numVarId: 'v-9', numFactor: 1000, denVarId: 'v-6', denFactor: 1, unit: 'kW/ton', meta: storedDash.kpiMetas?.kwhGer || null, inverse: false, color: '#f97316' },
               { id: 'k-2', label: 'kWh Consumido / ton Vapor', numVarId: 'v-10', numFactor: 1, denVarId: 'v-6', denFactor: 1, unit: 'kWh/ton', meta: storedDash.kpiMetas?.kwhCon || null, inverse: true, color: '#a855f7' },
               { id: 'k-3', label: 'kg Vapor / m³ Cavaco', numVarId: 'v-6', numFactor: 1000, denVarId: 'v-8', denFactor: 1, unit: 'kg/m³', meta: storedDash.kpiMetas?.vaporCavaco || null, inverse: false, color: '#22c55e' }
             ]
          }
          setDashboardConfig({
            ...storedDash,
            customQuantitatives: storedDash.customQuantitatives,
            customKPIs:          storedDash.customKPIs,
            qualMetas:           { ...DEFAULT_DASHBOARD_CONFIG.qualMetas, ...storedDash.qualMetas }
          })
        }
      } catch (e) {
        console.error("Critical error connecting to Supabase:", e)
      } finally {
        setIsLoaded(true)
      }
    }
    loadData()
  }, [])

  // Auto-save mechanisms with Supabase (run on state change)
  useEffect(() => { 
    if (isLoaded && supabase) supabase.from('app_data').upsert({ id: 'thermiq_categories', data: categories }).then()
  }, [categories, isLoaded])

  useEffect(() => { 
    if (isLoaded && supabase) supabase.from('app_data').upsert({ id: 'thermiq_reports', data: reports }).then()
  }, [reports, isLoaded])

  useEffect(() => { 
    if (isLoaded && supabase) supabase.from('app_data').upsert({ id: 'thermiq_downtimes', data: downtimes }).then()
  }, [downtimes, isLoaded])

  useEffect(() => { 
    if (isLoaded && supabase) supabase.from('app_data').upsert({ id: 'thermiq_maintenances', data: maintenances }).then()
  }, [maintenances, isLoaded])

  useEffect(() => { 
    if (isLoaded && supabase) supabase.from('app_data').upsert({ id: 'thermiq_dashboard_config', data: dashboardConfig }).then()
  }, [dashboardConfig, isLoaded])

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
      {fatalError ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#09090b', color: '#fff', flexDirection: 'column', padding: '20px' }}>
           <h2 style={{ marginBottom: '16px', color: '#ef4444'}}>Erro de Conexão Crítico!</h2>
           <p style={{ opacity: 0.9, maxWidth: '500px', textAlign: 'center', lineHeight: '1.5' }}>
             O aplicativo não detectou as chaves de acesso ao banco de dados Supabase.<br/><br/>
             Se você está executando na Vercel, certifique-se de preencher as variáveis <br/><br/><b style={{color: '#3b82f6'}}>VITE_SUPABASE_URL</b><br/> e <br/><b style={{color: '#3b82f6'}}>VITE_SUPABASE_ANON_KEY</b><br/><br/> lá no menu "Settings -> Environment Variables" da Vercel e depois não se esqueça de clicar em "Redeploy".
           </p>
        </div>
      ) : !isLoaded ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#09090b', color: '#fff', flexDirection: 'column' }}>
           <h2 style={{ marginBottom: '16px'}}>Conectando ao banco de dados...</h2>
           <p style={{ opacity: 0.7 }}>Aguarde enquanto sincronizamos as informações.</p>
        </div>
      ) : children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  return useContext(AppDataContext)
}
