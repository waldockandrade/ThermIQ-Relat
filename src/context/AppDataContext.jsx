import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react'
import supabase from '../lib/supabase'

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
      { id: 'v-12', name: 'pH da Água',               unit: 'pH',     categoryId: 'cat-5' },
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

/* ---- localStorage helpers (cache offline) ---- */
const LS_KEYS = {
  categories:      'thermiq_categories',
  reports:         'thermiq_reports',
  downtimes:       'thermiq_downtimes',
  maintenances:    'thermiq_maintenances',
  dashboardConfig: 'thermiq_dashboard_config',
}

function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* quota exceeded */ }
}

/* ---- Supabase helpers ---- */
async function sbFetch(table) {
  const { data, error } = await supabase.from(table).select('*')
  if (error) throw error
  return data
}

export function AppDataProvider({ children }) {
  const [categories,     setCategories]     = useState(DEFAULT_CATEGORIES)
  const [reports,        setReports]        = useState([])
  const [downtimes,      setDowntimes]      = useState([])
  const [maintenances,   setMaintenances]   = useState([])
  const [dashboardConfig, setDashboardConfig] = useState(DEFAULT_DASHBOARD_CONFIG)

  const [isLoaded,   setIsLoaded]   = useState(false)
  const [isSyncing,  setIsSyncing]  = useState(false)
  const [syncError,  setSyncError]  = useState(null)

  /* ── Carregamento inicial: Supabase → fallback localStorage ── */
  useEffect(() => {
    async function init() {
      try {
        setIsSyncing(true)

        // 1. Categorias
        const sbCats = await sbFetch('categories')
        if (sbCats.length > 0) {
          const mapped = sbCats.map(r => ({ id: r.id, name: r.name, variables: r.variables }))
          setCategories(mapped)
          lsSet(LS_KEYS.categories, mapped)
        } else {
          // Supabase vazio → seed com defaults e persiste
          const defaultCats = DEFAULT_CATEGORIES
          setCategories(defaultCats)
          for (const c of defaultCats) {
            await supabase.from('categories').upsert({ id: c.id, name: c.name, variables: c.variables })
          }
          lsSet(LS_KEYS.categories, defaultCats)
        }

        // 2. Relatórios
        const sbReports = await sbFetch('reports')
        const mappedReports = sbReports.map(r => ({
          id: r.id,
          turnoInfo: r.turno_info,
          operadores: r.operadores,
          combustiveis: r.combustiveis,
          diario: r.diario,
          selectedVarIds: r.selected_var_ids,
          lancamentos: r.lancamentos,
          timeSlots: r.time_slots,
          criadoPor: r.criado_por,
          status: r.status,
          savedAt: r.saved_at,
          createdAt: r.created_at,
        }))
        setReports(mappedReports)
        lsSet(LS_KEYS.reports, mappedReports)

        // 3. Paradas
        const sbDowntimes = await sbFetch('downtimes')
        const mappedDowntimes = sbDowntimes.map(r => ({
          id: r.id,
          data: r.data,
          turno: r.turno,
          inicio: r.inicio,
          fim: r.fim,
          tipo: r.tipo,
          descricao: r.descricao,
        }))
        setDowntimes(mappedDowntimes)
        lsSet(LS_KEYS.downtimes, mappedDowntimes)

        // 4. Manutenções
        const sbMaint = await sbFetch('maintenances')
        const mappedMaint = sbMaint.map(r => ({
          id: r.id,
          data: r.data,
          turno: r.turno,
          nome: r.nome,
          numNota: r.num_nota,
          descricao: r.descricao,
          centro: r.centro,
          prioridade: r.prioridade,
        }))
        setMaintenances(mappedMaint)
        lsSet(LS_KEYS.maintenances, mappedMaint)

        // 5. Dashboard Config (.maybeSingle evita 406 quando a linha não existe ainda)
        const { data: dbConf } = await supabase.from('dashboard_config').select('*').eq('id', 1).maybeSingle()
        if (dbConf && dbConf.config && Object.keys(dbConf.config).length > 0) {
          const merged = {
            ...DEFAULT_DASHBOARD_CONFIG,
            ...dbConf.config,
            qualMetas: { ...DEFAULT_DASHBOARD_CONFIG.qualMetas, ...(dbConf.config.qualMetas || {}) }
          }
          setDashboardConfig(merged)
          lsSet(LS_KEYS.dashboardConfig, merged)
        } else {
          // Sem config no Supabase → seed com defaults
          await supabase.from('dashboard_config').upsert({ id: 1, config: DEFAULT_DASHBOARD_CONFIG })
          lsSet(LS_KEYS.dashboardConfig, DEFAULT_DASHBOARD_CONFIG)
        }

        setSyncError(null)
      } catch (err) {
        console.warn('⚠️ Supabase indisponível, usando cache localStorage:', err.message)
        setSyncError(err.message)
        // Fallback: carrega do localStorage
        const rawCat = lsGet(LS_KEYS.categories, null)
        if (rawCat) setCategories(rawCat)

        const rawR = lsGet(LS_KEYS.reports, [])
        setReports(rawR)

        const rawD = lsGet(LS_KEYS.downtimes, [])
        setDowntimes(rawD)

        const rawM = lsGet(LS_KEYS.maintenances, [])
        setMaintenances(rawM)

        const rawDash = lsGet(LS_KEYS.dashboardConfig, null)
        if (rawDash) {
          setDashboardConfig(prev => ({
            ...prev,
            ...rawDash,
            qualMetas: { ...DEFAULT_DASHBOARD_CONFIG.qualMetas, ...(rawDash.qualMetas || {}) }
          }))
        }
      } finally {
        setIsSyncing(false)
        setIsLoaded(true)
      }
    }
    init()
  }, [])

  /* ── Cache localStorage sempre que o estado muda (após load) ── */
  const isInitialLoad = useRef(true)
  const syncTimerRef  = useRef(null)

  useEffect(() => {
    if (!isLoaded) return
    if (isInitialLoad.current) { isInitialLoad.current = false; return }

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => {
      lsSet(LS_KEYS.categories,      categories)
      lsSet(LS_KEYS.reports,         reports)
      lsSet(LS_KEYS.downtimes,       downtimes)
      lsSet(LS_KEYS.maintenances,    maintenances)
      lsSet(LS_KEYS.dashboardConfig, dashboardConfig)
    }, 500)

    return () => { if (syncTimerRef.current) clearTimeout(syncTimerRef.current) }
  }, [categories, reports, downtimes, maintenances, dashboardConfig, isLoaded])

  /* ══════════════════════════════════════════
     CATEGORIES / VARIABLES
  ══════════════════════════════════════════ */
  async function _upsertCategory(cat) {
    const { error } = await supabase.from('categories').upsert({
      id: cat.id, name: cat.name, variables: cat.variables
    })
    if (error) console.error('Supabase upsert category:', error.message)
  }

  function addCategory(name) {
    const c = { id: `cat-${crypto.randomUUID()}`, name, variables: [] }
    setCategories(prev => {
      const next = [...prev, c]
      _upsertCategory(c)
      return next
    })
    return c
  }

  function updateCategory(id, name) {
    setCategories(prev => {
      const next = prev.map(c => c.id === id ? { ...c, name } : c)
      const updated = next.find(c => c.id === id)
      if (updated) _upsertCategory(updated)
      return next
    })
  }

  function deleteCategory(id) {
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
    supabase.from('categories').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('Supabase delete category:', error.message) })
  }

  function addVariable(categoryId, { name, unit }) {
    const v = { id: `v-${crypto.randomUUID()}`, name, unit, categoryId }
    setCategories(prev => {
      const next = prev.map(c =>
        c.id === categoryId ? { ...c, variables: [...c.variables, v] } : c
      )
      const updated = next.find(c => c.id === categoryId)
      if (updated) _upsertCategory(updated)
      return next
    })
    return v
  }

  function updateVariable(categoryId, varId, { name, unit }) {
    setCategories(prev => {
      const next = prev.map(c =>
        c.id === categoryId
          ? { ...c, variables: c.variables.map(v => v.id === varId ? { ...v, name, unit } : v) }
          : c
      )
      const updated = next.find(c => c.id === categoryId)
      if (updated) _upsertCategory(updated)
      return next
    })
  }

  function deleteVariable(categoryId, varId) {
    setCategories(prev => {
      const next = prev.map(c =>
        c.id === categoryId
          ? { ...c, variables: c.variables.filter(v => v.id !== varId) }
          : c
      )
      const updated = next.find(c => c.id === categoryId)
      if (updated) _upsertCategory(updated)
      return next
    })
  }

  function getAllVariables() {
    return categories.flatMap(c => c.variables)
  }

  /* ══════════════════════════════════════════
     REPORTS
  ══════════════════════════════════════════ */
  function addReport(report) {
    const r = {
      ...report,
      id: `rep-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      status: 'salvo',
    }
    setReports(prev => [r, ...prev])

    // Persiste no Supabase
    supabase.from('reports').insert({
      id: r.id,
      turno_info:      r.turnoInfo,
      operadores:      r.operadores,
      combustiveis:    r.combustiveis,
      diario:          r.diario,
      selected_var_ids: r.selectedVarIds,
      lancamentos:     r.lancamentos,
      time_slots:      r.timeSlots,
      criado_por:      r.criadoPor,
      status:          r.status,
      saved_at:        r.savedAt,
    }).then(({ error }) => {
      if (error) console.error('Supabase insert report:', error.message)
    })

    return r
  }

  function updateReport(id, data) {
    setReports(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))

    // Monta payload snake_case apenas com campos presentes em data
    const payload = {}
    if (data.turnoInfo)      payload.turno_info      = data.turnoInfo
    if (data.operadores)     payload.operadores      = data.operadores
    if (data.combustiveis)   payload.combustiveis    = data.combustiveis
    if (data.diario !== undefined) payload.diario    = data.diario
    if (data.selectedVarIds) payload.selected_var_ids = data.selectedVarIds
    if (data.lancamentos)    payload.lancamentos     = data.lancamentos
    if (data.timeSlots)      payload.time_slots      = data.timeSlots
    if (data.criadoPor)      payload.criado_por      = data.criadoPor
    if (data.status)         payload.status          = data.status

    if (Object.keys(payload).length > 0) {
      supabase.from('reports').update(payload).eq('id', id)
        .then(({ error }) => { if (error) console.error('Supabase update report:', error.message) })
    }
  }

  function deleteReport(id) {
    setReports(prev => prev.filter(r => r.id !== id))
    supabase.from('reports').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('Supabase delete report:', error.message) })
  }

  /* ══════════════════════════════════════════
     DOWNTIMES
  ══════════════════════════════════════════ */
  function addDowntime(dt) {
    const d = { ...dt, id: `dt-${crypto.randomUUID()}` }
    setDowntimes(prev => [d, ...prev])

    supabase.from('downtimes').insert({
      id:        d.id,
      data:      d.data,
      turno:     d.turno,
      inicio:    d.inicio,
      fim:       d.fim || null,
      tipo:      d.tipo,
      descricao: d.descricao || '',
    }).then(({ error }) => {
      if (error) console.error('Supabase insert downtime:', error.message)
    })

    return d
  }

  function updateDowntime(id, data) {
    setDowntimes(prev => prev.map(d => d.id === id ? { ...d, ...data } : d))

    const payload = {}
    if (data.data)      payload.data      = data.data
    if (data.turno)     payload.turno     = data.turno
    if (data.inicio)    payload.inicio    = data.inicio
    if (data.fim !== undefined) payload.fim = data.fim || null
    if (data.tipo)      payload.tipo      = data.tipo
    if (data.descricao !== undefined) payload.descricao = data.descricao

    if (Object.keys(payload).length > 0) {
      supabase.from('downtimes').update(payload).eq('id', id)
        .then(({ error }) => { if (error) console.error('Supabase update downtime:', error.message) })
    }
  }

  function deleteDowntime(id) {
    setDowntimes(prev => prev.filter(d => d.id !== id))
    supabase.from('downtimes').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('Supabase delete downtime:', error.message) })
  }

  /* ══════════════════════════════════════════
     MAINTENANCES
  ══════════════════════════════════════════ */
  function addMaintenance(m) {
    const entry = { ...m, id: `mnt-${crypto.randomUUID()}` }
    setMaintenances(prev => [entry, ...prev])

    supabase.from('maintenances').insert({
      id:         entry.id,
      data:       entry.data,
      turno:      entry.turno,
      nome:       entry.nome || '',
      num_nota:   entry.numNota || '',
      descricao:  entry.descricao || '',
      centro:     entry.centro,
      prioridade: entry.prioridade,
    }).then(({ error }) => {
      if (error) console.error('Supabase insert maintenance:', error.message)
    })

    return entry
  }

  function updateMaintenance(id, data) {
    setMaintenances(prev => prev.map(m => m.id === id ? { ...m, ...data } : m))

    const payload = {}
    if (data.data)       payload.data       = data.data
    if (data.turno)      payload.turno      = data.turno
    if (data.nome !== undefined)      payload.nome      = data.nome
    if (data.numNota !== undefined)   payload.num_nota  = data.numNota
    if (data.descricao !== undefined) payload.descricao = data.descricao
    if (data.centro)     payload.centro     = data.centro
    if (data.prioridade) payload.prioridade = data.prioridade

    if (Object.keys(payload).length > 0) {
      supabase.from('maintenances').update(payload).eq('id', id)
        .then(({ error }) => { if (error) console.error('Supabase update maintenance:', error.message) })
    }
  }

  function deleteMaintenance(id) {
    setMaintenances(prev => prev.filter(m => m.id !== id))
    supabase.from('maintenances').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('Supabase delete maintenance:', error.message) })
  }

  /* ══════════════════════════════════════════
     DASHBOARD CONFIG
  ══════════════════════════════════════════ */
  function updateDashboardConfig(section, key, value) {
    setDashboardConfig(prev => {
      let next
      if (key === null || key === undefined) {
        next = { ...prev, [section]: value }
      } else {
        next = { ...prev, [section]: { ...prev[section], [key]: value } }
      }

      // Persiste no Supabase (debounce implícito pelo React batching)
      supabase.from('dashboard_config').upsert({ id: 1, config: next })
        .then(({ error }) => { if (error) console.error('Supabase upsert dashboardConfig:', error.message) })

      return next
    })
  }

  /* ══════════════════════════════════════════
     CONTEXT VALUE
  ══════════════════════════════════════════ */
  const contextValue = useMemo(() => ({
    categories, reports, downtimes, maintenances, dashboardConfig,
    isSyncing, syncError,
    addCategory, updateCategory, deleteCategory,
    addVariable, updateVariable, deleteVariable,
    getAllVariables,
    addReport, updateReport, deleteReport,
    addDowntime, updateDowntime, deleteDowntime,
    addMaintenance, updateMaintenance, deleteMaintenance,
    updateDashboardConfig,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [categories, reports, downtimes, maintenances, dashboardConfig, isSyncing, syncError])

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#09090b', color: '#fff', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3px solid #22c55e', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <h2 style={{ margin: 0 }}>Conectando ao banco de dados...</h2>
        <p style={{ opacity: 0.5, margin: 0 }}>Aguarde um momento.</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
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
