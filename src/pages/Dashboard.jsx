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
import './Dashboard.css'

/* ─── Helpers ────────────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' })
}
function round(n, dec = 2) {
  return isFinite(n) && n !== null ? Number(n.toFixed(dec)) : null
}
function fmt(val, dec = 2) {
  if (val === null || val === undefined || !isFinite(val)) return '—'
  return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

/* Identifica variável por nome */
function matchVar(name, ...terms) {
  const n = name.toLowerCase()
  return terms.some(t => n.includes(t))
}

/* Fator de conversão entre unidades (retorna 1 se não souber) */
function convFactor(fromUnit, toUnit) {
  if (!fromUnit || !toUnit) return 1
  const f = fromUnit.trim().toLowerCase()
  const t = toUnit.trim().toLowerCase()
  if (f === t) return 1
  
  // Apenas conversões solicitadas:
  // 1. MW (ou MWh) para kW (ou kWh)
  const MEGA_ENG = ['mw', 'mwh']
  const KILO_ENG = ['kw', 'kwh']
  if (MEGA_ENG.includes(f) && KILO_ENG.includes(t)) return 1000
  
  // 2. Vapor em Ton para Kg
  const TON_SET = ['ton','t','t/h','ton/h']
  const KG_SET  = ['kg','kg/h']
  if (TON_SET.includes(f) && KG_SET.includes(t)) return 1000
  
  return 1
}

/* Grupos de unidades por grandeza física */
const MASS_UNITS   = ['ton','t','t/h','ton/h','kg','kg/h']
const ENERGY_UNITS = ['mw','kwh','kw','mwh']
const VOL_UNITS    = ['m³','m³/h','m3','m3/h']

/* Retorna o grupo permitido para uma unidade alvo (null = sem restrição) */
function allowedGroup(targetUnit) {
  const t = (targetUnit || '').trim().toLowerCase()
  if (MASS_UNITS.includes(t))   return MASS_UNITS
  if (ENERGY_UNITS.includes(t)) return ENERGY_UNITS
  if (VOL_UNITS.includes(t))    return VOL_UNITS
  return null
}

/* Calcula delta de variáveis já convertidas para a unidade alvo.
   Só soma variáveis cuja unidade pertence ao mesmo grupo físico do alvo
   (evita somar temperatura, pressão etc. que contêm 'vapor' no nome). */
function deltaConvert(activeReports, allVars, targetUnit, ...terms) {
  const allowed = allowedGroup(targetUnit)
  let acc = 0
  activeReports.forEach(rep => {
    allVars.forEach(v => {
      if (!matchVar(v.name, ...terms)) return
      // Filtra pelo grupo de unidade física
      if (allowed && !allowed.includes((v.unit || '').trim().toLowerCase())) return
      const e = rep.lancamentos?.[v.id]
      if (!e) return
      const d = parseFloat(e.tot_final || 0) - parseFloat(e.tot_inicial || 0)
      if (!isFinite(d)) return
      acc += d * convFactor(v.unit, targetUnit)
    })
  })
  return acc
}

/* Separa variáveis em quantitativas (totalizadores) e qualitativas (leituras instantâneas) */
function classifyVars(allVars) {
  const QUANTITATIVE_TERMS = ['vazão','producao','produção','consumo','energia','cavaco','biomassa','vapor','água','agua','alimentação','alimentacao']
  const qualitative = allVars.filter(v => !QUANTITATIVE_TERMS.some(t => v.name.toLowerCase().includes(t)))
  const quantitative = allVars.filter(v => QUANTITATIVE_TERMS.some(t => v.name.toLowerCase().includes(t)))
  // Se não separou bem, todos são qualitativas
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
/* ─── TargetCard — Card horizontal de meta (Substitui o Gauge) ───────── */
function TargetCard({ label, value, unit, meta, color, icon: Icon, inverse }) {
  const safeVal = (typeof value === 'number' && isFinite(value)) ? value : 0
  const hasMeta = typeof meta === 'number' && isFinite(meta)
  
  // Decide a cor do status da barra dependendo do inverse (consumo vs geração)
  let statusColor = color 
  let statusText = ''
  
  if (hasMeta) {
    if (inverse) {
      // Para consumo numérico (ex: kWh Consumido), o 'menor' (<= meta) é sucesso
      statusColor = safeVal <= meta ? 'var(--leaf)' : 'var(--danger, #ef4444)'
      statusText = safeVal <= meta ? 'Abaixo do teto (Bom)' : 'Acima do teto (Atenção)'
    } else {
      // Para geração (ex: kW Gerado), o 'maior' (>= meta) é sucesso
      statusColor = safeVal >= meta ? 'var(--leaf)' : 'var(--warning, #eab308)'
      statusText = safeVal >= meta ? 'Meta atingida!' : 'Abaixo da meta'
    }
  }

  // Ajuste elástico da calha visual da barra para suportar a barra inteira
  const maxVal = hasMeta ? Math.max(meta * 1.3, safeVal * 1.1) : (safeVal > 0 ? safeVal * 1.2 : 100)
  const valPct = Math.min((safeVal / maxVal) * 100, 100)
  const metaPct = hasMeta ? Math.min((meta / maxVal) * 100, 100) : 0

  return (
    <div className="stat-card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ minWidth: 44, width: 44, height: 44, borderRadius: 'var(--radius-md)', background: `${color}18`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} style={{ color }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {safeVal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
              {unit}
            </span>
          </div>
        </div>
      </div>

      {/* Tracker da Meta */}
      {hasMeta && (
        <div style={{ marginTop: 6, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 8, fontWeight: 600 }}>
            <span style={{ color: 'var(--text-muted)' }}>Meta: {meta.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</span>
            <span style={{ color: statusColor }}>{statusText}</span>
          </div>
          
          <div style={{ position: 'relative', height: 10, background: 'rgba(0,0,0,0.04)', borderRadius: 5, overflow: 'hidden' }}>
             {/* Sombra demarcando limitador da meta na calha invisível */}
             <div style={{
                position: 'absolute', top: 0, bottom: 0, left: 0, width: `${metaPct}%`,
                background: inverse ? 'rgba(34,197,94,0.1)' : 'rgba(0,0,0,0.03)', 
                borderRight: inverse ? 'none' : '1px solid rgba(0,0,0,0.1)'
             }} />
             
             {/* Barra progressiva que pinta esticando conforme o value */}
             <div style={{
                position: 'absolute', top: 0, bottom: 0, left: 0, width: `${valPct}%`,
                background: `linear-gradient(90deg, ${statusColor}cc, ${statusColor})`,
                borderRadius: 5, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `0 0 6px ${statusColor}44`
             }} />
             
             {/* Traço divisor visível no alvo cravado */}
             <div style={{
                position: 'absolute', top: 0, bottom: 0, left: `${metaPct}%`, width: 2,
                background: 'var(--text-primary)', transform: 'translateX(-50%)', opacity: 0.6
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
  const pctDisp = Math.round(pct * 100)

  return (
    <div className="stat-card" style={{
      display:'flex', flexDirection:'column', gap:12, padding:'var(--space-lg)',
      borderTop: `3px solid ${color}`,
    }}>
      {/* Icon + label */}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{
          width:32, height:32, borderRadius:'var(--radius-sm)',
          background:`${color}18`, border:`1px solid ${color}33`,
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="stat-label" style={{ textTransform:'uppercase', letterSpacing:'0.07em' }}>{label}</span>
      </div>

      {/* Big value */}
      <div style={{ lineHeight:1 }}>
        <span style={{ fontSize:28, fontWeight:800, color:'var(--text-primary)' }}>
          {typeof value === 'number' ? value.toLocaleString('pt-BR', { maximumFractionDigits:1 }) : '0'}
        </span>
        <span style={{ fontSize:'var(--text-sm)', color:'var(--text-muted)', marginLeft:6, fontWeight:500 }}>{unit}</span>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ height:6, background:'rgba(0,0,0,0.07)', borderRadius:3, overflow:'hidden' }}>
          <div style={{
            height:'100%', width:`${pct*100}%`,
            background: `linear-gradient(90deg, ${color}bb, ${color})`,
            borderRadius:3,
            transition:'width 0.6s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: `0 0 8px ${color}55`,
          }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:'var(--text-xs)', color:'var(--text-muted)' }}>
          <span>{pctDisp}% do referencial</span>
          <span>ref: {max.toLocaleString('pt-BR')} {unit}</span>
        </div>
      </div>

      {/* Rodapé */}
      {reportCount !== undefined && (
        <div style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', borderTop:'1px solid var(--border)', paddingTop:8 }}>
          {reportCount} relatório{reportCount !== 1 ? 's' : ''} considerado{reportCount !== 1 ? 's' : ''}
        </div>
      )}
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
function KPIChart({ title, unit, color, data, metaKey, metaVal, onMetaChange, emptyMsg }) {
  const hasData   = data.some(d => d.real !== null && d.real !== undefined)
  const vals      = data.filter(d => d.real !== null).map(d => d.real)
  const mean      = vals.length ? round(vals.reduce((a,b)=>a+b,0)/vals.length, 3) : null
  const aboveMeta = mean !== null && metaVal !== null && mean > metaVal
  const lineColor = metaVal !== null ? (aboveMeta ? '#ef4444' : '#22c55e') : color

  // badges de stat
  const statItems = [
    mean !== null && { label:'Média', val: fmt(mean,3), color:'var(--text-primary)' },
    vals.length > 0 && { label:'Mín', val: fmt(Math.min(...vals),3), color:'#3b82f6' },
    vals.length > 0 && { label:'Máx', val: fmt(Math.max(...vals),3), color:'#f97316' },
    (mean !== null && metaVal !== null) && {
      label:'Δ Meta',
      val: `${mean-metaVal > 0 ? '+' : ''}${fmt(mean-metaVal,3)}`,
      color: aboveMeta ? 'var(--danger)' : 'var(--leaf-dark)'
    },
  ].filter(Boolean)

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap:'wrap', gap:'var(--space-sm)', alignItems:'flex-start' }}>
        <span className="card-title" style={{ fontSize:'var(--text-base)' }}>
          <TrendingUp size={16} style={{ color }} /> {title}
        </span>
        {/* Meta input */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <label style={{ fontSize:'var(--text-xs)', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', whiteSpace:'nowrap' }}>
            <Target size={11}/> Meta
          </label>
          <input
            type="number" step="any"
            value={metaVal ?? ''}
            onChange={e => onMetaChange(e.target.value === '' ? null : parseFloat(e.target.value))}
            placeholder="Ex: 1.5"
            style={{ width:100, marginBottom:0 }}
          />
          {metaVal !== null && <span style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)' }}>{unit}</span>}
        </div>
      </div>

      {/* Stat pills */}
      {statItems.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:'var(--space-md)' }}>
          {statItems.map(s => (
            <div key={s.label} style={{
              background:'var(--bg-surface)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-md)', padding:'6px 12px',
            }}>
              <div style={{ fontSize:10, color:'var(--text-muted)' }}>{s.label}</div>
              <div style={{ fontSize:'var(--text-sm)', fontWeight:700, color:s.color }}>{s.val}</div>
            </div>
          ))}
          <div style={{
            background:'var(--bg-surface)', border:'1px solid var(--border)',
            borderRadius:'var(--radius-md)', padding:'6px 12px',
          }}>
            <div style={{ fontSize:10, color:'var(--text-muted)' }}>Relatórios</div>
            <div style={{ fontSize:'var(--text-sm)', fontWeight:700, color:'var(--text-primary)' }}>{data.length}</div>
          </div>
        </div>
      )}

      {!hasData ? (
        <div className="empty-state" style={{ padding:'var(--space-lg)' }}>
          <TrendingUp size={32} />
          <p>{emptyMsg || 'Sem dados suficientes para calcular este indicador.'}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top:8, right:24, left:0, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis
              dataKey="label"
              tick={{ fill:'var(--text-muted)', fontSize:10 }}
              axisLine={{ stroke:'var(--border)' }}
              tickLine={false}
              interval={Math.max(0, Math.floor(data.length / 12) - 1)}
              angle={data.length > 8 ? -35 : 0}
              textAnchor={data.length > 8 ? 'end' : 'middle'}
              height={data.length > 8 ? 52 : 28}
            />
            <YAxis
              tick={{ fill:'var(--text-muted)', fontSize:10 }}
              axisLine={false}
              tickLine={false}
              width={64}
              unit={` ${unit}`}
              tickFormatter={v => fmt(v, 2)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" wrapperStyle={{ fontSize:'11px', color:'var(--text-secondary)' }} />
            {metaVal !== null && (
              <ReferenceLine
                y={metaVal}
                stroke="rgba(249,115,22,0.5)"
                strokeDasharray="6 3"
                label={{ value:`Meta: ${fmt(metaVal,3)}`, fill:'var(--accent)', fontSize:10, position:'right' }}
              />
            )}
            {metaVal !== null && (
              <Line
                type="monotone" dataKey="meta" name="Meta"
                stroke="var(--accent)" strokeWidth={2} strokeDasharray="6 3"
                dot={false} activeDot={{ r:3 }}
              />
            )}
            <Line
              type="monotone" dataKey="real" name="Real"
              stroke={lineColor} strokeWidth={2.5}
              dot={{ fill:lineColor, r:4, strokeWidth:2, stroke:'white' }}
              activeDot={{ r:6, strokeWidth:2, stroke:'white' }}
              connectNulls={false}
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
      <div className="grid-3" style={{ marginBottom:'var(--space-xl)', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))' }}>
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
          <p style={{ fontSize:'var(--text-sm)', color:'var(--text-muted)', padding:'var(--space-md)' }}>
            Nenhum indicador quantitativo configurado. Adicione-os em Variáveis de Processo.
          </p>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          SEÇÃO 2 — INDICADORES DE EFICIÊNCIA
      ═══════════════════════════════════════════════ */}
      <div className="section-label">Métricas de Eficiência — Status das Metas</div>
      <div className="grid-3" style={{ marginBottom:'var(--space-lg)' }}>
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
          <p style={{ fontSize:'var(--text-sm)', color:'var(--text-muted)', padding:'var(--space-md)' }}>
            Nenhum KPI configurado.
          </p>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          SEÇÃO 2b — GRÁFICOS POR KPI (Meta vs. Real)
      ═══════════════════════════════════════════════ */}
      <div className="section-label">Evolução dos Indicadores por Relatório — Meta vs. Real</div>
      <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-lg)', marginBottom:'var(--space-xl)' }}>
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
