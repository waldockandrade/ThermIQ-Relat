import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import {
  FileText, Eye, Trash2, X, Download, Mail,
  Zap, Droplets, Wind, Activity, Flame,
  BookOpen, Wrench, AlertTriangle, BarChart2,
  Clock, User, Thermometer, Pencil, Save, Check,
} from 'lucide-react'

const MAX_DIARIO = 3000

function generateTimeSlots(start, end) {
  if (!start || !end) return []
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  // Guard: NaN check — retorna [] se os valores não forem números válidos
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return []
  const slots = []
  let cur = sh * 60 + sm
  const endMin = eh * 60 + em + (eh * 60 + em <= sh * 60 + sm ? 24 * 60 : 0)
  // Limite de segurança: máx 200 slots para evitar loop infinito
  while (cur <= endMin && slots.length < 200) {
    const h = Math.floor(cur / 60) % 24
    const m = cur % 60
    slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
    cur += 15
  }
  return slots
}

/* ─── Edit Modal ─────────────────────────────── */
function EditModal({ report, allVars, onClose, onSave }) {
  const { isAdmin } = useAuth()

  const timeSlots = generateTimeSlots(
    report.turnoInfo?.horaInicio,
    report.turnoInfo?.horaFim,
  )

  // Inicializa values com os dados existentes
  const [values, setValues] = useState(() => {
    const init = {}
    ;(report.selectedVarIds || []).forEach(id => {
      init[id] = report.lancamentos?.[id]
        ? { ...report.lancamentos[id], slots: { ...report.lancamentos[id].slots } }
        : { tot_inicial: '', slots: {}, tot_final: '' }
    })
    return init
  })
  const [diario, setDiario] = useState(report.diario || '')
  const [saved, setSaved] = useState(false)

  const selVars = allVars.filter(v => (report.selectedVarIds || []).includes(v.id))

  // Fechar com Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function setVal(varId, field, val) {
    setValues(prev => ({ ...prev, [varId]: { ...prev[varId], [field]: val } }))
  }
  function setSlotVal(varId, time, val) {
    setValues(prev => ({
      ...prev,
      [varId]: { ...prev[varId], slots: { ...prev[varId]?.slots, [time]: val } },
    }))
  }

  function handleSave() {
    onSave({
      lancamentos: values,
      diario,
      editadoEm: new Date().toISOString(),
    })
    setSaved(true)
    setTimeout(onClose, 900)
  }

  const { turnoInfo } = report

  return ReactDOM.createPortal(
    <>
      {/* Close button floating */}
      <button
        onClick={onClose}
        title="Fechar (Esc)"
        style={{
          position:'fixed', top:20, right:20, zIndex:10001,
          width:44, height:44, borderRadius:'50%',
          background:'var(--accent)', color:'#fff',
          border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 4px 20px rgba(0,0,0,0.4)',
          transition:'transform 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
      >
        <X size={20} />
      </button>

      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal"
          style={{ maxWidth:980, width:'100%', maxHeight:'92vh', overflowY:'auto', padding:0 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Sticky header */}
          <div style={{
            position:'sticky', top:0, zIndex:10,
            background:'var(--bg-card)', borderBottom:'1px solid var(--border)',
            padding:'var(--space-md) var(--space-lg)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Pencil size={18} style={{ color:'var(--accent)' }} />
              <div>
                <div style={{ fontWeight:800, fontSize:'var(--text-base)', color:'var(--text-primary)' }}>
                  Editar Relatório
                </div>
                <div style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)' }}>
                  {fmtDate(turnoInfo?.data)} · {turnoInfo?.turno} · {turnoInfo?.setor}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-ghost btn-sm" onClick={onClose}>
                <X size={14}/> Cancelar
              </button>
              <button
                className="btn btn-success btn-sm"
                onClick={handleSave}
                disabled={saved}
              >
                {saved ? <><Check size={14}/> Salvo!</> : <><Save size={14}/> Salvar Alterações</>}
              </button>
            </div>
          </div>

          <div style={{ padding:'var(--space-xl)' }}>
            {/* Info resumo */}
            <div style={{
              background:'var(--bg-surface)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-md)', padding:'var(--space-md)',
              marginBottom:'var(--space-lg)',
              display:'flex', flexWrap:'wrap', gap:'var(--space-lg)',
              fontSize:'var(--text-sm)',
            }}>
              {[
                ['Data', fmtDate(turnoInfo?.data)],
                ['Turno', turnoInfo?.turno],
                ['Início', turnoInfo?.horaInicio],
                ['Fim', turnoInfo?.horaFim],
                ['Setor', turnoInfo?.setor],
                ['Intervalos', `${timeSlots.length} slots de 15 min`],
              ].map(([k,v]) => (
                <div key={k}>
                  <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', marginBottom:2 }}>{k}</div>
                  <div style={{ color:'var(--text-primary)', fontWeight:600 }}>{v || '—'}</div>
                </div>
              ))}
            </div>

            {/* Aviso se não há variáveis */}
            {selVars.length === 0 && (
              <div style={{ color:'var(--text-muted)', fontStyle:'italic', fontSize:'var(--text-sm)', marginBottom:'var(--space-lg)' }}>
                Nenhuma variável associada a este relatório.
              </div>
            )}

            {/* Tabelas de lançamento por variável */}
            {selVars.map(v => (
              <div key={v.id} className="card" style={{ marginBottom:'var(--space-md)' }}>
                <div className="card-header">
                  <span className="card-title" style={{ fontSize:'var(--text-base)' }}>
                    {v.name} <span className="badge badge-muted" style={{ marginLeft:8 }}>{v.unit}</span>
                  </span>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ background:'var(--bg-surface)', minWidth:130 }}>Tot. Inicial</th>
                        {timeSlots.map(t => (
                          <th key={t} style={{ minWidth:72, textAlign:'center' }}>{t}</th>
                        ))}
                        <th style={{ background:'var(--bg-surface)', minWidth:130 }}>Tot. Final</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <input
                            className="cell-input"
                            type="number"
                            value={values[v.id]?.tot_inicial ?? ''}
                            onChange={e => setVal(v.id, 'tot_inicial', e.target.value)}
                            placeholder="0"
                            style={{ width:'100%' }}
                          />
                        </td>
                        {timeSlots.map(t => (
                          <td key={t} style={{ textAlign:'center' }}>
                            <input
                              className="cell-input"
                              type="number"
                              value={values[v.id]?.slots?.[t] ?? ''}
                              onChange={e => setSlotVal(v.id, t, e.target.value)}
                              placeholder="—"
                            />
                          </td>
                        ))}
                        <td>
                          <input
                            className="cell-input"
                            type="number"
                            value={values[v.id]?.tot_final ?? ''}
                            onChange={e => setVal(v.id, 'tot_final', e.target.value)}
                            placeholder="0"
                            style={{ width:'100%' }}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Diário de Bordo */}
            <div className="card" style={{ marginBottom:'var(--space-lg)' }}>
              <div className="card-header">
                <span className="card-title">
                  <BookOpen size={17} style={{ color:'var(--accent)' }} /> Diário de Bordo
                </span>
                <span style={{ fontSize:'var(--text-xs)', color: diario.length >= MAX_DIARIO ? 'var(--danger)' : 'var(--text-muted)' }}>
                  {diario.length}/{MAX_DIARIO}
                </span>
              </div>
              <textarea
                value={diario}
                onChange={e => setDiario(e.target.value.slice(0, MAX_DIARIO))}
                placeholder="Registre as ocorrências do turno..."
                style={{ minHeight:140 }}
              />
            </div>

            {/* Botão salvar inferior */}
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'var(--space-sm)' }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
              <button
                className="btn btn-success"
                onClick={handleSave}
                disabled={saved}
              >
                {saved ? <><Check size={15}/> Salvo!</> : <><Save size={15}/> Salvar Alterações</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  , document.body)
}

/* ─── helpers ────────────────────────────────── */
function round(n, d = 2) { return Math.round(n * 10 ** d) / 10 ** d }

function delta(lans, varId) {
  const e = lans?.[varId]
  if (!e) return null
  const f = parseFloat(e.tot_final)
  const i = parseFloat(e.tot_inicial)
  if (!isFinite(f) || !isFinite(i)) return null
  return round(f - i, 2)
}

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, dd] = d.split('-')
  return `${dd}/${m}/${y}`
}

function matchVar(name, ...terms) {
  const n = name.toLowerCase()
  return terms.some(t => n.includes(t))
}

/* Grupos de unidades por grandeza física */
const MASS_UNITS   = ['ton','t','t/h','ton/h','kg','kg/h']
const ENERGY_UNITS = ['mw','kwh','kw','mwh']
const VOL_UNITS    = ['m³','m³/h','m3','m3/h']

/* Fator de conversão entre unidades */
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

/* ─── Mini KPI Badge ──────────────────────────── */
function KPIBadge({ label, value, unit, color }) {
  return (
    <div style={{
      background: `${color}12`, border: `1px solid ${color}30`,
      borderRadius: 'var(--radius-md)', padding: '10px 16px',
      display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140,
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>
        {value !== null ? value.toLocaleString('pt-BR', { maximumFractionDigits: 3 }) : '—'}
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>{unit}</span>
      </div>
    </div>
  )
}

/* ─── Variable Table Row ─────────────────────── */
function VarRow({ v, lans, colSpan }) {
  const [open, setOpen] = useState(false)
  const e = lans?.[v.id]
  if (!e) return null
  const d = delta(lans, v.id)
  const slotEntries = Object.entries(e.slots || {}).filter(([, val]) => val !== '').sort(([a], [b]) => a.localeCompare(b))

  const cellStyle = {
    padding: '7px 12px',
    fontSize: 'var(--text-sm)',
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'middle',
  }

  return (
    <>
      <tr
        onClick={() => slotEntries.length > 0 && setOpen(p => !p)}
        style={{ cursor: slotEntries.length > 0 ? 'pointer' : 'default', transition: 'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <td style={{ ...cellStyle, fontWeight: 600, color: 'var(--text-primary)', maxWidth: 200 }}>{v.name}</td>
        <td style={{ ...cellStyle, textAlign: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px' }}>{v.unit || '—'}</span>
        </td>
        <td style={{ ...cellStyle, textAlign: 'right', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
          {e.tot_inicial !== '' ? e.tot_inicial : <span style={{ color: 'var(--text-muted)' }}>—</span>}
        </td>
        <td style={{ ...cellStyle, textAlign: 'right', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
          {e.tot_final !== '' ? e.tot_final : <span style={{ color: 'var(--text-muted)' }}>—</span>}
        </td>
        <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 700, color: d !== null ? 'var(--accent)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {d !== null ? d : '—'}
        </td>
        <td style={{ ...cellStyle, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
          {slotEntries.length > 0
            ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{slotEntries.length}</span>
                <span style={{ fontSize: 10, opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
              </span>
            : <span style={{ opacity: 0.4 }}>—</span>
          }
        </td>
      </tr>

      {open && slotEntries.length > 0 && (
        <tr>
          <td colSpan={6} style={{ padding: 0, borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
            <div style={{ padding: '10px 16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <tbody>
                  <tr>
                    {slotEntries.map(([time, val]) => (
                      <td key={time} style={{
                        padding: '4px 8px', textAlign: 'center',
                        border: '1px solid var(--border)',
                        borderRadius: 0,
                        whiteSpace: 'nowrap',
                      }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, marginBottom: 2 }}>{time}</div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{val}</div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════════════
   REPORT DETAIL MODAL
═══════════════════════════════════════════════════════ */
function ReportDetail({ report, downtimes, maintenances, allVars, onClose }) {
  const printRef = useRef()
  const { turnoInfo, operadores, combustiveis, diario, lancamentos, timeSlots, selectedVarIds } = report

  const repDate    = turnoInfo?.data
  const repParadas = downtimes.filter(d => d.data === repDate)
  const repNotas   = maintenances.filter(m => m.data === repDate)
  const selVars    = allVars.filter(v => selectedVarIds?.includes(v.id))

  /* ── KPI calculation ── */
  // Usa filtro por unidade física para evitar somar temperatura/pressão que contenham 'vapor' no nome
  const kpis = useMemo(() => {
    const lans = lancamentos || {}
    let dVapTon = 0, dVapKg = 0, dKw = 0, dKwh = 0, dCav = 0
    let hasVap = false, hasKw = false, hasKwh = false, hasCav = false
    // A-05: itera selVars (variáveis do relatório) em vez de allVars (todas do sistema)
    selVars.forEach(v => {
      const d = delta(lans, v.id)
      if (d === null) return
      const nm   = v.name.toLowerCase()
      const unit = (v.unit || '').trim().toLowerCase()
      // Vapor: nome + unidade de massa
      if (matchVar(nm, 'vazão vapor', 'vapor gerado', 'vapor') && MASS_UNITS.includes(unit)) {
        dVapTon += d * convFactor(v.unit, 'ton')
        dVapKg  += d * convFactor(v.unit, 'kg')
        hasVap   = true
      }
      // Energia gerada: nome + unidade de energia
      if (matchVar(nm, 'gerada', 'gerado') && ENERGY_UNITS.includes(unit)) {
        dKw  += d * convFactor(v.unit, 'kW')
        hasKw = true
      }
      // Energia consumida: nome + unidade de energia
      if (matchVar(nm, 'consumida', 'consumido') && ENERGY_UNITS.includes(unit)) {
        dKwh  += d * convFactor(v.unit, 'kWh')
        hasKwh = true
      }
      // Cavaco: nome + unidade volumétrica
      if (matchVar(nm, 'cavaco', 'biomassa', 'combustível') && VOL_UNITS.includes(unit)) {
        dCav  += d * convFactor(v.unit, 'm³')
        hasCav = true
      }
    })
    return {
      kwhPorVapor:   hasVap && hasKw  ? round(dKw  / dVapTon, 3) : null,
      kwhConsPorVap: hasVap && hasKwh ? round(dKwh / dVapTon, 3) : null,
      kgPorCavaco:   hasCav && hasVap ? round(dVapKg / dCav, 3)  : null,
      dVap:  hasVap ? round(dVapTon, 2) : null,
      dMW:   hasKw  ? round(dKw, 3)    : null,
      dKwhC: hasKwh ? round(dKwh, 2)   : null,
      dCav:  hasCav ? round(dCav, 2)   : null,
    }
  }, [lancamentos, selVars])

  /* ── Close on Escape key ── */
  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  /* ── PDF via window.print() ── */
  function handlePrint() {
    window.print()
  }

  /* ── Email via mailto ── */
  function handleEmail() {
    const subject = encodeURIComponent(`Relatório ThermIQ — ${fmtDate(repDate)} ${turnoInfo?.turno || ''}`)
    const coi = operadores?.find(o => o.tipo === 'Op. COI')?.nome || '—'
    const body = encodeURIComponent(
`RELATÓRIO OPERACIONAL — ThermIQ Relat
======================================
Data:   ${fmtDate(repDate)}
Turno:  ${turnoInfo?.turno || '—'}
Setor:  ${turnoInfo?.setor || '—'}
Início: ${turnoInfo?.horaInicio || '—'}  |  Fim: ${turnoInfo?.horaFim || '—'}
Op. COI: ${coi}

── INDICADORES DE EFICIÊNCIA ──
kW Gerado / ton Vapor:   ${kpis.kwhPorVapor ?? '—'} kW/ton
kWh Consumido / ton Vapor: ${kpis.kwhConsPorVap ?? '—'} kWh/ton
kg Vapor / m³ Cavaco:    ${kpis.kgPorCavaco ?? '—'} kg/m³

── ACUMULADOS ──
Vapor Gerado:     ${kpis.dVap ?? '—'} ton
Energia Gerada:   ${kpis.dMW  ?? '—'} MW
Energia Consumida:${kpis.dKwhC ?? '—'} kWh
Consumo Cavaco:   ${kpis.dCav  ?? '—'} m³

── DIÁRIO DE BORDO ──
${diario || '(não preenchido)'}

── PARADAS (${repParadas.length}) ──
${repParadas.map(p => `  ${p.inicio}–${p.fim}  [${p.tipo}]  ${p.descricao}`).join('\n') || '  Nenhuma parada registrada'}

── NOTAS DE MANUTENÇÃO (${repNotas.length}) ──
${repNotas.map(n => `  [${n.prioridade}] ${n.nome} — ${n.descricao}`).join('\n') || '  Nenhuma nota registrada'}

---
Enviado via ThermIQ Relat
`)
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
  }

  /* ── parada priority badge ── */
  // M-01: tipoColor removido daqui — a definição está no escopo do módulo (linha abaixo da função ReportDetail)

  return (
    <>
      {/* ── Print styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #thermiq-print-area, #thermiq-print-area * { visibility: visible !important; }
          #thermiq-print-area {
            position: fixed; top: 0; left: 0;
            width: 210mm; padding: 16mm;
            background: white; color: black;
            font-family: 'Inter', sans-serif; font-size: 9pt;
          }
          .no-print { display: none !important; }
          .print-section { page-break-inside: avoid; margin-bottom: 12pt; }
          .print-title { font-size: 14pt; font-weight: 800; color: #f97316; margin-bottom: 4pt; }
          .print-subtitle { font-size: 8pt; color: #666; margin-bottom: 12pt; }
          .print-label { font-size: 7pt; text-transform: uppercase; letter-spacing: 0.07em; color: #999; font-weight: 700; margin-bottom:4pt; }
          .print-kpi-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8pt; margin-bottom:8pt; }
          .print-kpi { background: #fafafa; border: 1px solid #eee; border-radius:4pt; padding: 6pt; }
          .print-kpi-val { font-size: 13pt; font-weight: 800; }
          .print-row { display: flex; gap: 16pt; margin-bottom: 8pt; }
          .print-col { flex: 1; }
          .print-var-table { width: 100%; border-collapse: collapse; font-size: 8pt; }
          .print-var-table th { background: #f5f5f5; text-align: left; padding:4pt; font-size:7pt; }
          .print-var-table td { padding: 3pt 4pt; border-bottom: 1px solid #eee; }
          .print-diario { background: #fafafa; border: 1px solid #eee; border-radius:4pt; padding:8pt; white-space: pre-wrap; font-size:8pt; line-height:1.6; }
          .print-badge { display:inline-block; padding:1pt 4pt; border-radius:3pt; font-size:7pt; font-weight:700; border:1px solid currentColor; margin-right:4pt; }
        }
      `}</style>

      {/* ── Floating close button (always visible, outside scroll area) ── */}
      <button
        className="no-print"
        onClick={onClose}
        title="Fechar relatório (Esc)"
        style={{
          position: 'fixed', top: 20, right: 20, zIndex: 10001,
          width: 44, height: 44, borderRadius: '50%',
          background: 'var(--accent)', color: '#fff',
          border: 'none', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,0,0,0.5)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';   e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)' }}
      >
        <X size={20} />
      </button>

      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal"
          style={{ maxWidth: 900, width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: 0 }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Sticky header ── */}
          <div className="no-print" style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
            padding: 'var(--space-md) var(--space-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={20} style={{ color: 'var(--accent)' }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
                  Relatório Operacional
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {fmtDate(repDate)} · {turnoInfo?.turno} · {turnoInfo?.setor}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={handleEmail} title="Enviar por e-mail">
                <Mail size={14} /> E-mail
              </button>
              <button className="btn btn-primary btn-sm" onClick={handlePrint} title="Exportar PDF A4">
                <Download size={14} /> PDF A4
              </button>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={16} /></button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════
              PRINT AREA
          ══════════════════════════════════════════════ */}
          <div id="thermiq-print-area" ref={printRef} style={{ padding: 'var(--space-xl)' }}>

            {/* Print-only header */}
            <div className="print-section" style={{ display:'none' }}>
              <div className="print-title">ThermIQ Relat — Relatório Operacional</div>
              <div className="print-subtitle">{fmtDate(repDate)} · {turnoInfo?.turno} · {turnoInfo?.setor} · {turnoInfo?.horaInicio}–{turnoInfo?.horaFim}</div>
            </div>

            {/* ── SEÇÃO 1: Cabeçalho do turno + Operadores ── */}
            <div className="print-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
              <div>
                <div className="section-label">
                  <Clock size={13} style={{ display:'inline', marginRight:6, color:'var(--accent)' }} />
                  Informações do Turno
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    ['Data',    fmtDate(repDate)],
                    ['Turno',   turnoInfo?.turno],
                    ['Início',  turnoInfo?.horaInicio],
                    ['Término', turnoInfo?.horaFim],
                    ['Setor',   turnoInfo?.setor],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: 12, fontSize: 'var(--text-sm)' }}>
                      <span style={{ color: 'var(--text-muted)', minWidth: 70 }}>{k}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{v || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="section-label">
                  <User size={13} style={{ display:'inline', marginRight:6, color:'var(--accent)' }} />
                  Equipe de Operação
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {operadores?.map(op => (
                    <div key={op.id} style={{ display: 'flex', gap: 12, fontSize: 'var(--text-sm)' }}>
                      <span style={{ color: 'var(--text-muted)', minWidth: 140, fontSize: 'var(--text-xs)' }}>{op.tipo}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{op.nome || '—'}</span>
                    </div>
                  ))}
                </div>

                {combustiveis?.length > 0 && (
                  <>
                    <div className="section-label" style={{ marginTop: 'var(--space-md)' }}>
                      <Flame size={13} style={{ display:'inline', marginRight:6, color:'#eab308' }} />
                      Combustível
                    </div>
                    {combustiveis.map(c => (
                      <div key={c.id} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 4 }}>
                        {c.mistura || '—'}{c.umidade ? ` · ${c.umidade}% umidade` : ''}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* ── SEÇÃO 2: KPIs de Eficiência ── */}
            <div className="print-section" style={{ marginBottom: 'var(--space-xl)' }}>
              <div className="section-label">
                <BarChart2 size={13} style={{ display:'inline', marginRight:6, color:'var(--accent)' }} />
                Indicadores de Eficiência
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                <KPIBadge label="kW Gerado / ton Vapor"      value={kpis.kwhPorVapor}  unit="kW/ton"  color="#f97316" />
                <KPIBadge label="kWh Consumido / ton Vapor"  value={kpis.kwhConsPorVap} unit="kWh/ton" color="#a855f7" />
                <KPIBadge label="kg Vapor / m³ Cavaco"       value={kpis.kgPorCavaco}   unit="kg/m³"   color="#22c55e" />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <KPIBadge label="Δ Vapor Gerado"     value={kpis.dVap}  unit="ton"  color="#22c55e" />
                <KPIBadge label="Δ Energia Gerada"   value={kpis.dMW}   unit="MW"   color="#f97316" />
                <KPIBadge label="Δ Energia Consumida" value={kpis.dKwhC} unit="kWh"  color="#a855f7" />
                <KPIBadge label="Δ Cavaco Consumido" value={kpis.dCav}  unit="m³"   color="#eab308" />
              </div>
            </div>

            {/* ── SEÇÃO 3: Lançamentos de Variáveis ── */}
            {selVars.length > 0 && (
              <div className="print-section" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="section-label">
                  <Thermometer size={13} style={{ display:'inline', marginRight:6, color:'var(--accent)' }} />
                  Variáveis de Processo
                  <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--text-muted)', fontSize: 11 }}>
                    {selVars.length} variáveis · {timeSlots?.length || 0} intervalos de 15 min
                  </span>
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-surface)' }}>
                        {[
                          { label: 'Variável',   align: 'left'   },
                          { label: 'Unidade',    align: 'center' },
                          { label: 'Inicial',    align: 'right'  },
                          { label: 'Final',      align: 'right'  },
                          { label: 'Δ',          align: 'right'  },
                          { label: 'Pontos',     align: 'center' },
                        ].map(({ label, align }) => (
                          <th key={label} style={{
                            padding: '7px 12px',
                            textAlign: align,
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                            color: 'var(--text-muted)',
                            borderBottom: '2px solid var(--border)',
                            whiteSpace: 'nowrap',
                          }}>
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selVars.map(v => (
                        <VarRow key={v.id} v={v} lans={lancamentos} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── SEÇÃO 4: Diário de Bordo ── */}
            <div className="print-section" style={{ marginBottom: 'var(--space-xl)' }}>
              <div className="section-label">
                <BookOpen size={13} style={{ display:'inline', marginRight:6, color:'var(--accent)' }} />
                Diário de Bordo
              </div>
              {diario ? (
                <div style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: 'var(--space-md)',
                  fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
                  lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'inherit',
                }}>
                  {diario}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>
                  Diário de bordo não preenchido para este relatório.
                </div>
              )}
            </div>

            {/* ── SEÇÃO 5: Paradas de Processo ── */}
            <div className="print-section" style={{ marginBottom: 'var(--space-xl)' }}>
              <div className="section-label">
                <AlertTriangle size={13} style={{ display:'inline', marginRight:6, color:'#f97316' }} />
                Paradas de Processo do Dia
                <span className="badge badge-muted" style={{ marginLeft: 8 }}>{repParadas.length}</span>
              </div>
              {repParadas.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>
                  Nenhuma parada registrada para {fmtDate(repDate)}.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {repParadas.map(p => (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                      background: 'var(--bg-surface)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: '8px 12px',
                      borderLeft: `3px solid ${tipoColor[p.tipo] || '#94a3b8'}`,
                    }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-secondary)', minWidth: 110 }}>
                        {p.inicio} – {p.fim}
                      </span>
                      <span className="badge badge-warning" style={{ color: tipoColor[p.tipo] || '#94a3b8', border: `1px solid ${tipoColor[p.tipo] || '#94a3b8'}33`, background: `${tipoColor[p.tipo] || '#94a3b8'}12` }}>
                        {p.tipo}
                      </span>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', flex: 1 }}>{p.descricao || '—'}</span>
                      {p.duracao && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{p.duracao} min</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── SEÇÃO 6: Notas de Manutenção ── */}
            <div className="print-section">
              <div className="section-label">
                <Wrench size={13} style={{ display:'inline', marginRight:6, color:'#3b82f6' }} />
                Notas de Manutenção do Dia
                <span className="badge badge-muted" style={{ marginLeft: 8 }}>{repNotas.length}</span>
              </div>
              {repNotas.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>
                  Nenhuma nota de manutenção registrada para {fmtDate(repDate)}.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {repNotas.map(n => {
                    const pc = n.prioridade === 'Emergencial' ? '#dc2626' : n.prioridade === 'Alta' ? '#f97316' : n.prioridade === 'Média' ? '#eab308' : '#64748b'
                    return (
                      <div key={n.id} style={{
                        display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap',
                        background: 'var(--bg-surface)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)', padding: '8px 12px',
                        borderLeft: `3px solid ${pc}`,
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{n.nome || '—'}</span>
                            <span className="badge badge-muted">{n.numNota || '—'}</span>
                            <span className="badge" style={{ color: pc, border: `1px solid ${pc}33`, background: `${pc}12`, marginLeft: 'auto' }}>{n.prioridade}</span>
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                            {n.centro} · {n.turno} · {fmtDate(n.data)}
                          </div>
                          {n.descricao && (
                            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>{n.descricao}</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Botão fechar no rodapé (visível ao chegar ao final) ── */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-xl)' }}>
              <button
                className="btn btn-ghost"
                onClick={onClose}
                style={{ gap: 8, fontSize: 'var(--text-sm)', padding: '10px 28px', border: '1px solid var(--border)' }}
              >
                <X size={15} /> Fechar Relatório
              </button>
            </div>

            {/* Print footer */}
            <div style={{ marginTop: 'var(--space-xl)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>ThermIQ Relat — Relatório gerado em {new Date().toLocaleString('pt-BR')}</span>
              <span>ID: {report.id}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const tipoColor = { 'Corretiva': '#ef4444', 'Preventiva': '#f97316', 'Operacional': '#3b82f6', 'Emergencial': '#dc2626' }

/* ═══════════════════════════════════════════════════════
   BANCO DE RELATÓRIOS — MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function BancoRelatorios() {
  const { reports, downtimes, maintenances, deleteReport, updateReport, getAllVariables } = useAppData()
  const allVars = getAllVariables()
  const [viewing, setViewing] = useState(null)
  const [editing, setEditing] = useState(null)   // report being edited
  const [confirmDel, setConfirmDel] = useState(null)

  function handleDelete(id) {
    deleteReport(id)
    setConfirmDel(null)
    if (viewing?.id === id) setViewing(null)
  }

  function handleEdit(rep) {
    setEditing(rep)
    setViewing(null) // fecha visualização se aberta
  }

  function handleSaveEdit(id, changes) {
    updateReport(id, changes)
    // C-05: fecha o modal após salvar para que o React re-renderize a partir de 'reports' atualizado
    // O badge 'editado' na tabela será exibido imediatamente
    setEditing(null)
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Banco de Relatórios</h1>
            <p>Histórico de relatórios operacionais salvos</p>
          </div>
          <span className="badge badge-accent" style={{ fontSize: 'var(--text-sm)', padding: '6px 14px' }}>
            {reports.length} relatório{reports.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Turno</th>
                <th>Setor</th>
                <th>Op. COI</th>
                <th>Salvo em</th>
                <th>Variáveis</th>
                <th>KPIs</th>
                <th style={{ width: 110 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 && (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <FileText size={40} />
                    <h4>Nenhum relatório salvo</h4>
                    <p>Complete um lançamento de dados para que apareça aqui.</p>
                  </div>
                </td></tr>
              )}
              {reports.map(rep => {
                const coi       = rep.operadores?.find(o => o.tipo === 'Op. COI')?.nome || '—'
                const savedLabel = rep.savedAt
                  ? new Date(rep.savedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : '—'
                // Quick KPI — kW Gerado / ton Vapor (com filtro por unidade)
                const lans = rep.lancamentos || {}
                let dVap = 0, dKw = 0, hasVap = false, hasKw = false
                allVars.forEach(v => {
                  const d = delta(lans, v.id)
                  if (d === null) return
                  const nm   = v.name.toLowerCase()
                  const unit = (v.unit || '').trim().toLowerCase()
                  if (matchVar(nm, 'vazão vapor', 'vapor gerado', 'vapor') && MASS_UNITS.includes(unit)) {
                    dVap += d * convFactor(v.unit, 'ton'); hasVap = true
                  }
                  if (matchVar(nm, 'gerada', 'gerado') && ENERGY_UNITS.includes(unit)) {
                    dKw += d * convFactor(v.unit, 'kW'); hasKw = true
                  }
                })
                const kw = hasVap && hasKw && dVap > 0 ? round(dKw / dVap, 1) : null

                return (
                  <tr key={rep.id} style={{ cursor: 'pointer' }} onClick={() => setViewing(rep)}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{fmtDate(rep.turnoInfo?.data)}</td>
                    <td><span className="badge badge-muted">{rep.turnoInfo?.turno}</span></td>
                    <td>{rep.turnoInfo?.setor}</td>
                    <td style={{ fontSize: 'var(--text-sm)' }}>{coi}</td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {savedLabel}
                      {rep.editadoEm && (
                        <span className="badge badge-muted" style={{ marginLeft:6, color:'var(--accent-dark)', fontSize:10 }}>editado</span>
                      )}
                    </td>
                    <td><span className="badge badge-accent">{rep.selectedVarIds?.length || 0} vars</span></td>
                    <td>
                      {kw !== null
                        ? <span className="badge badge-muted" style={{ color:'#f97316', fontWeight:700 }}>{kw} kW/ton</span>
                        : <span style={{ color:'var(--text-muted)', fontSize:'var(--text-xs)' }}>—</span>
                      }
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-ghost btn-icon" title="Visualizar relatório"
                          onClick={() => setViewing(rep)}>
                          <Eye size={13} />
                        </button>
                        <button className="btn btn-sm btn-ghost btn-icon" title="Editar lançamentos"
                          onClick={() => handleEdit(rep)}
                          style={{ color:'var(--accent)' }}>
                          <Pencil size={13} />
                        </button>
                        <button className="btn btn-sm btn-danger btn-icon" title="Excluir relatório"
                          onClick={() => setConfirmDel(rep.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Confirm delete modal ── */}
      {confirmDel && (
        <div className="modal-overlay" onClick={() => setConfirmDel(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirmar exclusão</h3>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setConfirmDel(null)}><X size={15}/></button>
            </div>
            <p style={{ marginBottom: 'var(--space-lg)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              Esta ação é permanente e não pode ser desfeita. Deseja excluir este relatório?
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDel)}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Report Detail Modal ── */}
      {viewing && (
        <ReportDetail
          report={viewing}
          downtimes={downtimes}
          maintenances={maintenances}
          allVars={allVars}
          onClose={() => setViewing(null)}
        />
      )}

      {/* ── Edit Modal ── */}
      {editing && (
        <EditModal
          report={editing}
          allVars={allVars}
          onClose={() => setEditing(null)}
          onSave={changes => handleSaveEdit(editing.id, changes)}
        />
      )}
    </div>
  )
}
