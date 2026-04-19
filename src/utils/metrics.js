/**
 * Utilitários de Cálculo e Classificação de Variáveis
 * Centraliza a inteligência de negócios para evitar divergências entre telas.
 */

export function classifyVar(v) {
  if (!v || !v.name) return false
  const nm = v.name.toLowerCase()
  const QUANTITATIVE_TERMS = [
    'vazão', 'producao', 'produção', 'consumo', 'energia', 
    'cavaco', 'biomassa', 'vapor', 'água', 'agua', 'alimentação', 'alimentacao'
  ]
  return QUANTITATIVE_TERMS.some(t => nm.includes(t))
}

const UNITS_MASS = ['ton', 't', 't/h', 'ton/h', 'kg', 'kg/h']
const UNITS_ENERGY = ['mw', 'kwh', 'kw', 'mwh']
const UNITS_VOL = ['m³', 'm³/h', 'm3', 'm3/h']

export function getConversion(from, to) {
  if (!from || !to) return 1
  const f = from.trim().toLowerCase()
  const t = to.trim().toLowerCase()
  if (f === t) return 1

  // Energia
  if (UNITS_ENERGY.includes(f) && UNITS_ENERGY.includes(t)) {
    if ((f === 'mw' || f === 'mwh') && (t === 'kw' || t === 'kwh')) return 1000
    if ((f === 'kw' || f === 'kwh') && (t === 'mw' || t === 'mwh')) return 0.001
  }

  // Massa / Volume (Métrica básica)
  if (UNITS_MASS.includes(f) && UNITS_MASS.includes(t)) {
    if (f.startsWith('t') && t.startsWith('k')) return 1000
    if (f.startsWith('k') && t.startsWith('t')) return 0.001
  }

  return 1
}

/**
 * Calcula todos os valores (Deltas e Médias) de um relatório
 */
export function processReportData(report, allVars, customKPIs = []) {
  if (!report || !report.lancamentos) return { vals: {}, info: report.turnoInfo || {} }

  const vals = {}

  // 1. Variáveis Base
  allVars.forEach(v => {
    const entries = report.lancamentos[v.id]
    if (!entries) return

    if (classifyVar(v)) {
      const delta = parseFloat(entries.tot_final || 0) - parseFloat(entries.tot_inicial || 0)
      vals[v.id] = isFinite(delta) ? delta : null
    } else {
      const slots = Object.values(entries.slots || {}).map(parseFloat).filter(isFinite)
      vals[v.id] = slots.length > 0 ? slots.reduce((a, b) => a + b, 0) / slots.length : null
    }
  })

  // 2. KPIs Customizados
  customKPIs.forEach(k => {
    const vNum = allVars.find(v => v.id === k.numVarId)
    const vDen = allVars.find(v => v.id === k.denVarId)
    if (!vNum || !vDen) return

    let valNum = vals[vNum.id] || 0
    let valDen = vals[vDen.id] || 0

    valNum *= (k.numFactor || 1)
    valDen *= (k.denFactor || 1)

    vals[k.id] = (valDen > 0) ? (valNum / valDen) : null
  })

  return { 
    id: report.id,
    info: report.turnoInfo || {},
    criadoPor: report.criadoPor,
    vals 
  }
}

/**
 * Agrega dados de múltiplos relatórios (Soma ou Média)
 */
export function aggregateReports(reports, allVars, targetUnit, ...terms) {
  const allowed = allowedGroup(targetUnit)
  let acc = 0
  
  reports.forEach(rep => {
    allVars.forEach(v => {
      if (!matchVar(v.name, ...terms)) return
      if (allowed && !allowed.includes((v.unit || '').trim().toLowerCase())) return
      
      const entries = rep.lancamentos?.[v.id]
      if (!entries) return
      
      const delta = parseFloat(entries.tot_final || 0) - parseFloat(entries.tot_inicial || 0)
      if (isFinite(delta)) {
        acc += delta * getConversion(v.unit, targetUnit)
      }
    })
  })
  return acc
}

export function matchVar(name, ...terms) {
  const n = (name || '').toLowerCase()
  return terms.some(t => n.includes(t.toLowerCase()))
}

export function allowedGroup(targetUnit) {
  const t = (targetUnit || '').trim().toLowerCase()
  if (UNITS_MASS.includes(t))   return UNITS_MASS
  if (ENERGY_UNITS.includes(t)) return UNITS_ENERGY
  if (UNITS_VOL.includes(t))    return UNITS_VOL
  return null
}

export function fmt(val, dec = 2) {
  if (val === null || val === undefined || !isFinite(val)) return '—'
  return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

export function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' })
}
