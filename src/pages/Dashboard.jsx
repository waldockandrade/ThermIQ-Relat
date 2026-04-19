import React, { useMemo, useState, useRef, useEffect } from 'react'
import { useAppData } from '../context/AppDataContext'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'
import {
  Droplets, Wind, Zap, Flame, Activity, TrendingUp,
  ChevronDown, Check, FileText, X, Calendar, Target, Edit3,
  Box, Battery, Cpu, Filter, Sun, Thermometer, Info
} from 'lucide-react'

const ICONS = {
  Droplets, Wind, Zap, Flame, Activity, TrendingUp, Box, Battery, Cpu, Filter, Sun, Thermometer, Target, Info
}
import { 
  fmt, 
  fmtDate, 
  classifyVar, 
  getConversion as convFactor, 
  aggregateReports as deltaConvert,
  matchVar
} from '../utils/metrics'

import './Dashboard.css'

/* ─── Helpers ────────────────────────────────────── */
function round(n, dec = 2) {
  return isFinite(n) && n !== null ? Number(n.toFixed(dec)) : null
}

function classifyVars(allVars) {
  const qualitative = allVars.filter(v => !classifyVar(v))
  const quantitative = allVars.filter(v => classifyVar(v))
  if (qualitative.length === 0) return { qualitative: allVars, quantitative: [] }
  return { qualitative, quantitative }
}

/* ─── Multi-select de Relatórios ─────────────────── */
function ReportSelector({ reports, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onDown(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function toggleAll() {
    if (selected.size === reports.length) onChange(new Set())
    else onChange(new Set(reports.map(r => r.id)))
  }
  function toggleOne(id) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    onChange(next)
  }

  const label = selected.size === 0
    ? 'Nenhum relatório selecionado'
    : selected.size === reports.length
    ? `Todos os relatórios (${reports.length})`
    : `${selected.size} relatório${selected.size > 1 ? 's' : ''} selecionado${selected.size > 1 ? 's' : ''}`

  return (
    <div ref={ref} style={{ position:'relative', minWidth:320 }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        gap:8, width:'100%', padding:'8px 14px',
        background:'var(--bg-card)', border:'1px solid var(--border)',
        borderRadius:'var(--radius-md)', cursor:'pointer',
        fontFamily:'Inter, sans-serif', fontSize:'var(--text-sm)',
        color: selected.size === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
        boxShadow:'var(--shadow-sm)',
        borderColor: open ? 'var(--accent)' : 'var(--border)',
        transition:'border-color 0.15s',
      }}>
        <span style={{ display:'flex', alignItems:'center', gap:8 }}>
          <FileText size={14} style={{ color:'var(--accent)', flexShrink:0 }} />
          {label}
        </span>
        <ChevronDown size={14} style={{ color:'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 6px)', left:0, right:0,
          background:'var(--bg-card)', border:'1px solid var(--border)',
          borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-lg)',
          zIndex:200, maxHeight:360, overflowY:'auto', animation:'fadeIn 0.15s ease',
        }}>
          <div onClick={toggleAll} style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)',
            fontSize:'var(--text-sm)', fontWeight:600,
            color: selected.size === reports.length ? 'var(--accent-dark)' : 'var(--text-secondary)',
            background: selected.size === reports.length ? 'var(--accent-soft)' : 'transparent',
          }}>
            <span>Selecionar todos ({reports.length})</span>
            {selected.size === reports.length && <Check size={14} style={{ color:'var(--accent)' }} />}
          </div>
          {reports.length === 0 && (
            <div style={{ padding:'20px 14px', textAlign:'center', fontSize:'var(--text-sm)', color:'var(--text-muted)' }}>
              Nenhum relatório cadastrado.
            </div>
          )}
          {reports.map(rep => {
            const isSel = selected.has(rep.id)
            return (
              <div key={rep.id} onClick={() => toggleOne(rep.id)} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'10px 14px', cursor:'pointer',
                fontSize:'var(--text-sm)',
                background: isSel ? 'var(--accent-soft)' : 'transparent',
                borderBottom:'1px solid var(--border-subtle)',
                transition:'background 0.1s',
              }}>
                <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                  <span style={{ fontWeight: isSel ? 600 : 400, color: isSel ? 'var(--accent-dark)' : 'var(--text-primary)' }}>
                    {rep.turnoInfo?.setor || 'Sem setor'} — {rep.turnoInfo?.turno || ''}
                  </span>
                  <span style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', display:'flex', gap:6, alignItems:'center' }}>
                    <Calendar size={11}/>
                    {fmtDate(rep.turnoInfo?.data)} · {rep.criadoPor || 'Não informado'}
                  </span>
                </div>
                {isSel && <Check size={14} style={{ color:'var(--accent)', flexShrink:0 }} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
/* ─── TargetCard — Card horizontal de meta ───────── */
function TargetCard({ label, value, unit, meta, color, icon: Icon, inverse }) {
  const safeVal = (typeof value === 'number' && isFinite(value)) ? value : 0
  const hasMeta = typeof meta === 'number' && isFinite(meta)
  
  let statusColor = color 
  let statusText = ''
  
  if (hasMeta) {
    if (inverse) {
      statusColor = safeVal <= meta ? 'var(--leaf)' : 'var(--danger)'
      statusText = safeVal <= meta ? 'Eficiente' : 'Alerta'
    } else {
      statusColor = safeVal >= meta ? 'var(--leaf)' : 'var(--warning)'
      statusText = safeVal >= meta ? 'Meta Ok' : 'Abaixo'
    }
  }

  const maxVal = hasMeta ? Math.max(meta * 1.3, safeVal * 1.1) : (safeVal > 0 ? safeVal * 1.2 : 100)
  const valPct = Math.min((safeVal / maxVal) * 100, 100)
  const metaPct = hasMeta ? Math.min((meta / maxVal) * 100, 100) : 0

  return (
    <div className="stat-card industrial bento-kpi">
      <div className="card-header" style={{ border: 'none', padding: 0, marginBottom: 12 }}>
        <div style={{ 
          width: 34, height: 34, borderRadius: 4, 
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <Icon size={16} style={{ color: statusColor }} />
        </div>
        {hasMeta && (
          <div className="badge" style={{ background: `${statusColor}08`, color: statusColor, borderColor: `${statusColor}22` }}>
            {statusText}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="stat-label">{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
          <span className="stat-value-mono" style={{ fontSize: 28, fontWeight: 800 }}>
            {safeVal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{unit}</span>
        </div>
      </div>

      {hasMeta && (
        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
            <span style={{ color: 'var(--text-muted)' }}>Alvo: <span style={{ color: 'var(--text-secondary)' }}>{meta.toLocaleString('pt-BR')}</span></span>
            <span style={{ color: statusColor, fontWeight: 700 }}>{Math.round((safeVal / meta) * 100)}%</span>
          </div>
          <div style={{ position: 'relative', height: 4, background: 'var(--bg-surface)', borderRadius: 2, overflow: 'hidden' }}>
             <div style={{
                position: 'absolute', top: 0, bottom: 0, left: 0, width: `${valPct}%`,
                background: statusColor,
                borderRadius: 2, transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
             }} />
          </div>
        </div>
      )}
    </div>
  )
}


/* ─── AccumCard — Card de variável quantitativa acumulada ── */
function AccumCard({ label, value, unit, max, color, icon: Icon, reportCount }) {
  const pct = Math.min(Math.max((value || 0) / max, 0), 1)

  return (
    <div className="stat-card industrial bento-accum">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 4,
          background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--border)'
        }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="stat-label">{label}</span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="stat-value-mono" style={{ fontSize: 28, fontWeight: 800 }}>
          {typeof value === 'number' ? value.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '0'}
          <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 8, fontWeight: 600 }}>{unit}</span>
        </div>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <div style={{ height: 4, background: 'var(--bg-surface)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{
            height: '100%', width: `${pct * 100}%`,
            background: color, 
            borderRadius: 2, transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
          <span>{Math.round(pct * 100)}% do operacional</span>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Max: {max.toLocaleString('pt-BR')}</span>
        </div>
      </div>
    </div>
  )
}


/* ─── KPI Card ───────────────────────────────────── */
function KPICard({ label, numerador, denominador, result, unit, numLabel, denLabel }) {
  return (
    <div className="stat-card" style={{ padding:'var(--space-lg)' }}>
      <div className="stat-label" style={{ marginBottom:8 }}>{label}</div>

      {/* Fórmula visual */}
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12, flexWrap:'wrap' }}>
        <div style={{
          background:'var(--accent-soft)', border:'1px solid rgba(249,115,22,0.2)',
          borderRadius:'var(--radius-sm)', padding:'4px 10px',
          fontSize:'var(--text-xs)', color:'var(--accent-dark)', fontWeight:600, textAlign:'center'
        }}>
          <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:1 }}>{numLabel}</div>
          {fmt(numerador, 1)}
        </div>
        <span style={{ color:'var(--text-muted)', fontWeight:700, fontSize:16 }}>÷</span>
        <div style={{
          background:'var(--leaf-soft)', border:'1px solid rgba(34,197,94,0.2)',
          borderRadius:'var(--radius-sm)', padding:'4px 10px',
          fontSize:'var(--text-xs)', color:'var(--leaf-dark)', fontWeight:600, textAlign:'center'
        }}>
          <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:1 }}>{denLabel}</div>
          {fmt(denominador, 1)}
        </div>
        <span style={{ color:'var(--text-muted)', fontWeight:700 }}>=</span>
        <div style={{ fontSize:'var(--text-xl)', fontWeight:800, color:'var(--text-primary)' }}>
          {result !== null ? fmt(result, 3) : '—'}
        </div>
      </div>
    </div>
  )
}

/* ─── Tooltip customizado ────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'10px 14px', fontSize:'var(--text-xs)', boxShadow:'var(--shadow-md)' }}>
      <p style={{ color:'var(--text-muted)', marginBottom:6, fontWeight:600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color:p.color, fontWeight:600, marginBottom:2 }}>
          {p.name}: <span style={{ fontWeight:800 }}>{typeof p.value === 'number' ? p.value.toLocaleString('pt-BR', { maximumFractionDigits:3 }) : p.value}</span>
        </p>
      ))}
    </div>
  )
}

/* ─── Gráfico individual de KPI ─────────────────── */
function KPIChart({ title, unit, color, data, metaVal, onMetaChange, emptyMsg, className }) {
  const hasData   = data.some(d => d.real !== null && d.real !== undefined)
  const vals      = data.filter(d => d.real !== null).map(d => d.real)
  const mean      = vals.length ? round(vals.reduce((a,b)=>a+b,0)/vals.length, 3) : null
  
  return (
    <div className={`card industrial ${className}`}>
      <div className="card-header" style={{ border: 'none', marginBottom: 20, padding: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="card-title">
            <TrendingUp size={14} style={{ color }} /> {title}
          </span>
          {mean !== null && (
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }} className="stat-value-mono">
              {mean.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>{unit} (Média)</span>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-surface)', padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border)' }}>
          <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)' }}>META</label>
          <input
            type="number" step="any"
            className="cell-input"
            value={metaVal ?? ''}
            onChange={e => onMetaChange(e.target.value === '' ? null : parseFloat(e.target.value))}
            style={{ width: 60, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 700, padding: 0, textAlign: 'right' }}
          />
        </div>
      </div>

      {!hasData ? (
        <div className="empty-state" style={{ height: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <TrendingUp size={32} style={{ marginBottom: 12, opacity: 0.2 }} />
          <p style={{ maxWidth: 300, margin: '0 auto' }}>{emptyMsg}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => v.toLocaleString('pt-BR')}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
            {metaVal !== null && (
              <ReferenceLine y={metaVal} stroke="var(--accent)" strokeDasharray="5 5" opacity={0.5} />
            )}
            <Line
              type="monotone" dataKey="real" name="Valor Real"
              stroke={color} strokeWidth={3}
              dot={{ fill: color, r: 4, strokeWidth: 2, stroke: 'var(--bg-card)' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}


/* ══════════════════════════════════════════════════ */
export default function Dashboard() {
  const { reports, getAllVariables, dashboardConfig, updateDashboardConfig } = useAppData()
  const allVars = getAllVariables()
  const { qualitative } = useMemo(() => classifyVars(allVars), [allVars])

  /* ── Seleção de relatórios ── */
  const [selectedIds, setSelectedIds] = useState(() => new Set(reports.map(r => r.id)))
  useEffect(() => { setSelectedIds(new Set(reports.map(r => r.id))) }, [reports.length])

  /* ── Variável qualitativa selecionada no gráfico ── */
  const [chartVarId, setChartVarId]   = useState(qualitative[0]?.id || '')
  const chartVar = qualitative.find(v => v.id === chartVarId)
  // A-04: metas das variáveis qualitativas persistidas no contexto
  const metas    = dashboardConfig?.qualMetas || {}
  function setMetaForVar(varId, val) {
    updateDashboardConfig('qualMetas', varId, val === '' ? null : parseFloat(val) || null)
  }
  const metaVal  = metas[chartVarId] ?? null

  /* ── Relatórios ativos ── */
  const activeReports = useMemo(
    () => reports.filter(r => selectedIds.has(r.id)),
    [reports, selectedIds]
  )

  /* ── 1. Indicadores Quantitativos Dinâmicos ── */
  const quantitativesData = useMemo(() => {
    return (dashboardConfig.customQuantitatives || []).map(q => {
      let total = 0
      activeReports.forEach(rep => {
        const e = rep.lancamentos?.[q.varId]
        if (e) {
          const val = parseFloat(e.tot_final || 0) - parseFloat(e.tot_inicial || 0)
          if (isFinite(val)) total += val
        }
      })
      const vObj = allVars.find(v => v.id === q.varId)
      return { ...q, total, finalUnit: vObj?.unit || '' }
    })
  }, [activeReports, dashboardConfig.customQuantitatives, allVars])

  /* ── 2. Série temporal e média dos KPIs Dinâmicos ── */
  const customKPIData = useMemo(() => {
    const customKPIs = dashboardConfig.customKPIs || []
    const results = []

    customKPIs.forEach(k => {
      function getSlotAvg(varId, factor) {
        if (!varId) return {}
        const byTime = {}
        activeReports.forEach(rep => {
          const slots = rep.lancamentos?.[varId]?.slots
          if (!slots) return
          Object.entries(slots).forEach(([time, val]) => {
            const num = parseFloat(val)
            if (isFinite(num)) {
              if (!byTime[time]) byTime[time] = { sum: 0, count: 0 }
              byTime[time].sum += num * factor
              byTime[time].count++
            }
          })
        })
        const avgByTime = {}
        for (const t in byTime) {
          avgByTime[t] = byTime[t].sum / byTime[t].count
        }
        return avgByTime
      }

      const numMap = getSlotAvg(k.numVarId, k.numFactor || 1)
      const denMap = getSlotAvg(k.denVarId, k.denFactor || 1)

      const allTimes = new Set([...Object.keys(numMap), ...Object.keys(denMap)])
      const times = Array.from(allTimes).sort()

      const series = []
      let totalKPI = 0
      let validPoints = 0
      
      times.forEach(t => {
        const n = numMap[t]
        const d = denMap[t]
        if (n !== undefined && d !== undefined && d > 0) {
          const ratio = n / d
          series.push({ label: t, real: round(ratio, 3) })
          totalKPI += ratio
          validPoints++
        }
      })

      const averageValue = validPoints > 0 ? totalKPI / validPoints : null
      results.push({ ...k, series, averageValue })
    })

    return results
  }, [activeReports, dashboardConfig.customKPIs])

  function updateKPIMeta(id, metaVal) {
    const arr = [...(dashboardConfig.customKPIs || [])]
    const idx = arr.findIndex(k => k.id === id)
    if (idx !== -1) {
      arr[idx] = { ...arr[idx], meta: metaVal }
      updateDashboardConfig('customKPIs', null, arr)
    }
  }

  /* ── Dados do gráfico — variável qualitativa selecionada ── */
  const chartData = useMemo(() => {
    if (!chartVarId) return []
    const pts = []
    activeReports.forEach(rep => {
      const e = rep.lancamentos?.[chartVarId]
      if (!e?.slots) return
      Object.entries(e.slots).forEach(([time, val]) => {
        const real = parseFloat(val)
        if (!isFinite(real)) return
        pts.push({
          time,
          real,
          ...(metaVal !== null ? { meta: metaVal } : {}),
        })
      })
    })
    // Ordena por horário e remove duplicatas (média se mesmo horário)
    const byTime = {}
    pts.forEach(p => {
      if (!byTime[p.time]) byTime[p.time] = { ...p, count: 1 }
      else { byTime[p.time].real += p.real; byTime[p.time].count++ }
    })
    return Object.values(byTime)
      .map(p => ({ ...p, real: round(p.real / p.count, 2) }))
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(-48)
  }, [activeReports, chartVarId, metaVal])

  /* ── Estatísticas da variável qualitativa ── */
  const stats = useMemo(() => {
    if (!chartData.length) return null
    const vals = chartData.map(p => p.real)
    const mean = round(vals.reduce((a,b)=>a+b,0)/vals.length, 2)
    const min  = round(Math.min(...vals), 2)
    const max  = round(Math.max(...vals), 2)
    const dev  = metaVal !== null ? round(mean - metaVal, 2) : null
    const devPct = metaVal !== null && metaVal !== 0 ? round((mean - metaVal)/metaVal*100, 1) : null
    return { mean, min, max, dev, devPct }
  }, [chartData, metaVal])

  /* ── Cores do gráfico ── */
  const aboveMeta = stats && metaVal !== null && stats.mean > metaVal
  const chartColor = aboveMeta ? '#ef4444' : '#22c55e'

  return (
    <div className="fade-in">
      {/* ── Cabeçalho ── */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Dashboard</h1>
            <p>Indicadores operacionais dos relatórios selecionados</p>
          </div>
          <span style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)' }}>
            {reports.length} relatório{reports.length !== 1 ? 's' : ''} na base
          </span>
        </div>
      </div>

      {/* ── Seletor de Relatórios ── */}
      <div className="card" style={{ marginBottom:'var(--space-xl)' }}>
        <div className="card-header" style={{ marginBottom:0, paddingBottom:0, border:'none' }}>
          <span className="card-title" style={{ fontSize:'var(--text-base)' }}>
            <FileText size={17} style={{ color:'var(--accent)' }} />
            Selecionar Relatórios para Análise
          </span>
          {selectedIds.size > 0 && (
            <button type="button" className="btn btn-ghost btn-sm"
              onClick={() => setSelectedIds(new Set())} style={{ color:'var(--text-muted)' }}>
              <X size={12}/> Limpar
            </button>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'var(--space-md)', flexWrap:'wrap', marginTop:'var(--space-md)' }}>
          <ReportSelector reports={reports} selected={selectedIds} onChange={setSelectedIds} />
          {selectedIds.size > 0 && selectedIds.size <= 5 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {reports.filter(r => selectedIds.has(r.id)).map(r => (
                <span key={r.id} className="badge badge-accent" style={{ cursor:'pointer', gap:6 }}
                  onClick={() => { const n=new Set(selectedIds); n.delete(r.id); setSelectedIds(n) }}>
                  {r.turnoInfo?.data} · {r.turnoInfo?.setor} <X size={10}/>
                </span>
              ))}
            </div>
          )}
          {selectedIds.size > 5 && <span className="badge badge-accent">{selectedIds.size} relatórios selecionados</span>}
        </div>
        {selectedIds.size === 0 && (
          <p style={{ fontSize:'var(--text-sm)', color:'var(--warning)', marginTop:'var(--space-md)', display:'flex', alignItems:'center', gap:6 }}>
            ⚠️ Nenhum relatório selecionado. Selecione ao menos um para calcular os indicadores.
          </p>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          SEÇÃO 1 — VARIÁVEIS QUANTITATIVAS (AccumCards)
      ═══════════════════════════════════════════════ */}
      <div className="section-label">Variáveis Quantitativas — Acumulado dos Relatórios Selecionados</div>
      <div className="dashboard-grid">
        {quantitativesData.map(q => {
          const IconComp = ICONS[q.iconName] || Box
          return (
            <AccumCard 
              key={q.id} 
              label={q.label} 
              value={q.total} 
              unit={q.finalUnit} 
              max={q.max || 100} 
              color={q.color} 
              icon={IconComp} 
              reportCount={activeReports.length} 
            />
          )
        })}
        {quantitativesData.length === 0 && (
          <p style={{ gridColumn: 'span 12', fontSize:'var(--text-sm)', color:'var(--text-muted)', padding:'var(--space-md)' }}>
            Nenhum indicador quantitativo configurado. Adicione-os em Variáveis de Processo.
          </p>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          SEÇÃO 2 — INDICADORES DE EFICIÊNCIA
      ═══════════════════════════════════════════════ */}
      <div className="section-label">Métricas de Eficiência — Status das Metas</div>
      <div className="dashboard-grid">
        {customKPIData.map(k => (
          <TargetCard
            key={k.id}
            label={k.label}
            value={k.averageValue ?? 0}
            unit={k.unit}
            color={k.color}
            icon={Target}
            meta={k.meta}
            inverse={k.inverse}
          />
        ))}
        {customKPIData.length === 0 && (
          <p style={{ gridColumn: 'span 12', fontSize:'var(--text-sm)', color:'var(--text-muted)', padding:'var(--space-md)' }}>
            Nenhum KPI configurado.
          </p>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          SEÇÃO 2b — GRÁFICOS POR KPI (Meta vs. Real)
      ═══════════════════════════════════════════════ */}
      <div className="section-label">Evolução dos Indicadores por Relatório — Meta vs. Real</div>
      <div className="dashboard-grid">
        {customKPIData.map(k => (
          <KPIChart
            key={k.id}
            title={k.label}
            unit={k.unit}
            color={k.color}
            data={k.series.map(d => ({ ...d, meta: k.meta }))}
            metaVal={k.meta}
            onMetaChange={v => updateKPIMeta(k.id, v)}
            emptyMsg={`Lance relatórios com as variáveis atreladas a este indicador para visualizar a evolução matemática.`}
            className="bento-chart-mid"
          />
        ))}
      </div>


      {/* ═══════════════════════════════════════════════
          SEÇÃO 3 — GRÁFICO VARIÁVEIS QUALITATIVAS
      ═══════════════════════════════════════════════ */}
      <div className="section-label">Variáveis Qualitativas — Meta vs. Real</div>
      <div className="card">
        {/* Controles */}
        <div className="card-header" style={{ flexWrap:'wrap', gap:'var(--space-md)', alignItems:'flex-start' }}>
          <span className="card-title">
            <TrendingUp size={18}/> Evolução Temporal por Variável
          </span>
          <div style={{ display:'flex', gap:'var(--space-sm)', alignItems:'flex-end', flexWrap:'wrap' }}>
            {/* Seletor de variável */}
            <div className="form-group" style={{ marginBottom:0 }}>
              <label style={{ display:'flex', alignItems:'center', gap:5 }}>
                <Activity size={11}/> Variável
              </label>
              <select
                value={chartVarId}
                onChange={e => setChartVarId(e.target.value)}
                style={{ width:230 }}
              >
                {qualitative.length === 0
                  ? <option value="">Sem variáveis qualitativas</option>
                  : qualitative.map(v =>
                    <option key={v.id} value={v.id}>{v.name} ({v.unit})</option>
                  )
                }
                {/* Fallback: mostrar todas se classificação resultou em 0 qualitativas */}
                {qualitative.length === 0 && allVars.map(v =>
                  <option key={v.id} value={v.id}>{v.name} ({v.unit})</option>
                )}
              </select>
            </div>

            {/* Meta manual */}
            <div className="form-group" style={{ marginBottom:0 }}>
              <label style={{ display:'flex', alignItems:'center', gap:5 }}>
                <Target size={11}/> Meta {chartVar ? `(${chartVar.unit})` : ''}
              </label>
              <input
                type="number"
                step="any"
                value={metas[chartVarId] ?? ''}
                onChange={e => setMetaForVar(chartVarId, e.target.value)}
                placeholder="Ex: 185"
                style={{ width:110 }}
                title={`Defina a meta para ${chartVar?.name || 'esta variável'}`}
              />
            </div>
          </div>
        </div>

        {/* Stats rápidas */}
        {stats && chartVar && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-sm)', marginBottom:'var(--space-md)' }}>
            {[
              { label:'Média Real', val: `${fmt(stats.mean)} ${chartVar.unit}`, color:'var(--text-primary)' },
              { label:'Mínimo',     val: `${fmt(stats.min)} ${chartVar.unit}`,  color:'#3b82f6' },
              { label:'Máximo',     val: `${fmt(stats.max)} ${chartVar.unit}`,  color:'#f97316' },
              ...(stats.dev !== null ? [
                { label:'Desvio da Meta', val: `${stats.dev > 0 ? '+' : ''}${fmt(stats.dev)} ${chartVar.unit}`, color: Math.abs(stats.dev) < 0.01 ? 'var(--leaf)' : aboveMeta ? 'var(--danger)' : '#22c55e' },
                { label:'Desvio (%)',     val: `${stats.devPct > 0 ? '+' : ''}${fmt(stats.devPct, 1)}%`,       color: Math.abs(stats.devPct) < 0.1 ? 'var(--leaf)' : aboveMeta ? 'var(--danger)' : '#22c55e' },
              ] : []),
            ].map(s => (
              <div key={s.label} style={{
                background:'var(--bg-surface)', border:'1px solid var(--border)',
                borderRadius:'var(--radius-md)', padding:'8px 14px', minWidth:120,
              }}>
                <div style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', marginBottom:3 }}>{s.label}</div>
                <div style={{ fontSize:'var(--text-base)', fontWeight:700, color:s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Gráfico */}
        {chartData.length === 0 ? (
          <div className="empty-state">
            <TrendingUp size={40} />
            <h4>Sem dados para exibir</h4>
            <p>
              {selectedIds.size === 0
                ? 'Selecione ao menos um relatório no painel acima.'
                : qualitative.length === 0
                ? 'Nenhuma variável qualitativa encontrada.'
                : 'A variável selecionada não possui lançamentos nos relatórios escolhidos.'}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={chartData} margin={{ top:10, right:24, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis
                dataKey="time"
                tick={{ fill:'var(--text-muted)', fontSize:11 }}
                axisLine={{ stroke:'var(--border)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill:'var(--text-muted)', fontSize:11 }}
                axisLine={false}
                tickLine={false}
                unit={chartVar ? ` ${chartVar.unit}` : ''}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize:'12px', color:'var(--text-secondary)' }} />
              {metaVal !== null && (
                <ReferenceLine
                  y={metaVal}
                  stroke="rgba(249,115,22,0.5)"
                  strokeDasharray="6 3"
                  label={{ value:`Meta: ${metaVal}`, fill:'var(--accent)', fontSize:11, position:'right' }}
                />
              )}
              {metaVal !== null && (
                <Line
                  type="monotone" dataKey="meta" name="Meta"
                  stroke="var(--accent)" strokeWidth={2} strokeDasharray="6 3"
                  dot={false} activeDot={{ r:4 }}
                />
              )}
              <Line
                type="monotone" dataKey="real" name={chartVar?.name || 'Real'}
                stroke={chartColor} strokeWidth={2.5}
                dot={{ fill:chartColor, r:3, strokeWidth:0 }}
                activeDot={{ r:6, strokeWidth:2, stroke:'white' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {metaVal !== null && stats && (
          <p style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', marginTop:'var(--space-sm)', textAlign:'right' }}>
            <Edit3 size={10}/> Meta definida manualmente: <strong>{fmt(metaVal)} {chartVar?.unit}</strong>
          </p>
        )}
      </div>

    </div>
  )
}
