import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { Save, AlertCircle, Zap, BookOpen, Plus, Trash2 } from 'lucide-react'

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

  const [ draft, setDraft ] = useState(null)
  const [ values, setValues ] = useState({})
  const [ diario, setDiario ] = useState('')
  const [ combustiveis, setCombustiveis ] = useState([{ id: 1, mistura: '', umidade: '' }])
  const [ localParadas, setLocalParadas ] = useState([])
  const [ localNotas, setLocalNotas ]     = useState([])
  const [ saved, setSaved ] = useState(false)
  const [ autoFilled, setAutoFilled ] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('thermiq_draft_report')
    if (!raw) { navigate('/relatorio/novo'); return }
    const d = JSON.parse(raw)
    setDraft(d)
    if (d.diario) setDiario(d.diario)
    if (d.combustiveis && d.combustiveis.length > 0) {
      setCombustiveis(d.combustiveis)
    }
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

  /* ── Helpers de Combustível ── */
  function addCombustivel() {
    setCombustiveis(prev => [...prev, { id: Date.now(), mistura: '', umidade: '' }])
  }
  function removeCombustivel(id) {
    setCombustiveis(prev => prev.filter(c => c.id !== id))
  }
  function updateCombustivel(id, field, val) {
    setCombustiveis(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c))
  }

  /* ── Helpers de Paradas ── */
  function addLocalParada() {
    setLocalParadas(prev => [...prev, { id: Date.now(), inicio: '', fim: '', tipo: 'Programada', descricao: '' }])
  }
  function removeLocalParada(id) {
    setLocalParadas(prev => prev.filter(p => p.id !== id))
  }
  function updateLocalParada(id, field, val) {
    setLocalParadas(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p))
  }

  /* ── Helpers de Notas ── */
  function addLocalNota() {
    setLocalNotas(prev => [...prev, { id: Date.now(), numNota: '', descricao: '', centro: 'MEC-GER', prioridade: 'Média' }])
  }
  function removeLocalNota(id) {
    setLocalNotas(prev => prev.filter(n => n.id !== id))
  }
  function updateLocalNota(id, field, val) {
    setLocalNotas(prev => prev.map(n => n.id === id ? { ...n, [field]: val } : n))
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
  const { addDowntime, addMaintenance } = useAppData()

  function handleSave() {
    const reportDate = draft.turnoInfo.data
    const reportTurno = draft.turnoInfo.turno
    const solicitante = user?.name || 'Operador'

    // 1. Salvar paradas vinculadas
    localParadas.forEach(p => {
      if (p.inicio) {
        addDowntime({ ...p, data: reportDate, turno: reportTurno })
      }
    })

    // 2. Salvar notas vinculadas
    localNotas.forEach(n => {
      if (n.descricao) {
        addMaintenance({ ...n, data: reportDate, turno: reportTurno, nome: solicitante })
      }
    })

    const report = {
      ...draft,
      diario,
      combustiveis,
      lancamentos: values,
      timeSlots,
      savedAt: new Date().toISOString(),
      criadoPor: solicitante,
    }
    addReport(report)
    sessionStorage.removeItem('thermiq_draft_report')
    setSaved(true)
    setTimeout(() => navigate('/banco'), 1200)
  }

  const { turnoInfo, operadores } = draft

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
      {/* ── Seção 2: Diário de Bordo ── */}
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
          placeholder="Registre aqui as ocorrências relevantes do turno..."
          value={diario}
          onChange={e => setDiario(e.target.value.slice(0, MAX_DIARIO))}
          style={{ minHeight: 120 }}
        />
      </div>

      {/* ── Seção 3: Matriz Energética / Combustível ── */}
      <div className="card" style={{ marginBottom:'var(--space-lg)' }}>
        <div className="card-header">
          <span className="card-title">Matriz Energética / Combustível</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-md)' }}>
          {combustiveis.map((c, i) => (
            <div key={c.id} style={{ display:'flex', gap:'var(--space-sm)', alignItems:'flex-end' }}>
              <div className="form-group" style={{ flex:1 }}>
                <label>Mistura Realizada</label>
                <input
                  placeholder="Ex: Cavaco 70% + Bagaço 30%"
                  value={c.mistura}
                  onChange={e => updateCombustivel(c.id, 'mistura', e.target.value)}
                />
              </div>
              <div className="form-group" style={{ width:140 }}>
                <label>Umidade (%)</label>
                <input
                  type="number" min="0" max="100" step="0.1"
                  placeholder="0.0"
                  value={c.umidade}
                  onChange={e => updateCombustivel(c.id, 'umidade', e.target.value)}
                />
              </div>
              {i > 0 && (
                <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeCombustivel(c.id)}>
                  <Trash2 size={13}/>
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop:12 }} onClick={addCombustivel}>
          <Plus size={14}/> Adicionar combustível
        </button>
      </div>

      <div className="grid-2" style={{ marginBottom:'var(--space-lg)' }}>
        {/* ── Seção: Paradas de Processo ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Registro de Paradas</span>
            <button className="btn btn-ghost btn-xs" onClick={addLocalParada}><Plus size={14}/> Add</button>
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {localParadas.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Nenhuma parada registrada.</p>}
            {localParadas.map((p, idx) => (
              <div key={p.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input type="time" value={p.inicio} onChange={e => updateLocalParada(p.id, 'inicio', e.target.value)} style={{ width: 85, fontSize: 12 }} />
                  <input type="time" value={p.fim} onChange={e => updateLocalParada(p.id, 'fim', e.target.value)} style={{ width: 85, fontSize: 12 }} />
                  <select value={p.tipo} onChange={e => updateLocalParada(p.id, 'tipo', e.target.value)} style={{ fontSize: 12, flex: 1 }}>
                    {['Programada', 'Elétrica', 'Mecânica', 'Operacional', 'Processo'].map(t => <option key={t}>{t}</option>)}
                  </select>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => removeLocalParada(p.id)}><Trash2 size={13}/></button>
                </div>
                <input 
                  placeholder="Descrição da parada..." 
                  value={p.descricao} 
                  onChange={e => updateLocalParada(p.id, 'descricao', e.target.value)} 
                  style={{ fontSize: 12 }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Seção: Notas de Manutenção ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Notas de Manutenção</span>
            <button className="btn btn-ghost btn-xs" onClick={addLocalNota}><Plus size={14}/> Add</button>
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {localNotas.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Nenhuma nota registrada.</p>}
            {localNotas.map((n, idx) => (
              <div key={n.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input placeholder="Nº Nota" value={n.numNota} onChange={e => updateLocalNota(n.id, 'numNota', e.target.value)} style={{ width: 80, fontSize: 12 }} />
                  <select value={n.centro} onChange={e => updateLocalNota(n.id, 'centro', e.target.value)} style={{ fontSize: 12, width: 110 }}>
                    {['MEC-GER', 'ELE-GER', 'CALD-GER', 'MANT-UTL'].map(c => <option key={c}>{c}</option>)}
                  </select>
                  <select value={n.prioridade} onChange={e => updateLocalNota(n.id, 'prioridade', e.target.value)} style={{ fontSize: 12, flex: 1 }}>
                    {['Emergencial', 'Alta', 'Média', 'Baixa'].map(p => <option key={p}>{p}</option>)}
                  </select>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => removeLocalNota(n.id)}><Trash2 size={13}/></button>
                </div>
                <input 
                  placeholder="Ocorrência técnico/manutenção..." 
                  value={n.descricao} 
                  onChange={e => updateLocalNota(n.id, 'descricao', e.target.value)} 
                  style={{ fontSize: 12 }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabela Unificada de Lançamentos (Fiel ao Modelo) ── */}
      <div className="card" style={{ marginBottom:'var(--space-md)', padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid var(--border)' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-card)' }}>
              {/* Linha 1: Nomes das Variáveis */}
              <tr>
                <th style={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border)',
                  minWidth: 160, 
                  position: 'sticky', 
                  left: 0, 
                  zIndex: 11
                }}></th>
                {selVars.map(v => (
                  <th key={v.id} style={{ 
                    border: '1px solid var(--border)',
                    padding: '8px 4px',
                    textAlign: 'center', 
                    fontWeight: 700, 
                    color: 'var(--text-primary)',
                    fontSize: 11,
                    lineHeight: 1.2,
                    minWidth: 100,
                    maxWidth: 120,
                    whiteSpace: 'normal',
                    wordBreak: 'break-word'
                  }}>
                    {v.name}<br/>
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{v.unit}</span>
                  </th>
                ))}
              </tr>
              {/* Linha 2: Hora / Valor */}
              <tr>
                <th style={{ 
                  background: 'var(--bg-surface)', 
                  border: '1px solid var(--border)',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                  position: 'sticky', 
                  left: 0, 
                  zIndex: 11
                }}>
                  Hora
                </th>
                {selVars.map(v => (
                  <th key={`val-${v.id}`} style={{ 
                    background: 'var(--bg-surface)', 
                    border: '1px solid var(--border)',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: 13
                  }}>
                    Valor
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Linha: Totalizador Inicial */}
              <tr>
                <td style={{ 
                  fontWeight: 600, 
                  color: 'var(--text-primary)', 
                  position: 'sticky', 
                  left: 0, 
                  background: 'var(--bg-surface)',
                  zIndex: 5,
                  border: '1px solid var(--border)',
                  padding: '8px 12px',
                  whiteSpace: 'nowrap'
                }}>
                  Totalizador Inicial:
                </td>
                {selVars.map(v => (
                  <td key={v.id} style={{ border: '1px solid var(--border)', padding: '4px 8px' }}>
                    <input
                      className="cell-input"
                      type="number"
                      step="any"
                      value={values[v.id]?.tot_inicial ?? ''}
                      onChange={e => setVal(v.id, 'tot_inicial', e.target.value)}
                      placeholder=""
                      style={{ width: '100%', textAlign: 'center', fontWeight: 600, border: 'none', background: 'transparent' }}
                    />
                  </td>
                ))}
              </tr>

              {/* Linhas de Horários */}
              {timeSlots.map(t => (
                <tr key={t}>
                  <td style={{ 
                    fontWeight: 600, 
                    color: 'var(--text-primary)', 
                    textAlign: 'center',
                    position: 'sticky', 
                    left: 0, 
                    background: 'white',
                    zIndex: 5,
                    border: '1px solid var(--border)',
                    padding: '4px 12px',
                    fontSize: 13
                  }}>
                    {t}
                  </td>
                  {selVars.map(v => (
                    <td key={v.id} style={{ border: '1px solid var(--border)', padding: '0 8px' }}>
                      <input
                        className="cell-input"
                        type="number"
                        step="any"
                        value={values[v.id]?.slots?.[t] ?? ''}
                        onChange={e => setSlotVal(v.id, t, e.target.value)}
                        placeholder=""
                        style={{ width: '100%', textAlign: 'center', border: 'none', background: 'transparent', padding: '6px' }}
                      />
                    </td>
                  ))}
                </tr>
              ))}

              {/* Linha: Totalizador Final */}
              <tr>
                <td style={{ 
                  fontWeight: 600, 
                  color: 'var(--text-primary)', 
                  position: 'sticky', 
                  left: 0, 
                  background: 'var(--bg-surface)',
                  zIndex: 5,
                  border: '1px solid var(--border)',
                  padding: '8px 12px',
                  whiteSpace: 'nowrap'
                }}>
                  Totalizador Final:
                </td>
                {selVars.map(v => (
                  <td key={v.id} style={{ border: '1px solid var(--border)', padding: '4px 8px' }}>
                    <input
                      className="cell-input"
                      type="number"
                      step="any"
                      value={values[v.id]?.tot_final ?? ''}
                      onChange={e => setVal(v.id, 'tot_final', e.target.value)}
                      placeholder=""
                      style={{ width: '100%', textAlign: 'center', fontWeight: 600, border: 'none', background: 'transparent' }}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerta de campos incompletos */}
      {!isComplete() && (
        <div style={{ display:'flex', gap:8, alignItems:'center', padding:'10px 14px', background:'var(--warning-glow)', border:'1px solid #fef3c7', borderRadius:'var(--radius-md)', marginBottom:'var(--space-md)', fontSize:'var(--text-sm)', color:'var(--warning)' }}>
          <AlertCircle size={15}/>
          {timeSlots.length === 0
            ? 'Preencha o horário de fim do turno para habilitar o lançamento de dados.'
            : 'Certifique-se de preencher todos os campos (Iniciais, Finais e Slots) para salvar o relatório.'}
        </div>
      )}

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
