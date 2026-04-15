import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { Plus, Trash2, CheckSquare, Square, ArrowRight } from 'lucide-react'

const TURNOS = ['Turno A', 'Turno B', 'Turno C', 'Turno D']
const SETORES = ['Caldeira 01', 'Caldeira 02', 'Caldeira 03', 'Geral']

function today() {
  return new Date().toISOString().slice(0,10)
}
function nowTime() {
  return new Date().toTimeString().slice(0,5)
}

export default function NovoRelatorio() {
  const { categories, getAllVariables } = useAppData()
  const { user }                        = useAuth()
  const navigate                        = useNavigate()

  // Turno info
  const [turnoInfo, setTurnoInfo] = useState({
    data: today(),
    turno: TURNOS[0],
    horaInicio: nowTime(),
    horaFim: '',
    setor: SETORES[0],
  })

  // Operadores
  const [operadores, setOperadores] = useState([
    { id: 1, tipo: 'Op. COI',         nome: '' },
    { id: 2, tipo: 'Op. Campo',       nome: '' },
    { id: 3, tipo: 'Auxiliar',        nome: '' },
    { id: 4, tipo: 'Op. Carregadeira',nome: '' },
  ])

  // Combustível
  const [combustiveis, setCombustiveis] = useState([
    { id: 1, mistura: '', umidade: '' }
  ])

  // Diário de bordo — preenchido na tela de Lançamento

  // Variáveis selecionadas
  const allVars = getAllVariables()
  const [selectedVars, setSelectedVars] = useState(new Set(allVars.map(v => v.id)))

  function toggleVar(id) {
    setSelectedVars(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function toggleAll() {
    if (selectedVars.size === allVars.length) {
      setSelectedVars(new Set())
    } else {
      setSelectedVars(new Set(allVars.map(v => v.id)))
    }
  }

  function addOperador() {
    setOperadores(prev => [...prev, { id: Date.now(), tipo: 'Auxiliar', nome: '' }])
  }

  function removeOperador(id) {
    setOperadores(prev => prev.filter(o => o.id !== id))
  }

  function addCombustivel() {
    setCombustiveis(prev => [...prev, { id: Date.now(), mistura: '', umidade: '' }])
  }

  function removeCombustivel(id) {
    setCombustiveis(prev => prev.filter(c => c.id !== id))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const draft = {
      turnoInfo,
      operadores,
      combustiveis,
      diario: '',
      selectedVarIds: [...selectedVars],
      criadoPor: user?.name,
    }
    sessionStorage.setItem('thermiq_draft_report', JSON.stringify(draft))
    navigate('/relatorio/lancamento')
  }

  const allChecked = selectedVars.size === allVars.length
  const someChecked = selectedVars.size > 0 && !allChecked

  return (
    <form className="fade-in" onSubmit={handleSubmit}>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Novo Relatório Operacional</h1>
            <p>Configure as informações do turno antes do lançamento de dados</p>
          </div>
          <button type="submit" className="btn btn-primary" disabled={selectedVars.size === 0}>
            Finalizar Cadastro <ArrowRight size={16}/>
          </button>
        </div>
      </div>

      {/* ── Seção 1: Informações de Turno ── */}
      <div className="card" style={{ marginBottom:'var(--space-lg)' }}>
        <div className="card-header">
          <span className="card-title">📋 Informações de Turno</span>
        </div>

        <div className="form-row" style={{ marginBottom:'var(--space-md)' }}>
          <div className="form-group">
            <label htmlFor="nr-data">Data</label>
            <input id="nr-data" type="date" value={turnoInfo.data}
              onChange={e => setTurnoInfo(p => ({ ...p, data: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label htmlFor="nr-turno">Turno</label>
            <select id="nr-turno" value={turnoInfo.turno}
              onChange={e => setTurnoInfo(p => ({ ...p, turno: e.target.value }))}>
              {TURNOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="nr-inicio">Hora Início</label>
            <input id="nr-inicio" type="time" value={turnoInfo.horaInicio}
              onChange={e => setTurnoInfo(p => ({ ...p, horaInicio: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label htmlFor="nr-fim">Hora Fim</label>
            <input id="nr-fim" type="time" value={turnoInfo.horaFim}
              onChange={e => setTurnoInfo(p => ({ ...p, horaFim: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label htmlFor="nr-setor">Setor</label>
            <select id="nr-setor" value={turnoInfo.setor}
              onChange={e => setTurnoInfo(p => ({ ...p, setor: e.target.value }))}>
              {SETORES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="section-label">Operadores</div>
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-sm)' }}>
          {operadores.map((op, i) => (
            <div key={op.id} style={{ display:'flex', gap:'var(--space-sm)', alignItems:'center' }}>
              <select
                style={{ width:200, flexShrink:0 }}
                value={op.tipo}
                onChange={e => setOperadores(prev => prev.map(o => o.id === op.id ? { ...o, tipo: e.target.value } : o))}
              >
                {['Op. COI','Op. Campo','Auxiliar','Op. Carregadeira','Assistente'].map(t => <option key={t}>{t}</option>)}
              </select>
              <input
                placeholder="Nome completo"
                value={op.nome}
                onChange={e => setOperadores(prev => prev.map(o => o.id === op.id ? { ...o, nome: e.target.value } : o))}
              />
              {i > 0 && ( // A-03: permite remover qualquer operador exceto o primeiro
                <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeOperador(op.id)}>
                  <Trash2 size={13}/>
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop:12 }} onClick={addOperador}>
          <Plus size={14}/> Adicionar operador
        </button>
      </div>

      {/* ── Seção 2: Combustível ── */}
      <div className="card" style={{ marginBottom:'var(--space-lg)' }}>
        <div className="card-header">
          <span className="card-title">🔥 Informações de Combustível</span>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-md)' }}>
          {combustiveis.map((c, i) => (
            <div key={c.id} style={{ display:'flex', gap:'var(--space-sm)', alignItems:'flex-end' }}>
              <div className="form-group" style={{ flex:1 }}>
                <label>Mistura Realizada</label>
                <input
                  placeholder="Ex: Cavaco 70% + Bagaço 30%"
                  value={c.mistura}
                  onChange={e => setCombustiveis(prev => prev.map(x => x.id === c.id ? { ...x, mistura: e.target.value } : x))}
                />
              </div>
              <div className="form-group" style={{ width:140 }}>
                <label>Umidade (%)</label>
                <input
                  type="number" min="0" max="100" step="0.1"
                  placeholder="Ex: 35"
                  value={c.umidade}
                  onChange={e => setCombustiveis(prev => prev.map(x => x.id === c.id ? { ...x, umidade: e.target.value } : x))}
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

      {/* Diário de Bordo foi movido para a tela de Lançamento */}

      {/* ── Seção 4: Variáveis ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">📊 Variáveis de Processo</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={toggleAll}>
            {allChecked ? <CheckSquare size={14}/> : <Square size={14}/>}
            {allChecked ? 'Desmarcar Todas' : 'Selecionar Todas'}
          </button>
        </div>

        {categories.map(cat => (
          <div key={cat.id} style={{ marginBottom:'var(--space-md)' }}>
            <div className="section-label">{cat.name}</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'4px' }}>
              {cat.variables.map(v => (
                <label key={v.id} className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={selectedVars.has(v.id)}
                    onChange={() => toggleVar(v.id)}
                  />
                  <span>{v.name} <span style={{ color:'var(--text-muted)', fontSize:'var(--text-xs)' }}>({v.unit})</span></span>
                </label>
              ))}
            </div>
          </div>
        ))}

        {allVars.length === 0 && (
          <div className="empty-state">
            <p>Nenhuma variável cadastrada. Acesse a Tela 1 para cadastrar variáveis.</p>
          </div>
        )}

        <div style={{ textAlign:'right', marginTop:'var(--space-md)', color:'var(--text-muted)', fontSize:'var(--text-xs)' }}>
          {selectedVars.size} de {allVars.length} variáveis selecionadas
        </div>
      </div>
    </form>
  )
}
