import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { Save, AlertCircle, Zap, BookOpen } from 'lucide-react'

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
  // Limite de segurança: máx 200 slots (50h) para evitar loop infinito
  while (cur <= endMin && slots.length < 200) {
    const h = Math.floor(cur / 60) % 24
    const m = cur % 60
    slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
    cur += 15
  }
  return slots
}

/** Gera um valor realista com pequena variação aleatória em torno de uma referência */
function simVal(ref, variance = 0.05) {
  const delta = ref * variance
  return (ref + (Math.random() * 2 - 1) * delta).toFixed(2)
}

/** Referências de valores operacionais típicos por variável */
const VAR_REFS = {
  'v-1':  { ref: 185,   tot: 185,   variance: 0.02 },   // Temp. Vapor Saída
  'v-2':  { ref: 105,   tot: 105,   variance: 0.03 },   // Temp. Água Alimentação
  'v-3':  { ref: 165,   tot: 165,   variance: 0.04 },   // Temp. Gases Chaminé
  'v-4':  { ref: 18.5,  tot: 18.5,  variance: 0.02 },   // Pressão Vapor
  'v-5':  { ref: 22.0,  tot: 22.0,  variance: 0.02 },   // Pressão Água
  'v-6':  { ref: 12.5,  tot: 100,   variance: 0.05 },   // Vazão Vapor (tot = acumulado)
  'v-7':  { ref: 12.8,  tot: 102,   variance: 0.04 },   // Vazão Água
  'v-8':  { ref: 8.2,   tot: 65,    variance: 0.06 },   // Consumo de Cavaco
  'v-9':  { ref: 1850,  tot: 14800, variance: 0.03 },   // Energia Gerada
  'v-10': { ref: 420,   tot: 3360,  variance: 0.04 },   // Energia Consumida
  'v-11': { ref: 280,   tot: 280,   variance: 0.05 },   // Condutividade
  'v-12': { ref: 10.2,  tot: 10.2,  variance: 0.02 },   // pH
}

const DIARIO_EXEMPLO =
`Turno iniciado sem intercorrências. Caldeira operando dentro dos parâmetros normais de pressão e temperatura.

08h30 — Ajuste de pressão realizado após queda de 0.3 kgf/cm² detectada no painel COI. Retorno à normalidade em aprox. 5 min.

10h15 — Troca de turno do operador de carregadeira. Cavaco com umidade ligeiramente elevada (38%), monitoramento contínuo realizado.

Encerramento do turno sem ocorrências adicionais. Todos os parâmetros dentro dos limites operacionais.`

export default function Lancamento() {
  const { getAllVariables, addReport } = useAppData()
  const { user, isAdmin }              = useAuth()
  const navigate                       = useNavigate()

  const [draft, setDraft]     = useState(null)
  const [values, setValues]   = useState({})
  const [diario, setDiario]   = useState('')
  const [saved, setSaved]     = useState(false)
  const [autoFilled, setAutoFilled] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('thermiq_draft_report')
    if (!raw) { navigate('/relatorio/novo'); return }
    const d = JSON.parse(raw)
    setDraft(d)
    // Preserva diário já salvo no draft se houver
    if (d.diario) setDiario(d.diario)
    // Inicializa values
    const init = {}
    d.selectedVarIds.forEach(id => {
      init[id] = { tot_inicial: '', slots: {}, tot_final: '' }
    })
    setValues(init)
  }, [])

  if (!draft) return null

  const allVars   = getAllVariables()
  const selVars   = allVars.filter(v => draft.selectedVarIds.includes(v.id))
  const timeSlots = generateTimeSlots(draft.turnoInfo.horaInicio, draft.turnoInfo.horaFim)

  /* ── Helpers de edição ── */
  function setVal(varId, field, val) {
    setValues(prev => ({
      ...prev,
      [varId]: { ...prev[varId], [field]: val },
    }))
  }

  function setSlotVal(varId, time, val) {
    setValues(prev => ({
      ...prev,
      [varId]: {
        ...prev[varId],
        slots: { ...prev[varId]?.slots, [time]: val },
      },
    }))
  }

  /* ── Auto-preenchimento (admin) ── */
  function handleAutoFill() {
    const next = {}
    selVars.forEach(v => {
      const cfg = VAR_REFS[v.id] || { ref: 100, tot: 800, variance: 0.05 }
      const slots = {}
      timeSlots.forEach(t => { slots[t] = simVal(cfg.ref, cfg.variance) })
      const totI = simVal(cfg.tot, 0.01)
      const totF = (parseFloat(totI) + cfg.ref * timeSlots.length * 0.25 * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2)
      next[v.id] = { tot_inicial: totI, slots, tot_final: totF }
    })
    setValues(next)
    if (!diario) setDiario(DIARIO_EXEMPLO)
    setAutoFilled(true)
  }

  /* ── Validação ── */
  function isComplete() {
    // M-05: exige que existam time slots (horaFim preenchido e válido)
    if (timeSlots.length === 0) return false
    return selVars.every(v => {
      const entry = values[v.id]
      if (!entry) return false
      if (!entry.tot_inicial || !entry.tot_final) return false
      return timeSlots.every(t => !!entry.slots?.[t])
    })
  }

  /* ── Salvar ── */
  function handleSave() {
    const report = {
      ...draft,
      diario,
      lancamentos: values,
      timeSlots,
      savedAt: new Date().toISOString(),
      criadoPor: user?.name,
    }
    addReport(report)
    sessionStorage.removeItem('thermiq_draft_report')
    setSaved(true)
    setTimeout(() => navigate('/banco'), 1200)
  }

  const { turnoInfo, operadores, combustiveis } = draft

  return (
    <div className="fade-in">
      {/* ── Cabeçalho ── */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Lançamento de Dados</h1>
            <p>{turnoInfo.data} · {turnoInfo.turno} · {turnoInfo.setor}</p>
          </div>
          <div style={{ display:'flex', gap:'var(--space-sm)', alignItems:'center' }}>
            {isAdmin() && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAutoFill}
                title="Preenche todos os campos com valores operacionais realistas (modo admin)"
                style={{ borderColor: autoFilled ? 'var(--leaf)' : undefined, color: autoFilled ? 'var(--text-primary)' : undefined }}
              >
                <Zap size={15}/>
                {autoFilled ? 'Replicar Valores' : 'Auto-preencher'}
              </button>
            )}
            <button
              className="btn btn-success"
              onClick={handleSave}
              disabled={!isComplete() || saved}
            >
              <Save size={16}/>
              {saved ? 'Salvo!' : 'Salvar Relatório'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Info do turno (3 cards resumo) ── */}
      <div className="grid-3" style={{ marginBottom:'var(--space-lg)' }}>
        <div className="card">
          <div className="section-label">Turno</div>
          <table style={{ fontSize:'var(--text-sm)' }}>
            <tbody>
              {[
                ['Data',   turnoInfo.data],
                ['Turno',  turnoInfo.turno],
                ['Início', turnoInfo.horaInicio],
                ['Fim',    turnoInfo.horaFim],
                ['Setor',  turnoInfo.setor],
              ].map(([k,v]) => (
                <tr key={k}>
                  <td style={{ color:'var(--text-muted)', paddingRight:16, paddingBottom:4 }}>{k}</td>
                  <td style={{ color:'var(--text-primary)', fontWeight:500 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="section-label">Operadores</div>
          <table style={{ fontSize:'var(--text-sm)' }}>
            <tbody>
              {operadores.map(op => (
                <tr key={op.id}>
                  <td style={{ color:'var(--text-muted)', paddingRight:16, paddingBottom:4 }}>{op.tipo}</td>
                  <td style={{ color:'var(--text-primary)', fontWeight:500 }}>{op.nome || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="section-label">Combustível</div>
          {combustiveis.map(c => (
            <p key={c.id} style={{ fontSize:'var(--text-sm)', color:'var(--text-secondary)', marginBottom:4 }}>
              {c.mistura || '—'} {c.umidade ? `· ${c.umidade}% umidade` : ''}
            </p>
          ))}
        </div>
      </div>

      {/* ── Alerta de campos incompletos ── */}
      {!isComplete() && (
        <div style={{ display:'flex', gap:8, alignItems:'center', padding:'10px 14px', background:'var(--warning-glow)', border:'1px solid #fef3c7', borderRadius:'var(--radius-md)', marginBottom:'var(--space-md)', fontSize:'var(--text-sm)', color:'var(--warning)' }}>
          <AlertCircle size={15}/>
          {timeSlots.length === 0
            ? 'Preencha o horário de fim do turno para habilitar o lançamento de dados.'
            : 'Certifique-se de preencher todos os campos (Iniciais, Finais e Slots) para salvar o relatório.'}
        </div>
      )}

      {/* ── Tabelas de variáveis ── */}
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
                  <th style={{ background:'var(--bg-surface)', minWidth:140 }}>Tot. Inicial</th>
                  {timeSlots.map(t => <th key={t} style={{ minWidth:78, textAlign:'center' }}>{t}</th>)}
                  <th style={{ background:'var(--bg-surface)', minWidth:140 }}>Tot. Final</th>
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

      {/* ── Diário de Bordo ── */}
      <div className="card" style={{ marginBottom:'var(--space-lg)' }}>
        <div className="card-header">
          <span className="card-title">
            <BookOpen size={16} />
            Diário de Bordo
          </span>
          <span style={{ fontSize:'var(--text-xs)', color: diario.length >= MAX_DIARIO ? 'var(--danger)' : 'var(--text-muted)' }}>
            {diario.length} / {MAX_DIARIO}
          </span>
        </div>
        <textarea
          id="lancamento-diario"
          placeholder="Registre aqui as ocorrências relevantes do turno: alterações de processo, manutenções realizadas, eventos operacionais, observações da equipe..."
          value={diario}
          onChange={e => setDiario(e.target.value.slice(0, MAX_DIARIO))}
          style={{ minHeight: 160 }}
        />
        <p style={{ fontSize:'var(--text-xs)', color:'var(--text-muted)', marginTop:'var(--space-sm)' }}>
          O diário de bordo é preenchido ao final do turno e fica registrado junto ao relatório.
        </p>
      </div>

      {/* ── Botão salvar inferior ── */}
      <div style={{ display:'flex', justifyContent:'flex-end', gap:'var(--space-sm)', marginTop:'var(--space-lg)' }}>
        {isAdmin() && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAutoFill}
            style={{ borderColor: autoFilled ? 'var(--leaf)' : undefined, color: autoFilled ? 'var(--text-primary)' : undefined }}
          >
            <Zap size={15}/>
            {autoFilled ? 'Replicar Valores' : 'Simulação Assistida'}
          </button>
        )}
        <button
          className="btn btn-success"
          onClick={handleSave}
          disabled={!isComplete() || saved}
        >
          <Save size={16}/>
          {saved ? '✓ Relatório salvo!' : 'Salvar Relatório'}
        </button>
      </div>
    </div>
  )
}
